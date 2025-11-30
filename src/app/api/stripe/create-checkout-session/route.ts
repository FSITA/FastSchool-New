import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { STRIPE_PRODUCTS } from '@/lib/stripe/subscription-helpers';
import { verifyAuth } from '@/lib/auth/api-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult; // Error response
    }
    const { user } = authResult;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body; // "monthly" or "yearly"

    if (!plan || !['monthly', 'yearly'].includes(plan)) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "monthly" or "yearly"' },
        { status: 400 }
      );
    }

    const productId = plan === 'monthly' ? STRIPE_PRODUCTS.MONTHLY : STRIPE_PRODUCTS.YEARLY;

    // Get or create Stripe customer
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update subscription with customer ID
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
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product: productId,
            recurring: {
              interval: plan === 'monthly' ? 'month' : 'year',
            },
            unit_amount: plan === 'monthly' ? 1000 : 10000, // €10 or €100 in cents
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/pricing`,
      metadata: {
        userId: user.id,
        plan,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

