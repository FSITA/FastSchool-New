-- Expire the trial for testing
-- This sets the trialEnd to 1 day ago, so the trial will be expired
-- Run this in Supabase SQL Editor

UPDATE "Subscription" 
SET 
  "trialEnd" = NOW() - INTERVAL '1 day',
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

