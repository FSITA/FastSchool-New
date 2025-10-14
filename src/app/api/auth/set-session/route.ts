import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    // Create server client
    const supabase = createClient()

    // Handle sign out (empty tokens)
    if (!access_token || !refresh_token) {
      console.log('Clearing session (sign out)')
      
      // Clear the session
      await supabase.auth.signOut()
      
      // Create response with success
      const response = NextResponse.json({ 
        success: true, 
        message: 'Session cleared' 
      })

      // Clear cookies by setting them to empty with past expiry
      response.cookies.set('sb-access-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      })
      
      response.cookies.set('sb-refresh-token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0
      })

      return response
    }

    // Set the session using the tokens
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    })

    if (error) {
      console.error('Error setting session:', error)
      return NextResponse.json(
        { error: 'Failed to set session' },
        { status: 400 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No session created' },
        { status: 400 }
      )
    }

    console.log('Session set successfully for user:', data.session.user?.email)

    // Create response with success
    const response = NextResponse.json({ 
      success: true, 
      user: data.session.user?.email 
    })

    // Set the session cookies manually
    response.cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    
    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    })

    return response

  } catch (error) {
    console.error('Error in set-session API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
