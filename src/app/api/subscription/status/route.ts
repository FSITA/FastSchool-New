import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getUserSubscription } from '@/lib/stripe/subscription-helpers';

export async function GET(request: NextRequest) {
  console.log('[SUBSCRIPTION-STATUS API] ========== REQUEST RECEIVED ==========');
  
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    
    if (authResult instanceof NextResponse) {
      console.error('[SUBSCRIPTION-STATUS API] ❌ Authentication failed');
      return authResult;
    }
    
    const { user } = authResult;

    if (!user?.id) {
      console.error('[SUBSCRIPTION-STATUS API] ❌ User ID is missing');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SUBSCRIPTION-STATUS API] Fetching subscription for user:', user.id);
    const subscription = await getUserSubscription(user.id);

    if (!subscription) {
      console.log('[SUBSCRIPTION-STATUS API] No subscription found');
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        isTrial: false,
        isActive: false,
        trialEnd: null,
        daysRemaining: null,
      });
    }

    const now = new Date();
    const isTrial = subscription.subscriptionStatus === 'trialing';
    const isActive = subscription.subscriptionStatus === 'active';
    
    let daysRemaining: number | null = null;
    let trialEndDate: Date | null = null;

    if (isTrial && subscription.trialEnd) {
      trialEndDate = new Date(subscription.trialEnd);
      const diffMs = trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      // If trial expired, set daysRemaining to 0 or negative
      if (daysRemaining < 0) {
        daysRemaining = 0;
      }
    }

    console.log('[SUBSCRIPTION-STATUS API] ✅ Subscription status:', {
      hasSubscription: true,
      status: subscription.subscriptionStatus,
      isTrial,
      isActive,
      daysRemaining,
      trialEnd: trialEndDate?.toISOString(),
    });

    return NextResponse.json({
      hasSubscription: true,
      status: subscription.subscriptionStatus,
      isTrial,
      isActive,
      trialEnd: subscription.trialEnd?.toISOString() || null,
      daysRemaining,
      plan: subscription.plan,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('[SUBSCRIPTION-STATUS API] ❌❌❌ ERROR ❌❌❌');
    console.error('[SUBSCRIPTION-STATUS API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

