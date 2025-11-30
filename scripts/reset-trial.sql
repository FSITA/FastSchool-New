-- Reset the trial to active (2 days from now)
-- Use this to restore the trial after testing expiration
-- Run this in Supabase SQL Editor

UPDATE "Subscription" 
SET 
  "trialStart" = NOW(),
  "trialEnd" = NOW() + INTERVAL '2 days',
  "subscriptionStatus" = 'trialing',
  "updatedAt" = NOW()
WHERE "userId" = 'dev-bypass-user';

-- Verify the update
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
  NOW() as current_time
FROM "Subscription" 
WHERE "userId" = 'dev-bypass-user';

