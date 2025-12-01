/**
 * Edge-compatible subscription helpers using Supabase
 * These work in Next.js middleware (Edge Runtime)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Initialize trial period for new user (Edge-compatible)
 * Uses Supabase directly instead of Prisma
 */
export async function initializeTrialEdge(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    console.log('[initializeTrialEdge] ========== TRIAL INITIALIZATION STARTED ==========');
    console.log('[initializeTrialEdge] User ID:', userId);
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[initializeTrialEdge] ❌ Supabase not configured');
      return false;
    }
    
    const queryClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // Check if subscription already exists (use exact Prisma table/column names)
    try {
      const { data, error } = await queryClient
        .from('Subscription')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();
      
      if (data && !error) {
        console.log('[initializeTrialEdge] ✅ Subscription already exists');
        return true;
      }
    } catch (err) {
      console.log('[initializeTrialEdge] Error checking existing subscription:', err);
    }
    
    // Create new trial
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2); // 2 days trial
    
    console.log('[initializeTrialEdge] Creating new trial:', {
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
    });
    
    // Insert into Subscription table using exact Prisma column names (camelCase)
    try {
      const insertData = {
        userId: userId,
        trialStart: trialStart.toISOString(),
        trialEnd: trialEnd.toISOString(),
        subscriptionStatus: 'trialing',
      };
      
      const { data, error } = await queryClient
        .from('Subscription')
        .insert(insertData)
        .select()
        .single();
      
      if (data && !error) {
        console.log('[initializeTrialEdge] ✅✅✅ TRIAL CREATED SUCCESSFULLY ✅✅✅');
        return true;
      } else if (error) {
        console.error('[initializeTrialEdge] ❌ Failed to create trial:', error);
        return false;
      }
    } catch (err: any) {
      console.error('[initializeTrialEdge] ❌ Exception creating trial:', err.message);
      return false;
    }
    
    console.error('[initializeTrialEdge] ❌ Failed to create trial');
    return false;
  } catch (error) {
    console.error('[initializeTrialEdge] ❌❌❌ ERROR ❌❌❌');
    console.error('[initializeTrialEdge] Error:', error);
    return false;
  }
}

