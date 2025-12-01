'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SubscriptionStatus {
  hasSubscription: boolean
  status: string | null
  isTrial: boolean
  isActive: boolean
  trialEnd: string | null
  daysRemaining: number | null
  plan: string | null
}

export function TrialStatusButton() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log('[TrialStatusButton] ========== FETCHING TRIAL STATUS ==========');
        console.log('[TrialStatusButton] Timestamp:', new Date().toISOString());
        console.log('[TrialStatusButton] Calling /api/subscription/status...');
        
        const response = await fetch('/api/subscription/status')
        
        console.log('[TrialStatusButton] Response Status:', response.status);
        console.log('[TrialStatusButton] Response OK:', response.ok);
        
        if (!response.ok) {
          console.error('[TrialStatusButton] ❌ Failed to fetch status, Status:', response.status);
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log('[TrialStatusButton] ✅ Status Data Received:', JSON.stringify(data, null, 2));
        console.log('[TrialStatusButton] Has Subscription:', data.hasSubscription);
        console.log('[TrialStatusButton] Is Trial:', data.isTrial);
        console.log('[TrialStatusButton] Is Active:', data.isActive);
        console.log('[TrialStatusButton] Days Remaining:', data.daysRemaining);
        console.log('[TrialStatusButton] ============================================');
        setStatus(data)
      } catch (error: any) {
        console.error('[TrialStatusButton] ❌❌❌ ERROR FETCHING STATUS ❌❌❌');
        console.error('[TrialStatusButton] Error Type:', typeof error);
        console.error('[TrialStatusButton] Error Message:', error?.message);
        console.error('[TrialStatusButton] Error Stack:', error?.stack);
      } finally {
        setLoading(false)
      }
    }

    fetchStatus()
    
    // Refresh status every minute
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    console.log('[TrialStatusButton] Still loading, not rendering...');
    return null
  }

  if (!status) {
    console.log('[TrialStatusButton] No status data, not rendering...');
    return null
  }

  // Don't show button if user has active subscription
  if (status.isActive) {
    console.log('[TrialStatusButton] ✅ User has active subscription, hiding trial button');
    return null
  }

  // Show trial status
  if (status.isTrial && status.daysRemaining !== null) {
    const daysRemaining = status.daysRemaining
    const isExpired = daysRemaining <= 0

    console.log('[TrialStatusButton] Rendering trial status:', {
      daysRemaining,
      isExpired,
      status: status.status,
    });

    if (isExpired) {
      console.log('[TrialStatusButton] ⚠️ Trial expired, showing "ended" button');
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-red-600/90 hover:text-red-700 hover:bg-red-50/30 transition-colors bg-transparent">
                <XCircle className="h-3.5 w-3.5" />
                <span>Free Trial ended</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Go to payment section to get a subscription in order to use AIs.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    // Active trial
    const daysText = daysRemaining === 1 ? '1 day' : `${daysRemaining} days`
    console.log('[TrialStatusButton] ✅ Trial active, showing button with', daysText, 'remaining');
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium text-green-600/90 hover:text-green-700 hover:bg-green-50/30 transition-colors bg-transparent">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Free Trial</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">You have {daysText} left on your trial.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // No subscription or trial - don't show anything
  console.log('[TrialStatusButton] No trial or subscription found, not rendering button');
  return null
}

