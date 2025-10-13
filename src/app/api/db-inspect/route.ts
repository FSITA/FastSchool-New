import { NextResponse } from 'next/server'

export async function GET() {
  const maskedUrl = process.env.DATABASE_URL 
    ? process.env.DATABASE_URL.slice(0, 30) + '***' + process.env.DATABASE_URL.slice(-20)
    : 'Not set'
    
  return NextResponse.json({
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      maskedUrl,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set'
    },
    timestamp: new Date().toISOString()
  })
}
