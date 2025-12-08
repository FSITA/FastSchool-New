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
  '/dashboard-preview', // Preview dashboard without authentication (for development)
  '/diagramtest', // Test route for diagram generator (bypasses middleware)
  '/api',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log('[Middleware] ========== MIDDLEWARE CALLED ==========');
  console.log('[Middleware] Pathname:', pathname);
  console.log('[Middleware] Method:', request.method);
  console.log('[Middleware] Timestamp:', new Date().toISOString());
  console.log('[Middleware] URL:', request.url);

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
    console.log('[Middleware] ❌ User not authenticated');
    console.log('[Middleware] Redirecting to login page');
    console.log('[Middleware] Redirect target (after login):', pathname);
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }
  
  console.log('[Middleware] ✅ User authenticated');
  console.log('[Middleware] User ID:', user.id);
  console.log('[Middleware] User Email:', user.email);

  // Check subscription access for authenticated user
  try {
    console.log('[Middleware] ========== CHECKING SUBSCRIPTION ACCESS ==========');
    console.log('[Middleware] User ID:', user.id);
    console.log('[Middleware] Calling hasActiveAccessEdge...');
    
    let hasAccess = await hasActiveAccessEdge(supabase, user.id)
    
    console.log('[Middleware] Access check result (Supabase):', hasAccess);
    console.log('[Middleware] Has Access:', hasAccess ? 'YES ✅' : 'NO ❌');
    
    // FALLBACK: If Supabase query failed, try using Prisma via API
    // This handles cases where Supabase query fails but subscription exists in Prisma
    if (!hasAccess) {
      console.log('[Middleware] ⚠️ Supabase query returned no access, trying Prisma fallback...');
      
      try {
        // Call the subscription status API which uses Prisma
        const baseUrl = request.nextUrl.origin;
        const statusResponse = await fetch(`${baseUrl}/api/subscription/status`, {
          method: 'GET',
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('[Middleware] Prisma fallback status data:', JSON.stringify(statusData, null, 2));
          
          // Check if user has active trial or subscription
          if (statusData.isTrial && statusData.daysRemaining && statusData.daysRemaining > 0) {
            console.log('[Middleware] ✅✅✅ PRISMA FALLBACK: ACTIVE TRIAL FOUND ✅✅✅');
            console.log('[Middleware] Days remaining:', statusData.daysRemaining);
            hasAccess = true;
          } else if (statusData.isActive) {
            console.log('[Middleware] ✅✅✅ PRISMA FALLBACK: ACTIVE SUBSCRIPTION FOUND ✅✅✅');
            hasAccess = true;
          } else {
            console.log('[Middleware] ❌ Prisma fallback: No active access');
          }
        } else {
          console.log('[Middleware] ⚠️ Prisma fallback API call failed:', statusResponse.status);
        }
      } catch (fallbackError: any) {
        console.error('[Middleware] ❌ Error in Prisma fallback:', fallbackError.message);
      }
    }
    
    // If still no access, check if we need to initialize trial
    // This handles the case where user just signed up but trial wasn't created yet
    if (!hasAccess) {
      console.log('[Middleware] ❌❌❌ NO ACCESS DETECTED (after fallback) ❌❌❌');
      console.log('[Middleware] Checking if trial needs initialization...')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })
        
        // Check if subscription exists (use exact Prisma table/column names)
        let subscriptionExists = false
        try {
          const { data, error } = await serviceClient
            .from('Subscription')
            .select('id')
            .eq('userId', user.id)
            .maybeSingle()
          
          if (data && !error) {
            subscriptionExists = true
            console.log('[Middleware] ✅ Subscription exists')
          }
        } catch (err: any) {
          console.log('[Middleware] Error checking subscription:', err.message)
        }
        
        // If no subscription exists, try to initialize trial via API
        // We use the API route instead of direct DB write to ensure User exists in Prisma
        if (!subscriptionExists) {
          console.log('[Middleware] No subscription found, attempting to initialize trial via API...')
          
          try {
            // Create a request to the initialize-trial API
            const baseUrl = request.nextUrl.origin
            const initResponse = await fetch(`${baseUrl}/api/subscription/initialize-trial`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': request.headers.get('cookie') || '',
              },
              body: JSON.stringify({ userId: user.id }),
            })
            
            if (initResponse.ok) {
              console.log('[Middleware] ✅ Trial initialization API call succeeded')
              // Wait a moment for database to sync
              await new Promise(resolve => setTimeout(resolve, 200))
              // Recheck access
              hasAccess = await hasActiveAccessEdge(supabase, user.id)
              if (hasAccess) {
                console.log('[Middleware] ✅ Access granted after trial initialization')
              }
            } else {
              const errorData = await initResponse.json().catch(() => ({}))
              console.error('[Middleware] ❌ Trial initialization API failed:', errorData)
            }
          } catch (apiError: any) {
            console.error('[Middleware] ❌ Error calling trial initialization API:', apiError.message)
          }
        } else {
          console.log('[Middleware] Subscription exists but access denied - likely expired or inactive')
        }
      }
    }

    if (!hasAccess) {
      // Redirect to pricing page
      console.log('[Middleware] ❌❌❌ FINAL DECISION: NO ACCESS ❌❌❌');
      console.log('[Middleware] Redirecting to pricing page');
      console.log('[Middleware] Original pathname:', pathname);
      console.log('[Middleware] User ID:', user.id);
      console.log('[Middleware] ============================================');
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
    
    console.log('[Middleware] ✅✅✅ FINAL DECISION: ACCESS GRANTED ✅✅✅');
    console.log('[Middleware] Allowing access to:', pathname);
    console.log('[Middleware] ============================================');
  } catch (error) {
    console.error('[Middleware] Error checking subscription access:', error)
    console.error('[Middleware] Error details:', error instanceof Error ? {
      message: error.message,
      stack: error.stack
    } : error)
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



