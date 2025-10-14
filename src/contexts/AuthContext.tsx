'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/singleton'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  initializing: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not configured')
      setLoading(false)
      setInitializing(false)
      return
    }

    // Get initial session and handle URL session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext: Initializing session...')
        
        // Check if getSessionFromUrl is available
        if (typeof supabase.auth.getSessionFromUrl === 'function') {
          console.log('AuthContext: Using getSessionFromUrl method...')
          
          // First, try to get session from URL (for OAuth callbacks)
          const { data: urlSessionData, error: urlError } = await supabase.auth.getSessionFromUrl({
            storeSession: true
          })
          
          if (urlSessionData.session && !urlError) {
            console.log('AuthContext: Session found from URL:', urlSessionData.session.user?.email)
            setSession(urlSessionData.session)
            setUser(urlSessionData.session.user)
            setLoading(false)
            setInitializing(false)
            return
          }
        } else {
          console.log('AuthContext: getSessionFromUrl not available, skipping URL session check')
        }

        // If no URL session or method not available, get current session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('AuthContext: Current session:', session?.user?.email || 'No session')
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setInitializing(false)
      } catch (error) {
        console.warn('AuthContext: Error getting session:', error)
        setLoading(false)
        setInitializing(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        setInitializing(false)

        // Set server-readable session cookie when user signs in
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
          try {
            console.log('AuthContext: Setting server session cookie...')
            await fetch('/api/auth/set-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                access_token: session.access_token,
                refresh_token: session.refresh_token,
              }),
            })
            console.log('AuthContext: Server session cookie set successfully')
          } catch (error) {
            console.error('AuthContext: Error setting server session cookie:', error)
          }
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Set server-readable session cookie for email/password login
    if (!error && data.session) {
      try {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          }),
        })
      } catch (cookieError) {
        console.error('Error setting server session cookie:', cookieError)
      }
    }
    
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error: error as Error | null }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signOut()
    
    // Clear server session cookies
    try {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: '',
          refresh_token: '',
        }),
      })
    } catch (cookieError) {
      console.error('Error clearing server session cookie:', cookieError)
    }
    
    return { error: error as Error | null }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    
    // Get the current path to redirect back to after auth
    const currentPath = window.location.pathname
    const redirectTo = currentPath === '/auth/login' || currentPath === '/auth/register' 
      ? `${window.location.origin}/auth/callback` 
      : `${window.location.origin}/auth/callback?next=${encodeURIComponent(currentPath)}`
    
    console.log('AuthContext: Initiating Google OAuth with redirectTo:', redirectTo)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })
    return { error: error as Error | null }
  }

  const updatePassword = async (newPassword: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    return { error: error as Error | null }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    return { error: error as Error | null }
  }

  const value = {
    user,
    session,
    loading,
    initializing,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updatePassword,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
