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
    let customerId: string;
    
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: user.id },
      });

      console.log('[CHECKOUT] Database subscription lookup:', {
        found: !!subscription,
        hasStripeCustomerId: !!subscription?.stripeCustomerId,
        stripeCustomerId: subscription?.stripeCustomerId,
      });

      customerId = subscription?.stripeCustomerId || '';

      if (!customerId) {
        console.log('[CHECKOUT] No existing customer, creating new Stripe customer...');
        console.log('[CHECKOUT] Customer data:', {
          email: user.email || 'NO EMAIL',
          userId: user.id,
        });

        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: {
            userId: user.id,
          },
        });

        customerId = customer.id;
        console.log('[CHECKOUT] ✅ Stripe customer created:', {
          customerId,
          email: customer.email,
        });

        // Update subscription with customer ID
        console.log('[CHECKOUT] Updating database with customer ID...');
        await prisma.subscription.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            stripeCustomerId: customerId,
          },
          update: {
            stripeCustomerId: customerId,
          },
        });
        console.log('[CHECKOUT] ✅ Database updated with customer ID');
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
          const customer = await stripe.customers.create({
            email: user.email || undefined,
            metadata: {
              userId: user.id,
            },
          });
          customerId = customer.id;
          await prisma.subscription.update({
            where: { userId: user.id },
            data: { stripeCustomerId: customerId },
          });
          console.log('[CHECKOUT] ✅ New customer created and saved:', customerId);
        }
      }
    } catch (dbError) {
      console.error('[CHECKOUT] ❌❌❌ DATABASE ERROR ❌❌❌');
      console.error('[CHECKOUT] Error:', dbError);
      console.error('[CHECKOUT] Error stack:', dbError instanceof Error ? dbError.stack : 'No stack');
      return NextResponse.json(
        { error: 'Database error while managing customer' },
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

