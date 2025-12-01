/**
 * Cleanup script to delete all User, Subscription, and Account data
 * Run with: node scripts/cleanup-all-auth-data.js
 * 
 * WARNING: This is destructive and cannot be undone!
 * Make sure you have backups if needed.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting cleanup of all auth-related data...\n');

  try {
    // Delete subscriptions first (due to foreign key constraints)
    console.log('1. Deleting all subscriptions...');
    const deletedSubscriptions = await prisma.subscription.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSubscriptions.count} subscriptions\n`);

    // Delete accounts
    console.log('2. Deleting all accounts...');
    const deletedAccounts = await prisma.account.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAccounts.count} accounts\n`);

    // Delete users (this will cascade to related data if configured)
    console.log('3. Deleting all users...');
    const deletedUsers = await prisma.user.deleteMany({});
    console.log(`   ✅ Deleted ${deletedUsers.count} users\n`);

    console.log('✅ Cleanup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run Prisma migration: npx prisma migrate dev');
    console.log('   2. Apply database trigger: Run scripts/create-trial-trigger.sql in Supabase SQL Editor');
    console.log('   3. Test signup flow with email and Google OAuth');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanup()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

