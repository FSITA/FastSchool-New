import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function verifyAuth(request: Request) {
  try {
    const supabase = createClient()
    
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return { user, supabase }
  } catch (error) {
    // If Supabase is not configured, allow the request (fallback mode)
    if (error instanceof Error && error.message.includes('Missing Supabase environment variables')) {
      return { user: { id: 'fallback-user' }, supabase: null }
    }
    
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503 }
    )
  }
}
