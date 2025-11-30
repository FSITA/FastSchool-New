-- Expire the trial for testing redirect to pricing
-- This sets the trialEnd to 1 day ago, so the trial will be expired
-- Run this in Supabase SQL Editor

UPDATE "Subscription" 
SET 
  "trialEnd" = NOW() - INTERVAL '1 day',
  "subscriptionStatus" = 'trialing',
  "updatedAt" = NOW()
WHERE "userId" = 'dev-bypass-user';

-- Verify the update - should show trial_status as 'EXPIRED'
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
  NOW() - "trialEnd" as time_expired
FROM "Subscription" 
WHERE "userId" = 'dev-bypass-user';

