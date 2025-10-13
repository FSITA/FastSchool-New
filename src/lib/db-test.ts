import { PrismaClient } from '@prisma/client'

export async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    
    // Test basic connection
    await prisma.$connect()
    console.log('✅ Database connection successful!')
    
    // Test a simple query
    const userCount = await prisma.user.count()
    console.log(`✅ Database query successful! User count: ${userCount}`)
    
    return { success: true, userCount }
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return { success: false, error: error.message }
  } finally {
    await prisma.$disconnect()
  }
}
