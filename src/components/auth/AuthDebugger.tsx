'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthDebugger() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const info = {
      clientType: 'Browser Client',
      authMethods: Object.keys(supabase.auth || {}),
      hasGetSessionFromUrl: typeof supabase.auth.getSessionFromUrl === 'function',
      hasGetSession: typeof supabase.auth.getSession === 'function',
      hasOnAuthStateChange: typeof supabase.auth.onAuthStateChange === 'function',
      hasSignInWithOAuth: typeof supabase.auth.signInWithOAuth === 'function',
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      urlHash: typeof window !== 'undefined' ? window.location.hash : 'N/A',
      urlSearch: typeof window !== 'undefined' ? window.location.search : 'N/A',
      timestamp: new Date().toISOString()
    }
    
    setDebugInfo(info)
    
    console.log('=== Auth Debugger Info ===')
    console.log('Client Info:', info)
    console.log('========================')
  }, [])

  if (!debugInfo) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-md z-50">
      <h3 className="font-bold mb-2">Auth Debug Info</h3>
      <div className="space-y-1">
        <div><strong>Client:</strong> {debugInfo.clientType}</div>
        <div><strong>getSessionFromUrl:</strong> {debugInfo.hasGetSessionFromUrl ? '✅' : '❌'}</div>
        <div><strong>getSession:</strong> {debugInfo.hasGetSession ? '✅' : '❌'}</div>
        <div><strong>onAuthStateChange:</strong> {debugInfo.hasOnAuthStateChange ? '✅' : '❌'}</div>
        <div><strong>signInWithOAuth:</strong> {debugInfo.hasSignInWithOAuth ? '✅' : '❌'}</div>
        <div><strong>URL Hash:</strong> {debugInfo.urlHash || 'None'}</div>
        <div><strong>URL Search:</strong> {debugInfo.urlSearch || 'None'}</div>
        <div><strong>Auth Methods:</strong> {debugInfo.authMethods.join(', ')}</div>
      </div>
    </div>
  )
}
