-- Cleanup script to delete all User, Subscription, and Account data
-- This script will delete all authentication-related data
-- WARNING: This is destructive and cannot be undone!

-- Delete all subscriptions first (due to foreign key constraints)
DELETE FROM "Subscription";

-- Delete all accounts
DELETE FROM "Account";

-- Delete all users (this will cascade to related data in other tables if configured)
-- Note: We're keeping BaseDocument, Presentation, CustomTheme, FavoriteDocument intact
-- But we need to handle orphaned documents - you may want to delete them or assign to a system user
DELETE FROM "User";

-- Reset sequences if using auto-increment (not applicable for UUID/cuid, but keeping for completeness)
-- For Prisma with cuid(), this isn't needed

-- Optional: Delete orphaned documents (uncomment if you want to clean up documents without users)
-- DELETE FROM "BaseDocument" WHERE "userId" NOT IN (SELECT id FROM "User");
-- Note: This is commented out to preserve Presentation AI data as per requirements

