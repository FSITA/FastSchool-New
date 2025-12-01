-- Temporarily disable the trigger to test if it's causing the issue
-- Run this if you want to test signup without the trigger

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- To re-enable later, run the create-trial-trigger.sql script again

