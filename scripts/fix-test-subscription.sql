-- Fix subscription to use the correct mock user ID for auth bypass
-- Run this in Supabase SQL Editor

UPDATE "Subscription" 
SET 
  "userId" = 'dev-bypass-user',
  "updatedAt" = NOW()
WHERE "userId" = 'anonymous-user';

-- Verify the update
SELECT * FROM "Subscription" WHERE "userId" = 'dev-bypass-user';

