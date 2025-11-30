import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { hasActiveAccessEdge } from '@/lib/stripe/subscription-helpers-edge'

// Protected AI routes that require subscription
const PROTECTED_AI_ROUTES = [
  '/presentation',
  '/flashcards',
  '/lesson-generator',
  '/lesson-planner',
  '/quiz-generator',
  '/diagram-generator',
  '/summary-generator',
]

// Public routes that don't require auth or subscription
// Note: '/' (homepage) shows dashboard for logged-in users, marketing page for logged-out users
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/pricing',
  '/contact',
  '/faq',
  '/faqs', // Keep for backward compatibility
  '/tempdash', // Temporary dashboard page
  '/api',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] ===== MIDDLEWARE CALLED =====', pathname)

  // Check route types
  const isProtectedRoute = PROTECTED_AI_ROUTES.some(route => 
    pathname.startsWith(route)
  )
  
  console.log('[Middleware] Route check:', { pathname, isProtectedRoute })

  // Check if auth bypass is enabled for development (check early)
  // Note: In Next.js middleware, we need to check NEXT_PUBLIC_ prefixed vars or use a different approach
  const bypassAuth =
    process.env.NODE_ENV === 'development' &&
    (process.env.BYPASS_SUPABASE_AUTH === 'true' || process.env.NEXT_PUBLIC_BYPASS_SUPABASE_AUTH === 'true')

  // Debug logging
  if (isProtectedRoute) {
    console.log('[Middleware Debug]', {
      pathname,
      nodeEnv: process.env.NODE_ENV,
      bypassSupabaseAuth: process.env.BYPASS_SUPABASE_AUTH,
      nextPublicBypass: process.env.NEXT_PUBLIC_BYPASS_SUPABASE_AUTH,
      bypassAuth,
      isProtectedRoute,
    })
  }

  // Skip middleware for public routes
  // Check exact match for '/' or starts with the route followed by '/' or end of string
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/') {
      return pathname === '/'
    }
    return pathname === route || pathname.startsWith(route + '/')
  })
  console.log('[Middleware] Public route check:', { pathname, isPublicRoute })
  
  if (isPublicRoute) {
    console.log('[Middleware] Public route, calling updateSession and returning')
    return await updateSession(request)
  }

  // If bypass is enabled and it's a protected route, skip updateSession completely
  console.log('[Middleware] ===== CHECKING BYPASS CONDITION =====')
  console.log('[Middleware] Checking bypass condition:', { bypassAuth, isProtectedRoute, condition: bypassAuth && isProtectedRoute })
  
  if (bypassAuth && isProtectedRoute) {
    console.log('[Middleware] ✅✅✅ ENTERING BYPASS BLOCK ✅✅✅')
    console.log('[Middleware] ✅ Bypass enabled for protected route, skipping updateSession')
    console.log('[Middleware] Creating response without calling updateSession')
    
    // Create a response without calling updateSession to avoid redirect
    const response = NextResponse.next({ request })
    
    // Use mock user ID for development bypass
    const userId = 'dev-bypass-user'
    console.log('[Middleware] Using mock user ID:', userId)
    
    // Check subscription access using Supabase (Edge-compatible)
    try {
      console.log('[Middleware] ===== STARTING SUBSCRIPTION CHECK =====')
      console.log('[Middleware] Checking subscription access for user:', userId)
      
      // Create Supabase client for database query (Edge-compatible)
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseAnonKey) {
        console.log('[Middleware] ⚠️ Supabase not configured, denying access')
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        return NextResponse.redirect(url)
      }
      
      const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // No-op for middleware
            },
          },
        }
      )
      
      console.log('[Middleware] About to call hasActiveAccessEdge...')
      const hasAccess = await hasActiveAccessEdge(supabase, userId)
      
      console.log('[Middleware] ===== SUBSCRIPTION CHECK COMPLETE =====')
      console.log('[Middleware] ✅ Subscription access check result:', hasAccess, 'for user:', userId)
      console.log('[Middleware] hasAccess type:', typeof hasAccess, 'value:', hasAccess)
      
      if (!hasAccess) {
        console.log('[Middleware] ❌❌❌ NO ACCESS - REDIRECTING TO PRICING ❌❌❌')
        // Redirect to pricing page
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        return NextResponse.redirect(url)
      }
      
      console.log('[Middleware] ✅✅✅ ACCESS GRANTED - ALLOWING REQUEST ✅✅✅')
      return response
    } catch (error) {
      console.error('[Middleware] ❌❌❌ ERROR IN SUBSCRIPTION CHECK ❌❌❌')
      console.error('[Middleware] Error details:', error)
      console.error('[Middleware] Error stack:', error instanceof Error ? error.stack : 'No stack')
      // On error, DENY access (fail closed) for testing
      console.log('[Middleware] ⚠️⚠️⚠️ ERROR OCCURRED - DENYING ACCESS (fail closed) ⚠️⚠️⚠️')
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
  }
  
  console.log('[Middleware] ⚠️ Bypass NOT enabled or NOT protected route, calling updateSession')

  // For non-protected routes or when bypass is off, use normal flow
  let response = await updateSession(request)

  // If not a protected route, allow access (homepage will show dashboard for logged-in users)
  if (!isProtectedRoute) {
    return response
  }

  // If we get here, it's a protected AI route but bypass is NOT enabled
  // So we need to check Supabase auth AND subscription
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // If Supabase is not configured, deny access (fail closed)
    const url = request.nextUrl.clone()
    url.pathname = '/pricing'
    return NextResponse.redirect(url)
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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If not logged in, redirect to login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Check subscription access for authenticated user
  try {
    const hasAccess = await hasActiveAccessEdge(supabase, user.id)

    if (!hasAccess) {
      // Redirect to pricing page
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
  } catch (error) {
    console.error('[Middleware] Error checking subscription access:', error)
    // On error, deny access (fail closed)
    const url = request.nextUrl.clone()
    url.pathname = '/pricing'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}



