/**
 * Edge-compatible subscription helpers using Supabase
 * These work in Next.js middleware (Edge Runtime)
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function hasActiveAccessEdge(
  supabase: any,
  userId: string
): Promise<boolean> {
  try {
    console.log('[hasActiveAccessEdge] Starting Supabase query for user:', userId);
    
    // Use service role key for database queries (server-side only, safe in middleware)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    let queryClient = supabase;
    
    // If service role key is available, use it for database queries (bypasses RLS)
    if (supabaseServiceKey && supabaseUrl) {
      queryClient = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      console.log('[hasActiveAccessEdge] Using service role key for query (bypasses RLS)');
    } else {
      console.log('[hasActiveAccessEdge] ⚠️ Service role key not found, using anon key (may have permission issues)');
    }
    
    // Try both capitalized and lowercase table names (Supabase/PostgreSQL case sensitivity)
    let { data: subscription, error } = await queryClient
      .from('Subscription')
      .select('*')
      .eq('userId', userId)
      .single();
    
    // If that fails, try lowercase
    if (error && error.code === '42P01') {
      console.log('[hasActiveAccessEdge] Trying lowercase table name...');
      const result = await queryClient
        .from('subscription')
        .select('*')
        .eq('userId', userId)
        .single();
      subscription = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[hasActiveAccessEdge] Supabase query error:', error);
      return false;
    }

    if (!subscription) {
      console.log('[hasActiveAccessEdge] ❌ No subscription found for user:', userId);
      return false;
    }

    const now = new Date();
    const trialEnd = subscription.trialEnd ? new Date(subscription.trialEnd) : null;
    const currentPeriodEnd = subscription.currentPeriodEnd 
      ? new Date(subscription.currentPeriodEnd) 
      : null;

    console.log('[hasActiveAccessEdge] Checking access for user:', userId, {
      status: subscription.subscriptionStatus,
      trialEnd: trialEnd?.toISOString(),
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      now: now.toISOString(),
    });

    // Check if in trial period
    if (subscription.subscriptionStatus === 'trialing' && trialEnd) {
      const trialValid = now < trialEnd;
      console.log('[hasActiveAccessEdge] Trial check:', {
        now: now.toISOString(),
        trialEnd: trialEnd.toISOString(),
        isValid: trialValid,
        diff: trialEnd.getTime() - now.getTime(),
      });
      if (trialValid) {
        console.log('[hasActiveAccessEdge] ✅ Trial is active');
        return true;
      } else {
        console.log('[hasActiveAccessEdge] ❌ Trial expired');
      }
    }

    // Check if subscription is active
    if (subscription.subscriptionStatus === 'active') {
      if (currentPeriodEnd && now < currentPeriodEnd) {
        console.log('[hasActiveAccessEdge] ✅ Active subscription');
        return true;
      } else {
        console.log('[hasActiveAccessEdge] ❌ Active subscription but period ended');
      }
    }

    console.log('[hasActiveAccessEdge] ❌ No active access');
    return false;
  } catch (error) {
    console.error('[hasActiveAccessEdge] ❌❌❌ ERROR ❌❌❌');
    console.error('[hasActiveAccessEdge] Error:', error);
    console.error('[hasActiveAccessEdge] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return false;
  }
}

