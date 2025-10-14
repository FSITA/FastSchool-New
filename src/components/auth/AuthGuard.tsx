'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo = '/auth/login' 
}: AuthGuardProps) {
  const { user, initializing, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while initializing or loading
    if (initializing || loading) {
      return
    }

    // If auth is required but user is not authenticated
    if (requireAuth && !user) {
      console.log('AuthGuard: Redirecting to login - no user found')
      router.push(redirectTo)
    }
  }, [user, initializing, loading, requireAuth, redirectTo, router])

  // Show loading while initializing
  if (initializing || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <div className="text-gray-600 dark:text-gray-400">
            {initializing ? 'Initializing authentication...' : 'Loading...'}
          </div>
        </div>
      </div>
    )
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null
  }

  return <>{children}</>
}
