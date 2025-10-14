'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
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
  
  let supabase: any = null
  try {
    supabase = createClient()
  } catch (error) {
    console.warn('Supabase client not configured:', error)
    setLoading(false)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // Get initial session and handle URL session
    const getInitialSession = async () => {
      try {
        // First, try to get session from URL (for OAuth callbacks)
        const { data: urlSessionData, error: urlError } = await supabase.auth.getSessionFromUrl({
          storeSession: true
        })
        
        if (urlSessionData.session && !urlError) {
          setSession(urlSessionData.session)
          setUser(urlSessionData.session.user)
          setLoading(false)
          return
        }

        // If no URL session, get current session
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      } catch (error) {
        console.warn('Error getting session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
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
    return { error: error as Error | null }
  }

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: new Error('Authentication not configured') }
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
