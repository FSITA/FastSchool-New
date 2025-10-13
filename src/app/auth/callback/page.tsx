import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const nextParam = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next
  const requestUrl = new URL(nextParam ?? '/', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
  const code = Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the requested page or home
      redirect(requestUrl.pathname)
    }
  }

  // If there's an error or no code, redirect to login
  redirect('/auth/login?error=Could not authenticate user')
}
