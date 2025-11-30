'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface SubscriptionStatus {
  hasSubscription: boolean
  status: string | null
  isTrial: boolean
  isActive: boolean
  trialEnd: string | null
  daysRemaining: number | null
  plan: string | null
}

export function TrialStatusBanner() {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log('[TrialStatusBanner] Fetching subscription status...')
        const response = await fetch('/api/subscription/status')
        
        if (!response.ok) {
          console.error('[TrialStatusBanner] Failed to fetch status:', response.status)
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log('[TrialStatusBanner] Status received:', data)
        setStatus(data)
      } catch (error) {
        console.error('[TrialStatusBanner] Error fetching status:', error)
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
    return (
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-16 rounded-lg"></div>
      </div>
    )
  }

  if (!status) {
    return null
  }

  // Don't show banner if user has active subscription
  if (status.isActive) {
    return null
  }

  // Show trial status
  if (status.isTrial && status.daysRemaining !== null) {
    const daysRemaining = status.daysRemaining
    const isExpired = daysRemaining <= 0

    if (isExpired) {
      return (
        <Alert className="max-w-7xl mx-auto px-6 mb-6 border-red-500 bg-red-50 dark:bg-red-900/20">
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-900 dark:text-red-100">
            Prova scaduta
          </AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-200">
            <div className="flex items-center justify-between">
              <span>
                La tua prova gratuita di 2 giorni è scaduta. Abbonati ora per continuare a utilizzare tutti gli strumenti AI.
              </span>
              <Link href="/pricing">
                <Button className="ml-4 bg-red-600 hover:bg-red-700">
                  Abbonati ora
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (daysRemaining === 1) {
      return (
        <Alert className="max-w-7xl mx-auto px-6 mb-6 border-orange-500 bg-orange-50 dark:bg-orange-900/20">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-900 dark:text-orange-100">
            Prova in scadenza
          </AlertTitle>
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <div className="flex items-center justify-between">
              <span>
                La tua prova gratuita scade tra <strong>1 giorno</strong>. Abbonati ora per continuare senza interruzioni.
              </span>
              <Link href="/pricing">
                <Button className="ml-4 bg-orange-600 hover:bg-orange-700">
                  Abbonati ora
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <Alert className="max-w-7xl mx-auto px-6 mb-6 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Prova gratuita attiva
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>
              Stai utilizzando la prova gratuita. <strong>{daysRemaining} giorni</strong> rimanenti.
            </span>
            <Link href="/pricing">
              <Button variant="outline" className="ml-4 border-blue-600 text-blue-600 hover:bg-blue-100">
                Vedi piani
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // No subscription or trial
  if (!status.hasSubscription) {
    return (
      <Alert className="max-w-7xl mx-auto px-6 mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Nessun abbonamento attivo
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="flex items-center justify-between">
            <span>
              Non hai un abbonamento attivo. Abbonati per accedere a tutti gli strumenti AI.
            </span>
            <Link href="/pricing">
              <Button className="ml-4 bg-yellow-600 hover:bg-yellow-700">
                Abbonati ora
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}