export async function hasActiveAccessEdge(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    console.log('[hasActiveAccessEdge] ========== STARTING ACCESS CHECK ==========');
    console.log('[hasActiveAccessEdge] User ID:', userId);
    console.log('[hasActiveAccessEdge] Timestamp:', new Date().toISOString());
    
    // Use service role key for database queries (server-side only, safe in middleware)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl) {
      console.error('[hasActiveAccessEdge] ❌ NEXT_PUBLIC_SUPABASE_URL not configured');
      return false;
    }
    
    let queryClient = supabase;
    
    // If service role key is available, use it for database queries (bypasses RLS)
    if (supabaseServiceKey) {
      queryClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('[hasActiveAccessEdge] ✅ Using service role key for query (bypasses RLS)');
    } else {
      console.log('[hasActiveAccessEdge] ⚠️ Service role key not found, using anon key (may have permission issues)');
    }
    
    // Prisma creates tables with exact model name (capitalized) and columns as defined (camelCase)
    // Use exact names: "Subscription" table with "userId" column
    let subscription = null;
    
    console.log('[hasActiveAccessEdge] Querying Subscription table with userId:', userId);
    
    try {
      const result = await queryClient
        .from('Subscription')
        .select('*')
        .eq('userId', userId)
        .maybeSingle();
      
      console.log('[hasActiveAccessEdge] Query result:', {
        hasData: !!result.data,
        hasError: !!result.error,
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
      });
      
      if (result.data && !result.error) {
        subscription = result.data;
        console.log('[hasActiveAccessEdge] ✅✅✅ FOUND SUBSCRIPTION ✅✅✅');
        console.log('[hasActiveAccessEdge] Subscription ID:', subscription.id);
      } else if (result.error && result.error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected, other errors are real issues
        console.error('[hasActiveAccessEdge] ❌ Query error:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint,
        });
      }
    } catch (err: any) {
      console.error('[hasActiveAccessEdge] ❌ Exception:', {
        message: err.message,
        stack: err.stack,
      });
    }

    if (!subscription) {
      console.log('[hasActiveAccessEdge] ❌ No subscription found for user:', userId);
      if (error) {
        console.error('[hasActiveAccessEdge] Last error:', error);
      }
      return false;
    }

    console.log('[hasActiveAccessEdge] Subscription found:', {
      id: subscription.id,
      userId: subscription.userId,
      status: subscription.subscriptionStatus,
      trialEnd: subscription.trialEnd,
      currentPeriodEnd: subscription.currentPeriodEnd,
    });

    const now = new Date();
    // Prisma creates camelCase columns, use exact names
    const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
    const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null;
    const subscriptionStatus = subscription.subscriptionStatus || '';

    console.log('[hasActiveAccessEdge] Checking access for user:', userId, {
      status: subscriptionStatus,
      trialEnd: trialEnd?.toISOString(),
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      now: now.toISOString(),
    });

    // Check if in trial period
    if (subscriptionStatus === 'trialing' && trialEnd) {
      // Ensure both dates are Date objects
      const nowUTC = new Date(now);
      const trialEndUTC = new Date(trialEnd);
      
      // Validate dates
      if (isNaN(nowUTC.getTime()) || isNaN(trialEndUTC.getTime())) {
        console.error('[hasActiveAccessEdge] ❌ Invalid date values:', {
          now: now,
          trialEnd: trialEnd,
        });
        return false;
      }
      
      // Compare timestamps directly (more reliable than date comparison)
      const nowTimestamp = nowUTC.getTime();
      const trialEndTimestamp = trialEndUTC.getTime();
      const trialValid = nowTimestamp < trialEndTimestamp;
      
      const diffMs = trialEndTimestamp - nowTimestamp;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      console.log('[hasActiveAccessEdge] Trial check:', {
        now: nowUTC.toISOString(),
        trialEnd: trialEndUTC.toISOString(),
        nowTimestamp,
        trialEndTimestamp,
        isValid: trialValid,
        diffMs,
        diffMinutes,
        diffHours,
        diffDays,
      });
      
      if (trialValid) {
        console.log('[hasActiveAccessEdge] ✅✅✅ TRIAL IS ACTIVE ✅✅✅');
        return true;
      } else {
        console.log('[hasActiveAccessEdge] ❌ Trial expired');
      }
    }

    // Check if subscription is active
    if (subscriptionStatus === 'active') {
      if (currentPeriodEnd) {
        const nowUTC = new Date(now);
        const periodEndUTC = new Date(currentPeriodEnd);
        
        // Validate dates
        if (isNaN(nowUTC.getTime()) || isNaN(periodEndUTC.getTime())) {
          console.error('[hasActiveAccessEdge] ❌ Invalid date values for period:', {
            now: now,
            currentPeriodEnd: currentPeriodEnd,
          });
          return false;
        }
        
        // Compare timestamps
        const nowTimestamp = nowUTC.getTime();
        const periodEndTimestamp = periodEndUTC.getTime();
        const periodValid = nowTimestamp < periodEndTimestamp;
        
        if (periodValid) {
          console.log('[hasActiveAccessEdge] ✅✅✅ ACTIVE SUBSCRIPTION ✅✅✅');
          return true;
        } else {
          console.log('[hasActiveAccessEdge] ❌ Active subscription but period ended');
        }
      } else {
        // If no period end date but status is active, allow access
        console.log('[hasActiveAccessEdge] ✅ Active subscription (no period end date)');
        return true;
      }
    }

    console.log('[hasActiveAccessEdge] ❌ No active access');
    console.log('[hasActiveAccessEdge] ========== ACCESS CHECK COMPLETE ==========');
    return false;
  } catch (error) {
    console.error('[hasActiveAccessEdge] ❌❌❌ ERROR ❌❌❌');
    console.error('[hasActiveAccessEdge] Error:', error);
    console.error('[hasActiveAccessEdge] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return false;
  }
}

