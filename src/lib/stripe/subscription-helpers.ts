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
  console.log('[initializeTrial] ========== TRIAL INITIALIZATION STARTED ==========');
  console.log('[initializeTrial] User ID:', userId);
  console.log('[initializeTrial] Timestamp:', new Date().toISOString());

  try {
    // Step 1: Ensure User exists in Prisma database (required for Subscription foreign key)
    console.log('[initializeTrial] Step 1: Checking if User exists in Prisma database...');
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      console.log('[initializeTrial] User lookup result:', {
        found: !!dbUser,
        userId: dbUser?.id,
        email: dbUser?.email,
      });
    } catch (userLookupError: any) {
      console.error('[initializeTrial] ❌ Error looking up user:', {
        error: userLookupError.message,
        code: userLookupError.code,
      });
      throw userLookupError;
    }

    // If user doesn't exist in Prisma DB, create it
    if (!dbUser) {
      console.log('[initializeTrial] User not found in Prisma DB, creating user record...');
      try {
        dbUser = await prisma.user.create({
          data: {
            id: userId,
            email: null, // Will be updated if available
            name: null,
          },
        });
        console.log('[initializeTrial] ✅ User created in Prisma DB:', {
          userId: dbUser.id,
        });
      } catch (createUserError: any) {
        console.error('[initializeTrial] ❌ Failed to create user in Prisma DB:', {
          error: createUserError.message,
          code: createUserError.code,
          meta: createUserError.meta,
        });
        throw createUserError;
      }
    } else {
      console.log('[initializeTrial] ✅ User exists in Prisma DB');
    }

    // Step 2: Check if subscription already exists
    console.log('[initializeTrial] Step 2: Checking if subscription already exists...');
    let existing;
    try {
      existing = await prisma.subscription.findUnique({
        where: { userId },
      });
      console.log('[initializeTrial] Subscription lookup result:', {
        found: !!existing,
        subscriptionId: existing?.id,
        status: existing?.subscriptionStatus,
        hasTrialEnd: !!existing?.trialEnd,
        trialEnd: existing?.trialEnd?.toISOString(),
      });
    } catch (subLookupError: any) {
      console.error('[initializeTrial] ❌ Error looking up subscription:', {
        error: subLookupError.message,
        code: subLookupError.code,
      });
      throw subLookupError;
    }

    // If subscription exists, don't overwrite it
    if (existing) {
      console.log('[initializeTrial] ✅ Subscription already exists for user:', userId);
      console.log('[initializeTrial] Existing subscription details:', {
        id: existing.id,
        status: existing.subscriptionStatus,
        trialStart: existing.trialStart?.toISOString(),
        trialEnd: existing.trialEnd?.toISOString(),
      });
      return existing;
    }

    // Step 3: Create new trial
    console.log('[initializeTrial] Step 3: Creating new trial...');
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2); // 2 days trial

    console.log('[initializeTrial] Trial dates:', {
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
      days: 2,
    });

    try {
      const subscription = await prisma.subscription.create({
        data: {
          userId,
          trialStart,
          trialEnd,
          subscriptionStatus: 'trialing',
        },
      });

      console.log('[initializeTrial] ✅✅✅ TRIAL CREATED SUCCESSFULLY ✅✅✅');
      console.log('[initializeTrial] Subscription details:', {
        id: subscription.id,
        userId: subscription.userId,
        status: subscription.subscriptionStatus,
        trialStart: subscription.trialStart?.toISOString(),
        trialEnd: subscription.trialEnd?.toISOString(),
      });

      return subscription;
    } catch (createError: any) {
      console.error('[initializeTrial] ❌❌❌ FAILED TO CREATE TRIAL ❌❌❌');
      console.error('[initializeTrial] Error details:', {
        error: createError.message,
        code: createError.code,
        meta: createError.meta,
        cause: createError.cause,
      });
      console.error('[initializeTrial] Full error:', JSON.stringify(createError, Object.getOwnPropertyNames(createError), 2));
      throw createError;
    }
  } catch (error: any) {
    console.error('[initializeTrial] ❌❌❌ UNEXPECTED ERROR ❌❌❌');
    console.error('[initializeTrial] Error type:', typeof error);
    console.error('[initializeTrial] Error name:', error?.name);
    console.error('[initializeTrial] Error message:', error?.message);
    console.error('[initializeTrial] Error stack:', error?.stack);
    throw error;
  } finally {
    console.log('[initializeTrial] ========== TRIAL INITIALIZATION ENDED ==========');
  }
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

