import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL prefix:', process.env.DATABASE_URL?.slice(0, 60) + '***')
    console.log('NODE_ENV:', process.env.NODE_ENV)
    
    // Test basic connection
    await prisma.$connect()
    
    // Test query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, current_database(), current_user(), inet_server_addr()`
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful!',
      data: result,
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        urlPrefix: process.env.DATABASE_URL?.slice(0, 30) + '***'
      }
    })
  } catch (error: any) {
    console.error('❌ Database connection failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: {
        message: error.message,
        code: error.code,
        meta: error.meta
      },
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        urlPrefix: process.env.DATABASE_URL?.slice(0, 30) + '***'
      }
    }, { status: 500 })
  }
}
