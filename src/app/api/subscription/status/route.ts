import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/api-auth';
import { getUserSubscription } from '@/lib/stripe/subscription-helpers';

export async function GET(request: NextRequest) {
  console.log('[SUBSCRIPTION-STATUS API] ========== REQUEST RECEIVED ==========');
  console.log('[SUBSCRIPTION-STATUS API] Timestamp:', new Date().toISOString());
  console.log('[SUBSCRIPTION-STATUS API] URL:', request.url);
  console.log('[SUBSCRIPTION-STATUS API] Method:', request.method);
  
  try {
    // Verify authentication
    console.log('[SUBSCRIPTION-STATUS API] Step 1: Verifying authentication...');
    const authResult = await verifyAuth(request);
    
    if (authResult instanceof NextResponse) {
      console.error('[SUBSCRIPTION-STATUS API] ❌ Authentication failed');
      console.error('[SUBSCRIPTION-STATUS API] Auth Result Status:', authResult.status);
      return authResult;
    }
    
    const { user } = authResult;
    console.log('[SUBSCRIPTION-STATUS API] ✅ Authentication successful');
    console.log('[SUBSCRIPTION-STATUS API] User ID:', user?.id);
    console.log('[SUBSCRIPTION-STATUS API] User Email:', user?.email);

    if (!user?.id) {
      console.error('[SUBSCRIPTION-STATUS API] ❌ User ID is missing');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[SUBSCRIPTION-STATUS API] Step 2: Fetching subscription from database...');
    console.log('[SUBSCRIPTION-STATUS API] Calling getUserSubscription for user:', user.id);
    const subscription = await getUserSubscription(user.id);
    console.log('[SUBSCRIPTION-STATUS API] Subscription lookup result:', subscription ? 'Found' : 'Not Found');

    if (!subscription) {
      console.log('[SUBSCRIPTION-STATUS API] ❌ No subscription found for user');
      console.log('[SUBSCRIPTION-STATUS API] Returning empty status response');
      return NextResponse.json({
        hasSubscription: false,
        status: null,
        isTrial: false,
        isActive: false,
        trialEnd: null,
        daysRemaining: null,
      });
    }

    console.log('[SUBSCRIPTION-STATUS API] Step 3: Processing subscription data...');
    console.log('[SUBSCRIPTION-STATUS API] Subscription ID:', subscription.id);
    console.log('[SUBSCRIPTION-STATUS API] Subscription Status:', subscription.subscriptionStatus);
    console.log('[SUBSCRIPTION-STATUS API] Trial Start:', subscription.trialStart?.toISOString());
    console.log('[SUBSCRIPTION-STATUS API] Trial End:', subscription.trialEnd?.toISOString());
    console.log('[SUBSCRIPTION-STATUS API] Current Period End:', subscription.currentPeriodEnd?.toISOString());
    console.log('[SUBSCRIPTION-STATUS API] Plan:', subscription.plan);

    const now = new Date();
    const isTrial = subscription.subscriptionStatus === 'trialing';
    const isActive = subscription.subscriptionStatus === 'active';
    
    let daysRemaining: number | null = null;
    let trialEndDate: Date | null = null;

    if (isTrial && subscription.trialEnd) {
      trialEndDate = new Date(subscription.trialEnd);
      const diffMs = trialEndDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      console.log('[SUBSCRIPTION-STATUS API] Trial calculation:', {
        now: now.toISOString(),
        trialEnd: trialEndDate.toISOString(),
        diffMs,
        daysRemaining,
      });
      
      // If trial expired, set daysRemaining to 0 or negative
      if (daysRemaining < 0) {
        console.log('[SUBSCRIPTION-STATUS API] ⚠️ Trial expired, setting daysRemaining to 0');
        daysRemaining = 0;
      }
    }

    console.log('[SUBSCRIPTION-STATUS API] ✅✅✅ FINAL STATUS CALCULATION ✅✅✅');
    console.log('[SUBSCRIPTION-STATUS API] Has Subscription: true');
    console.log('[SUBSCRIPTION-STATUS API] Status:', subscription.subscriptionStatus);
    console.log('[SUBSCRIPTION-STATUS API] Is Trial:', isTrial);
    console.log('[SUBSCRIPTION-STATUS API] Is Active:', isActive);
    console.log('[SUBSCRIPTION-STATUS API] Days Remaining:', daysRemaining);
    console.log('[SUBSCRIPTION-STATUS API] Trial End:', trialEndDate?.toISOString());
    console.log('[SUBSCRIPTION-STATUS API] ============================================');

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
    console.error('[SUBSCRIPTION-STATUS API] Error Type:', typeof error);
    console.error('[SUBSCRIPTION-STATUS API] Error Name:', error?.name);
    console.error('[SUBSCRIPTION-STATUS API] Error Message:', error?.message);
    console.error('[SUBSCRIPTION-STATUS API] Error Stack:', error?.stack);
    console.error('[SUBSCRIPTION-STATUS API] Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    return NextResponse.json(
      { 
        error: 'Failed to get subscription status',
        details: error?.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

