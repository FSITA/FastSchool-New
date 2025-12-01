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
    
    // Check if subscription already exists
    const tableNames = ['Subscription', 'subscription'];
    let existing = null;
    
    for (const tableName of tableNames) {
      try {
        const { data, error } = await queryClient
          .from(tableName)
          .select('*')
          .or(`userId.eq.${userId},user_id.eq.${userId}`)
          .maybeSingle();
        
        if (data && !error) {
          existing = data;
          console.log(`[initializeTrialEdge] ✅ Found existing subscription in "${tableName}"`);
          break;
        }
      } catch (err) {
        // Continue to next table name
      }
    }
    
    if (existing) {
      console.log('[initializeTrialEdge] ✅ Subscription already exists');
      return true;
    }
    
    // Create new trial
    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 2); // 2 days trial
    
    console.log('[initializeTrialEdge] Creating new trial:', {
      trialStart: trialStart.toISOString(),
      trialEnd: trialEnd.toISOString(),
    });
    
    // Try to insert into Subscription table
    for (const tableName of tableNames) {
      try {
        const insertData: any = {
          userId: userId,
          trialStart: trialStart.toISOString(),
          trialEnd: trialEnd.toISOString(),
          subscriptionStatus: 'trialing',
        };
        
        // Also try snake_case version
        const insertDataSnake: any = {
          user_id: userId,
          trial_start: trialStart.toISOString(),
          trial_end: trialEnd.toISOString(),
          subscription_status: 'trialing',
        };
        
        const { data, error } = await queryClient
          .from(tableName)
          .insert(insertData)
          .select()
          .single();
        
        if (data && !error) {
          console.log(`[initializeTrialEdge] ✅✅✅ TRIAL CREATED IN "${tableName}" ✅✅✅`);
          return true;
        }
        
        // Try snake_case if camelCase failed
        if (error) {
          const { data: dataSnake, error: errorSnake } = await queryClient
            .from(tableName)
            .insert(insertDataSnake)
            .select()
            .single();
          
          if (dataSnake && !errorSnake) {
            console.log(`[initializeTrialEdge] ✅✅✅ TRIAL CREATED IN "${tableName}" (snake_case) ✅✅✅`);
            return true;
          }
        }
      } catch (err: any) {
        console.log(`[initializeTrialEdge] Failed to insert into "${tableName}":`, err.message);
      }
    }
    
    console.error('[initializeTrialEdge] ❌ Failed to create trial in any table');
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
    
    // Prisma creates tables with the exact model name (capitalized)
    // But PostgreSQL/Supabase might store them differently
    // Try multiple table name variations
    let subscription = null;
    let error = null;
    
    // Try different table name variations
    // Prisma creates tables with exact model name (capitalized) and columns as defined
    const tableNames = ['Subscription', 'subscription'];
    const userIdColumns = ['userId', 'user_id'];
    
    console.log('[hasActiveAccessEdge] Attempting to find subscription with:');
    console.log('[hasActiveAccessEdge] Table names to try:', tableNames);
    console.log('[hasActiveAccessEdge] User ID columns to try:', userIdColumns);
    console.log('[hasActiveAccessEdge] User ID:', userId);
    
    for (const tableName of tableNames) {
      for (const userIdCol of userIdColumns) {
        try {
          console.log(`[hasActiveAccessEdge] 🔍 Trying table: "${tableName}", column: "${userIdCol}"`);
          
          const result = await queryClient
            .from(tableName)
            .select('*')
            .eq(userIdCol, userId)
            .maybeSingle();
          
          console.log(`[hasActiveAccessEdge] Query result for "${tableName}"/"${userIdCol}":`, {
            hasData: !!result.data,
            hasError: !!result.error,
            errorCode: result.error?.code,
            errorMessage: result.error?.message,
          });
          
          if (result.data && !result.error) {
            subscription = result.data;
            console.log(`[hasActiveAccessEdge] ✅✅✅ FOUND SUBSCRIPTION ✅✅✅`);
            console.log(`[hasActiveAccessEdge] Table: "${tableName}", Column: "${userIdCol}"`);
            console.log(`[hasActiveAccessEdge] Subscription ID:`, subscription.id);
            break;
          }
          
          if (result.error) {
            // Log all errors for debugging
            console.log(`[hasActiveAccessEdge] ❌ Query error for "${tableName}"/"${userIdCol}":`, {
              code: result.error.code,
              message: result.error.message,
              details: result.error.details,
              hint: result.error.hint,
            });
            
            // PGRST116 is "not found" which is expected, other errors are real issues
            if (result.error.code !== 'PGRST116') {
              error = result.error;
            }
          }
        } catch (err: any) {
          console.error(`[hasActiveAccessEdge] ❌ Exception for "${tableName}"/"${userIdCol}":`, {
            message: err.message,
            stack: err.stack,
          });
          error = err;
        }
      }
      
      if (subscription) break;
    }
    
    // If still not found, try using OR query (handles both column names)
    if (!subscription) {
      console.log('[hasActiveAccessEdge] ⚠️ Standard queries failed, trying OR query...');
      for (const tableName of tableNames) {
        try {
          const result = await queryClient
            .from(tableName)
            .select('*')
            .or(`userId.eq.${userId},user_id.eq.${userId}`)
            .maybeSingle();
          
          console.log(`[hasActiveAccessEdge] OR query result for "${tableName}":`, {
            hasData: !!result.data,
            hasError: !!result.error,
            errorCode: result.error?.code,
            errorMessage: result.error?.message,
          });
          
          if (result.data && !result.error) {
            subscription = result.data;
            console.log(`[hasActiveAccessEdge] ✅✅✅ FOUND SUBSCRIPTION VIA OR QUERY ✅✅✅`);
            console.log(`[hasActiveAccessEdge] Table: "${tableName}"`);
            break;
          }
        } catch (err: any) {
          console.error(`[hasActiveAccessEdge] ❌ OR query exception for "${tableName}":`, err.message);
        }
      }
    }

    // If still no subscription, try direct SQL query as last resort
    if (!subscription && supabaseServiceKey) {
      try {
        console.log('[hasActiveAccessEdge] Trying direct SQL query...');
        const { data, error: sqlError } = await queryClient.rpc('get_user_subscription', {
          user_id: userId
        });
        
        if (!sqlError && data) {
          subscription = data;
          console.log('[hasActiveAccessEdge] ✅ Found subscription via RPC');
        }
      } catch (rpcError) {
        console.log('[hasActiveAccessEdge] RPC query failed (this is OK if function doesn\'t exist)');
      }
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
      userId: subscription.userId || subscription.user_id,
      status: subscription.subscriptionStatus || subscription.subscription_status,
      trialEnd: subscription.trialEnd || subscription.trial_end,
      currentPeriodEnd: subscription.currentPeriodEnd || subscription.current_period_end,
    });

    const now = new Date();
    // Handle both camelCase and snake_case column names
    const trialEnd = subscription.trialEnd 
      ? new Date(subscription.trialEnd) 
      : subscription.trial_end 
        ? new Date(subscription.trial_end) 
        : null;
    const currentPeriodEnd = subscription.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd) 
      : subscription.current_period_end
        ? new Date(subscription.current_period_end)
        : null;
    const subscriptionStatus = subscription.subscriptionStatus || subscription.subscription_status || '';

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

