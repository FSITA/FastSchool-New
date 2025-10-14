'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ClientMethodTest() {
  const [testResults, setTestResults] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    
    const results = {
      clientCreated: !!supabase,
      authObject: !!supabase.auth,
      methods: {
        getSessionFromUrl: typeof supabase.auth.getSessionFromUrl,
        getSession: typeof supabase.auth.getSession,
        onAuthStateChange: typeof supabase.auth.onAuthStateChange,
        signInWithOAuth: typeof supabase.auth.signInWithOAuth,
        signInWithPassword: typeof supabase.auth.signInWithPassword,
        signOut: typeof supabase.auth.signOut,
      },
      authKeys: Object.keys(supabase.auth || {}),
      timestamp: new Date().toISOString()
    }
    
    setTestResults(results)
    
    console.log('=== Client Method Test Results ===')
    console.log(results)
    console.log('================================')
  }, [])

  if (!testResults) return <div>Testing client methods...</div>

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-2">Client Method Test Results</h3>
      <div className="space-y-1 text-sm">
        <div><strong>Client Created:</strong> {testResults.clientCreated ? '✅' : '❌'}</div>
        <div><strong>Auth Object:</strong> {testResults.authObject ? '✅' : '❌'}</div>
        {Object.entries(testResults.methods).map(([method, type]) => (
          <div key={method}>
            <strong>{method}:</strong> {type === 'function' ? '✅' : `❌ (${type})`}
          </div>
        ))}
        <div><strong>Auth Keys:</strong> {testResults.authKeys.join(', ')}</div>
      </div>
    </div>
  )
}
