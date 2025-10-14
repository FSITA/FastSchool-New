'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  useEffect(() => {
    let mounted = true

    const handleCallback = async () => {
      try {
        const supabase = createClient()
        
        // Get the next parameter for redirect
        const next = searchParams.get('next') ?? '/'
        
        // Log current URL and parameters for debugging
        console.log('=== OAuth Callback Debug Info ===')
        console.log('Current URL:', window.location.href)
        console.log('Search params:', Object.fromEntries(searchParams.entries()))
        console.log('Hash:', window.location.hash)
        console.log('Next parameter:', next)
        console.log('Retry count:', retryCount)
        console.log('================================')
        
        // Check if URL contains auth parameters
        const hasAuthParams = window.location.hash.includes('access_token') || 
                             window.location.search.includes('code') ||
                             window.location.hash.includes('refresh_token')
        
        if (!hasAuthParams && retryCount === 0) {
          console.warn('No auth parameters found in URL - this might indicate a redirect issue')
        }
        
        // Try to get session from URL
        const { data, error } = await supabase.auth.getSessionFromUrl({ 
          storeSession: true 
        })
        
        if (!mounted) return

        if (error) {
          console.error('getSessionFromUrl error:', error)
          console.error('Error details:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
          })
          
          // Retry mechanism for intermittent issues
          if (retryCount < maxRetries) {
            console.log(`Retrying... attempt ${retryCount + 1}/${maxRetries}`)
            setRetryCount(prev => prev + 1)
            await new Promise(resolve => setTimeout(resolve, 300))
            handleCallback()
            return
          }
          
          setErrorMsg('Authentication failed. Please try again.')
          return
        }

        if (data.session) {
          console.log('✅ Session stored successfully:', {
            user: data.session.user?.email,
            expiresAt: data.session.expires_at,
            provider: data.session.user?.app_metadata?.provider
          })
          // Session stored successfully, redirect to intended page
          router.replace(next)
        } else {
          console.log('❌ No session found in URL')
          setErrorMsg('No authentication session found. Please try logging in again.')
        }
      } catch (err) {
        console.error('❌ Callback processing failed:', err)
        setErrorMsg('Authentication callback failed. Please try again.')
      }
    }

    handleCallback()

    return () => {
      mounted = false
    }
  }, [router, searchParams, retryCount])

  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
          <div className="space-y-2">
            <a 
              href="/auth/login" 
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Retry attempt: {retryCount}/{maxRetries}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <div className="text-gray-600 dark:text-gray-400">
          Processing authentication...
        </div>
        {retryCount > 0 && (
          <div className="text-sm text-gray-500">
            Retry attempt: {retryCount}/{maxRetries}
          </div>
        )}
      </div>
    </div>
  )
}
