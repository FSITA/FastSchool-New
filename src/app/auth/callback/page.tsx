import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  try {
    const nextParam = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next
    const code = Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code

    // Get the base URL for redirects
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const requestUrl = new URL(nextParam ?? '/', baseUrl)

    if (code) {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Redirect to the requested page or home
        redirect(requestUrl.pathname)
      } else {
        console.error('Auth error:', error)
        redirect('/auth/login?error=Authentication failed')
      }
    } else {
      // No code provided, redirect to login
      redirect('/auth/login?error=No authentication code provided')
    }
  } catch (error) {
    console.error('Auth callback error:', error)
    redirect('/auth/login?error=Authentication callback failed')
  }
}
