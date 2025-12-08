'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/singleton'
import { Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState('Elaborazione autenticazione...')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  // Function to set server-readable session cookie
  const setServerSession = async (session: any) => {
    try {
      console.log('Setting server session cookie...')
      
      const response = await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to set server session:', errorData)
        return false
      }

      const result = await response.json()
      console.log('✅ Server session set successfully:', result)
      return true
    } catch (error) {
      console.error('Error setting server session:', error)
      return false
    }
  }

  useEffect(() => {
    let mounted = true
    let authSubscription: any = null

    const handleCallback = async () => {
      try {
        
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

        // Debug: Check what methods are available on the auth object
        console.log('Supabase auth methods:', Object.keys(supabase.auth || {}))
        console.log('Has getSessionFromUrl?', typeof supabase.auth.getSessionFromUrl)
        
        // Method 1: Try getSessionFromUrl if available
        if (typeof supabase.auth.getSessionFromUrl === 'function') {
          console.log('Using getSessionFromUrl method...')
          setMessage('Elaborazione sessione dall\'URL...')
          
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
            
            setErrorMsg('Autenticazione fallita. Riprova.')
            return
          }

          if (data.session) {
            console.log('✅ Session stored successfully via getSessionFromUrl:', {
              user: data.session.user?.email,
              expiresAt: data.session.expires_at,
              provider: data.session.user?.app_metadata?.provider
            })
            
            // Set server-readable session cookie
            await setServerSession(data.session)
            
            // Initialize trial for new users
            if (data.session.user) {
              try {
                console.log('[AuthCallback] ========== TRIAL INITIALIZATION START ==========');
                console.log('[AuthCallback] User ID:', data.session.user.id);
                console.log('[AuthCallback] User Email:', data.session.user.email);
                console.log('[AuthCallback] Timestamp:', new Date().toISOString());
                console.log('[AuthCallback] Calling /api/subscription/initialize-trial...');
                
                const trialResponse = await fetch('/api/subscription/initialize-trial', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ userId: data.session.user.id }),
                });
                
                console.log('[AuthCallback] Trial API Response Status:', trialResponse.status);
                console.log('[AuthCallback] Trial API Response OK:', trialResponse.ok);
                
                if (!trialResponse.ok) {
                  const errorData = await trialResponse.json();
                  console.error('[AuthCallback] ❌❌❌ FAILED TO INITIALIZE TRIAL ❌❌❌');
                  console.error('[AuthCallback] Error Status:', trialResponse.status);
                  console.error('[AuthCallback] Error Data:', JSON.stringify(errorData, null, 2));
                } else {
                  const trialData = await trialResponse.json();
                  console.log('[AuthCallback] ✅✅✅ TRIAL INITIALIZED SUCCESSFULLY ✅✅✅');
                  console.log('[AuthCallback] Trial Data:', JSON.stringify(trialData, null, 2));
                  console.log('[AuthCallback] ========== TRIAL INITIALIZATION END ==========');
                }
              } catch (error: any) {
                console.error('[AuthCallback] ❌❌❌ ERROR INITIALIZING TRIAL ❌❌❌');
                console.error('[AuthCallback] Error Type:', typeof error);
                console.error('[AuthCallback] Error Message:', error?.message);
                console.error('[AuthCallback] Error Stack:', error?.stack);
                console.error('[AuthCallback] Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
              }
            }
            
            // Session stored successfully, redirect to intended page
            console.log('[AuthCallback] ========== REDIRECTING USER ==========');
            console.log('[AuthCallback] Redirect Target:', next);
            console.log('[AuthCallback] User ID:', data.session.user?.id);
            console.log('[AuthCallback] User Email:', data.session.user?.email);
            console.log('[AuthCallback] ========================================');
            router.replace(next)
            return
          }
        }

        // Method 2: Fallback to onAuthStateChange if getSessionFromUrl is not available
        console.log('getSessionFromUrl not available, using onAuthStateChange fallback...')
        setMessage('In attesa dello stato di autenticazione...')
        
        let authResolved = false
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!mounted || authResolved) return
          
          console.log('Auth state change in callback:', event, session?.user?.email)
          
          if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            authResolved = true
            console.log('✅ Session established via auth state change:', {
              user: session?.user?.email,
              event
            })
            
            // Set server-readable session cookie
            if (session) {
              await setServerSession(session)
              
              // Initialize trial for new users (only on SIGNED_IN, not INITIAL_SESSION)
              if (event === 'SIGNED_IN' && session.user) {
                try {
                  console.log('[AuthCallback] ========== TRIAL INITIALIZATION START (SIGNED_IN) ==========');
                  console.log('[AuthCallback] Event:', event);
                  console.log('[AuthCallback] User ID:', session.user.id);
                  console.log('[AuthCallback] User Email:', session.user.email);
                  console.log('[AuthCallback] Timestamp:', new Date().toISOString());
                  console.log('[AuthCallback] Calling /api/subscription/initialize-trial...');
                  
                  const trialResponse = await fetch('/api/subscription/initialize-trial', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: session.user.id }),
                  });
                  
                  console.log('[AuthCallback] Trial API Response Status:', trialResponse.status);
                  console.log('[AuthCallback] Trial API Response OK:', trialResponse.ok);
                  
                  if (!trialResponse.ok) {
                    const errorData = await trialResponse.json();
                    console.error('[AuthCallback] ❌❌❌ FAILED TO INITIALIZE TRIAL ❌❌❌');
                    console.error('[AuthCallback] Error Status:', trialResponse.status);
                    console.error('[AuthCallback] Error Data:', JSON.stringify(errorData, null, 2));
                  } else {
                    const trialData = await trialResponse.json();
                    console.log('[AuthCallback] ✅✅✅ TRIAL INITIALIZED SUCCESSFULLY ✅✅✅');
                    console.log('[AuthCallback] Trial Data:', JSON.stringify(trialData, null, 2));
                    console.log('[AuthCallback] ========== TRIAL INITIALIZATION END ==========');
                  }
                } catch (error: any) {
                  console.error('[AuthCallback] ❌❌❌ ERROR INITIALIZING TRIAL ❌❌❌');
                  console.error('[AuthCallback] Error Type:', typeof error);
                  console.error('[AuthCallback] Error Message:', error?.message);
                  console.error('[AuthCallback] Error Stack:', error?.stack);
                  console.error('[AuthCallback] Full Error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
                }
              }
            }
            
            console.log('[AuthCallback] ========== REDIRECTING USER (SIGNED_IN) ==========');
            console.log('[AuthCallback] Redirect Target:', next);
            console.log('[AuthCallback] User ID:', session?.user?.id);
            console.log('[AuthCallback] User Email:', session?.user?.email);
            console.log('[AuthCallback] ====================================================');
            router.replace(next)
          }
        })

        authSubscription = subscription

        // Set a timeout to fail gracefully
        setTimeout(() => {
          if (!mounted || authResolved) return
          
          console.log('Auth callback timeout reached')
          setErrorMsg('Timeout autenticazione. Riprova.')
          if (authSubscription) {
            authSubscription.unsubscribe()
          }
        }, 10000) // 10 second timeout

      } catch (err) {
        console.error('❌ Callback processing failed:', err)
        setErrorMsg('Callback autenticazione fallito. Riprova.')
      }
    }

    handleCallback()

    return () => {
      mounted = false
      if (authSubscription) {
        authSubscription.unsubscribe()
      }
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
              Vai al Login
            </a>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tentativo: {retryCount}/{maxRetries}
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
          {message}
        </div>
        {retryCount > 0 && (
          <div className="text-sm text-gray-500">
            Tentativo: {retryCount}/{maxRetries}
          </div>
        )}
      </div>
    </div>
  )
}
