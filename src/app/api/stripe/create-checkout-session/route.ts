import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_PRODUCTS } from '@/lib/stripe/subscription-helpers';
import { verifyAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  console.log('[CHECKOUT] ========== CHECKOUT SESSION CREATION STARTED ==========');
  console.log('[CHECKOUT] Timestamp:', new Date().toISOString());
  
  try {
    // Step 1: Validate environment variables
    console.log('[CHECKOUT] Step 1: Validating environment variables...');
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    console.log('[CHECKOUT] Environment check:', {
      hasStripeSecretKey: !!stripeSecretKey,
      stripeSecretKeyPrefix: stripeSecretKey ? stripeSecretKey.substring(0, 7) + '...' : 'MISSING',
      siteUrl,
      hasProductMonthly: !!STRIPE_PRODUCTS.MONTHLY,
      hasProductYearly: !!STRIPE_PRODUCTS.YEARLY,
      productMonthly: STRIPE_PRODUCTS.MONTHLY,
      productYearly: STRIPE_PRODUCTS.YEARLY,
    });

    if (!stripeSecretKey) {
      console.error('[CHECKOUT] ❌❌❌ STRIPE_SECRET_KEY is missing!');
      return NextResponse.json(
        { error: 'Stripe configuration error: Secret key missing' },
        { status: 500 }
      );
    }

    // Step 2: Verify authentication
    console.log('[CHECKOUT] Step 2: Verifying authentication...');
    const authResult = await verifyAuth(request);
    
    if (authResult instanceof NextResponse) {
      console.error('[CHECKOUT] ❌ Authentication failed:', authResult.status);
      return authResult; // Error response
    }
    
    const { user } = authResult;
    console.log('[CHECKOUT] ✅ Authentication successful:', {
      userId: user?.id,
      userEmail: user?.email,
    });

    if (!user?.id) {
      console.error('[CHECKOUT] ❌ User ID is missing after auth verification');
      return NextResponse.json(
        { error: 'Unauthorized: User ID missing' },
        { status: 401 }
      );
    }

    // Step 3: Parse request body
    console.log('[CHECKOUT] Step 3: Parsing request body...');
    let body;
    try {
      body = await request.json();
      console.log('[CHECKOUT] ✅ Request body parsed:', { plan: body?.plan });
    } catch (parseError) {
      console.error('[CHECKOUT] ❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { plan } = body; // "monthly" or "yearly"

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      console.error('[CHECKOUT] ❌ Invalid plan:', plan);
      return NextResponse.json(
        { error: `Invalid plan: "${plan}". Must be "monthly" or "yearly"` },
        { status: 400 }
      );
    }

    console.log('[CHECKOUT] ✅ Plan validated:', plan);

    // Step 4: Get product ID
    const productId = plan === 'monthly' ? STRIPE_PRODUCTS.MONTHLY : STRIPE_PRODUCTS.YEARLY;
    console.log('[CHECKOUT] Step 4: Product ID selected:', {
      plan,
      productId,
    });

    // Step 5: Fetch price ID from Stripe product
    console.log('[CHECKOUT] Step 5: Fetching price ID from Stripe product...');
    let priceId: string | null = null;
    try {
      console.log('[CHECKOUT] Fetching product from Stripe:', productId);
      const product = await stripe.products.retrieve(productId);
      console.log('[CHECKOUT] ✅ Product retrieved:', {
        productId: product.id,
        productName: product.name,
        productActive: product.active,
      });

      // Get the default price for this product
      const prices = await stripe.prices.list({
        product: productId,
        active: true,
        limit: 10,
      });

      console.log('[CHECKOUT] Prices found for product:', {
        count: prices.data.length,
        prices: prices.data.map(p => ({
          id: p.id,
          type: p.type,
          currency: p.currency,
          unit_amount: p.unit_amount,
          recurring: p.recurring ? {
            interval: p.recurring.interval,
            interval_count: p.recurring.interval_count,
          } : null,
        })),
      });

      // Find the price that matches our plan interval
      const expectedInterval = plan === 'monthly' ? 'month' : 'year';
      const matchingPrice = prices.data.find(
        (p) => p.recurring?.interval === expectedInterval && p.active
      );

      if (matchingPrice) {
        priceId = matchingPrice.id;
        console.log('[CHECKOUT] ✅ Found matching price:', {
          priceId,
          interval: matchingPrice.recurring?.interval,
          amount: matchingPrice.unit_amount,
          currency: matchingPrice.currency,
        });
      } else {
        console.error('[CHECKOUT] ❌ No matching price found for interval:', expectedInterval);
        console.error('[CHECKOUT] Available prices:', prices.data.map(p => ({
          id: p.id,
          interval: p.recurring?.interval,
        })));
        
        // Fallback: use the first active price
        if (prices.data.length > 0) {
          priceId = prices.data[0].id;
          console.log('[CHECKOUT] ⚠️ Using fallback price (first available):', priceId);
        } else {
          throw new Error(`No active prices found for product ${productId}`);
        }
      }
    } catch (stripeError: any) {
      console.error('[CHECKOUT] ❌❌❌ STRIPE API ERROR ❌❌❌');
      console.error('[CHECKOUT] Error type:', stripeError?.type);
      console.error('[CHECKOUT] Error code:', stripeError?.code);
      console.error('[CHECKOUT] Error message:', stripeError?.message);
      console.error('[CHECKOUT] Error stack:', stripeError?.stack);
      console.error('[CHECKOUT] Full error object:', JSON.stringify(stripeError, null, 2));
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch product/price from Stripe',
          details: stripeError?.message || 'Unknown Stripe error',
          code: stripeError?.code,
        },
        { status: 500 }
      );
    }

    if (!priceId) {
      console.error('[CHECKOUT] ❌ Price ID is null after fetching');
      return NextResponse.json(
        { error: 'Failed to get price ID from Stripe product' },
        { status: 500 }
      );
    }

    // Step 6: Get or create Stripe customer
    console.log('[CHECKOUT] Step 6: Getting or creating Stripe customer...');
    console.log('[CHECKOUT] User ID for database lookup:', user.id);
    console.log('[CHECKOUT] User email:', user.email);
    
    let customerId: string;
    
    try {
      // Step 6a: Ensure User exists in Prisma database (required for Subscription foreign key)
      console.log('[CHECKOUT] Step 6a: Checking if User exists in Prisma database...');
      let dbUser;
      try {
        dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        console.log('[CHECKOUT] User lookup result:', {
          found: !!dbUser,
          userId: dbUser?.id,
          email: dbUser?.email,
        });
      } catch (userLookupError: any) {
        console.error('[CHECKOUT] ❌ Error looking up user:', {
          error: userLookupError.message,
          code: userLookupError.code,
        });
        throw userLookupError;
      }

      // If user doesn't exist in Prisma DB, create it
      if (!dbUser) {
        console.log('[CHECKOUT] User not found in Prisma DB, creating user record...');
        try {
          dbUser = await prisma.user.create({
            data: {
              id: user.id,
              email: user.email || null,
              name: user.user_metadata?.name || user.email?.split('@')[0] || null,
            },
          });
          console.log('[CHECKOUT] ✅ User created in Prisma DB:', {
            userId: dbUser.id,
            email: dbUser.email,
          });
        } catch (createUserError: any) {
          console.error('[CHECKOUT] ❌ Failed to create user in Prisma DB:', {
            error: createUserError.message,
            code: createUserError.code,
            meta: createUserError.meta,
          });
          throw createUserError;
        }
      } else {
        console.log('[CHECKOUT] ✅ User exists in Prisma DB');
      }

      // Step 6b: Ensure subscription record exists (initialize trial if needed)
      console.log('[CHECKOUT] Step 6b: Checking if subscription record exists...');
      let subscription;
      try {
        subscription = await prisma.subscription.findUnique({
          where: { userId: user.id },
        });
        console.log('[CHECKOUT] Database subscription lookup result:', {
          found: !!subscription,
          subscriptionId: subscription?.id,
          hasStripeCustomerId: !!subscription?.stripeCustomerId,
          stripeCustomerId: subscription?.stripeCustomerId,
          subscriptionStatus: subscription?.subscriptionStatus,
        });
      } catch (subLookupError: any) {
        console.error('[CHECKOUT] ❌ Error looking up subscription:', {
          error: subLookupError.message,
          code: subLookupError.code,
        });
        throw subLookupError;
      }

      // If no subscription exists, create one with trial
      if (!subscription) {
        console.log('[CHECKOUT] No subscription record found, creating one with trial...');
        try {
          const trialStart = new Date();
          const trialEnd = new Date();
          trialEnd.setDate(trialEnd.getDate() + 2);
          
          subscription = await prisma.subscription.create({
            data: {
              userId: user.id,
              trialStart,
              trialEnd,
              subscriptionStatus: 'trialing',
            },
          });
          console.log('[CHECKOUT] ✅ Subscription record created with trial:', {
            subscriptionId: subscription.id,
            trialEnd: trialEnd.toISOString(),
          });
        } catch (createError: any) {
          console.error('[CHECKOUT] ❌ Failed to create subscription record:', {
            error: createError.message,
            code: createError.code,
            meta: createError.meta,
          });
          throw createError;
        }
      } else {
        console.log('[CHECKOUT] ✅ Subscription record exists');
      }

      customerId = subscription?.stripeCustomerId || '';

      if (!customerId) {
        console.log('[CHECKOUT] No existing Stripe customer, creating new one...');
        console.log('[CHECKOUT] Customer data:', {
          email: user.email || 'NO EMAIL',
          userId: user.id,
        });

        let customer;
        try {
          customer = await stripe.customers.create({
            email: user.email || undefined,
            metadata: {
              userId: user.id,
            },
          });
          console.log('[CHECKOUT] ✅ Stripe customer created:', {
            customerId: customer.id,
            email: customer.email,
          });
        } catch (stripeError: any) {
          console.error('[CHECKOUT] ❌❌❌ STRIPE CUSTOMER CREATION FAILED ❌❌❌');
          console.error('[CHECKOUT] Stripe error:', {
            type: stripeError?.type,
            code: stripeError?.code,
            message: stripeError?.message,
            param: stripeError?.param,
          });
          throw stripeError;
        }

        customerId = customer.id;

        // Update subscription with customer ID
        console.log('[CHECKOUT] Updating database with customer ID...');
        console.log('[CHECKOUT] Update data:', {
          userId: user.id,
          stripeCustomerId: customerId,
        });
        
        try {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { stripeCustomerId: customerId },
          });
          console.log('[CHECKOUT] ✅ Database updated with customer ID');
        } catch (updateError: any) {
          console.error('[CHECKOUT] ❌❌❌ DATABASE UPDATE FAILED ❌❌❌');
          console.error('[CHECKOUT] Update error details:', {
            error: updateError.message,
            code: updateError.code,
            meta: updateError.meta,
            cause: updateError.cause,
          });
          console.error('[CHECKOUT] Full error object:', JSON.stringify(updateError, Object.getOwnPropertyNames(updateError), 2));
          throw updateError;
        }
      } else {
        console.log('[CHECKOUT] ✅ Using existing customer:', customerId);
        
        // Verify customer exists in Stripe
        try {
          const customer = await stripe.customers.retrieve(customerId);
          console.log('[CHECKOUT] ✅ Customer verified in Stripe:', {
            customerId,
            email: customer.email,
            deleted: customer.deleted,
          });
        } catch (verifyError: any) {
          console.error('[CHECKOUT] ⚠️ Customer not found in Stripe, creating new one...');
          console.error('[CHECKOUT] Verify error:', {
            type: verifyError?.type,
            code: verifyError?.code,
            message: verifyError?.message,
          });
          
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            metadata: {
              userId: user.id,
            },
          });
          customerId = customer.id;
          
          try {
            await prisma.subscription.update({
              where: { userId: user.id },
              data: { stripeCustomerId: customerId },
            });
            console.log('[CHECKOUT] ✅ New customer created and saved:', customerId);
          } catch (updateError: any) {
            console.error('[CHECKOUT] ❌ Failed to update database with new customer:', {
              error: updateError.message,
              code: updateError.code,
              meta: updateError.meta,
            });
            throw updateError;
          }
        }
      }
    } catch (dbError: any) {
      console.error('[CHECKOUT] ❌❌❌ DATABASE ERROR ❌❌❌');
      console.error('[CHECKOUT] Error type:', typeof dbError);
      console.error('[CHECKOUT] Error name:', dbError?.name);
      console.error('[CHECKOUT] Error message:', dbError?.message);
      console.error('[CHECKOUT] Error code:', dbError?.code);
      console.error('[CHECKOUT] Error meta:', dbError?.meta);
      console.error('[CHECKOUT] Error cause:', dbError?.cause);
      console.error('[CHECKOUT] Error stack:', dbError instanceof Error ? dbError.stack : 'No stack');
      console.error('[CHECKOUT] Full error object:', JSON.stringify(dbError, Object.getOwnPropertyNames(dbError), 2));
      
      // Check for specific Prisma errors
      if (dbError?.code === 'P2002') {
        console.error('[CHECKOUT] Unique constraint violation detected');
      } else if (dbError?.code === 'P2025') {
        console.error('[CHECKOUT] Record not found');
      } else if (dbError?.code === 'P2003') {
        console.error('[CHECKOUT] Foreign key constraint violation');
      }
      
      return NextResponse.json(
        { 
          error: 'Database error while managing customer',
          details: dbError?.message || 'Unknown database error',
          code: dbError?.code,
          meta: dbError?.meta,
        },
        { status: 500 }
      );
    }

    // Step 7: Create checkout session
    console.log('[CHECKOUT] Step 7: Creating Stripe checkout session...');
    console.log('[CHECKOUT] Checkout session parameters:', {
      customer: customerId,
      mode: 'subscription',
      priceId,
      successUrl: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${siteUrl}/pricing`,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId, // Use price ID instead of price_data
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/pricing`,
        metadata: {
          userId: user.id,
          plan,
        },
      });

      console.log('[CHECKOUT] ✅✅✅ CHECKOUT SESSION CREATED SUCCESSFULLY ✅✅✅');
      console.log('[CHECKOUT] Session details:', {
        sessionId: session.id,
        url: session.url,
        customer: session.customer,
        mode: session.mode,
        status: session.status,
      });

      return NextResponse.json({ 
        sessionId: session.id, 
        url: session.url 
      });
    } catch (sessionError: any) {
      console.error('[CHECKOUT] ❌❌❌ CHECKOUT SESSION CREATION FAILED ❌❌❌');
      console.error('[CHECKOUT] Error type:', sessionError?.type);
      console.error('[CHECKOUT] Error code:', sessionError?.code);
      console.error('[CHECKOUT] Error message:', sessionError?.message);
      console.error('[CHECKOUT] Error param:', sessionError?.param);
      console.error('[CHECKOUT] Error stack:', sessionError?.stack);
      console.error('[CHECKOUT] Full error object:', JSON.stringify(sessionError, null, 2));
      
      return NextResponse.json(
        { 
          error: 'Failed to create checkout session',
          details: sessionError?.message || 'Unknown error',
          code: sessionError?.code,
          param: sessionError?.param,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[CHECKOUT] ❌❌❌ UNEXPECTED ERROR ❌❌❌');
    console.error('[CHECKOUT] Error type:', typeof error);
    console.error('[CHECKOUT] Error name:', error?.name);
    console.error('[CHECKOUT] Error message:', error?.message);
    console.error('[CHECKOUT] Error stack:', error?.stack);
    console.error('[CHECKOUT] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error?.message || 'Unknown error occurred',
        type: error?.name || typeof error,
      },
      { status: 500 }
    );
  } finally {
    console.log('[CHECKOUT] ========== CHECKOUT SESSION CREATION ENDED ==========');
  }
}

