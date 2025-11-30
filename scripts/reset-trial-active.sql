-- Reset the trial to ACTIVE (2 days from now)
-- Use this to restore the trial and test access during trial period
-- Run this in Supabase SQL Editor

UPDATE "Subscription" 
SET 
  "trialStart" = NOW(),
  "trialEnd" = NOW() + INTERVAL '2 days',
  "subscriptionStatus" = 'trialing',
  "updatedAt" = NOW()
WHERE "userId" = 'dev-bypass-user';

-- Verify the update - should show trial_status as 'ACTIVE'
SELECT 
  "id",
  "userId",
  "trialStart",
  "trialEnd",
  "subscriptionStatus",
  CASE 
    WHEN "trialEnd" < NOW() THEN 'EXPIRED'
    ELSE 'ACTIVE'
  END as trial_status,
  NOW() as current_time,
  "trialEnd" - NOW() as time_remaining
FROM "Subscription" 
WHERE "userId" = 'dev-bypass-user';

