import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, allow all requests (fallback mode)
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Skip auth redirects for auth-related paths and API routes
  const isAuthPath = request.nextUrl.pathname.startsWith('/auth')
  const isApiPath = request.nextUrl.pathname.startsWith('/api')
  const isRootPath = request.nextUrl.pathname === '/'
  
  // Allow all auth paths, API paths, and root path without redirect
  if (isAuthPath || isApiPath || isRootPath) {
    return supabaseResponse
  }

  // Only redirect to login if user is not authenticated and trying to access protected routes
  if (!user) {
    // Check if bypass is enabled - if so, don't redirect
    const bypassAuth =
      process.env.NODE_ENV === 'development' &&
      (process.env.BYPASS_SUPABASE_AUTH === 'true' || process.env.NEXT_PUBLIC_BYPASS_SUPABASE_AUTH === 'true')
    
    if (bypassAuth) {
      console.log('[updateSession] Bypass enabled, skipping redirect for:', request.nextUrl.pathname)
      return supabaseResponse
    }
    
    console.log('[updateSession] No user found, redirecting to login from:', request.nextUrl.pathname)
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse
}
