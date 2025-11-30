import { prisma } from '@/lib/prisma';

export const STRIPE_PRODUCTS = {
  MONTHLY: 'prod_TVkIk1he6GaRpZ',
  YEARLY: 'prod_TVkISAXJLCD3Q4',
} as const;

/**
 * Initialize trial period for new user
 * Only creates trial if one doesn't exist (doesn't overwrite existing subscriptions)
 */
export async function initializeTrial(userId: string) {
  // Check if subscription already exists
  const existing = await prisma.subscription.findUnique({
    where: { userId },
  });

  // If subscription exists, don't overwrite it
  if (existing) {
    console.log('[initializeTrial] Subscription already exists for user:', userId);
    return existing;
  }

  // Create new trial
  const trialStart = new Date();
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 2); // 2 days trial

  console.log('[initializeTrial] Creating new trial for user:', userId, {
    trialStart: trialStart.toISOString(),
    trialEnd: trialEnd.toISOString(),
  });

  return await prisma.subscription.create({
    data: {
      userId,
      trialStart,
      trialEnd,
      subscriptionStatus: 'trialing',
    },
  });
}

/**
 * Check if user has active subscription or valid trial
 */
export async function hasActiveAccess(userId: string): Promise<boolean> {
  let subscription;
  
  try {
    console.log('[hasActiveAccess] Starting database query for user:', userId);
    subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    console.log('[hasActiveAccess] Database query completed, subscription:', subscription ? 'found' : 'not found');
  } catch (error) {
    console.error('[hasActiveAccess] ❌❌❌ DATABASE ERROR ❌❌❌');
    console.error('[hasActiveAccess] Error:', error);
    console.error('[hasActiveAccess] Error stack:', error instanceof Error ? error.stack : 'No stack');
    throw error; // Re-throw to be caught by middleware
  }

  if (!subscription) {
    console.log('[hasActiveAccess] ❌ No subscription found for user:', userId);
    return false;
  }

  const now = new Date();

  console.log('[hasActiveAccess] Checking access for user:', userId, {
    status: subscription.subscriptionStatus,
    trialEnd: subscription.trialEnd,
    currentPeriodEnd: subscription.currentPeriodEnd,
    now: now.toISOString(),
    trialEndISO: subscription.trialEnd?.toISOString(),
  });

  // Check if in trial period
  if (subscription.subscriptionStatus === 'trialing' && subscription.trialEnd) {
    const trialValid = now < subscription.trialEnd;
    console.log('[hasActiveAccess] Trial check:', {
      now: now.toISOString(),
      trialEnd: subscription.trialEnd.toISOString(),
      isValid: trialValid,
      diff: subscription.trialEnd.getTime() - now.getTime(),
    });
    if (trialValid) {
      return true;
    } else {
      console.log('[hasActiveAccess] ❌ Trial expired');
    }
  }

  // Check if subscription is active
  if (subscription.subscriptionStatus === 'active') {
    if (subscription.currentPeriodEnd && now < subscription.currentPeriodEnd) {
      console.log('[hasActiveAccess] ✅ Active subscription');
      return true;
    } else {
      console.log('[hasActiveAccess] ❌ Active subscription but period ended');
    }
  }

  console.log('[hasActiveAccess] ❌ No active access');
  return false;
}

/**
 * Get user subscription status
 */
export async function getUserSubscription(userId: string) {
  return await prisma.subscription.findUnique({
    where: { userId },
  });
}

