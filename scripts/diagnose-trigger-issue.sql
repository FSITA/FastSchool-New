-- Diagnostic script to check trigger and permissions
-- Run this to see what might be wrong

-- 1. Check if trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled,
  pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Check function exists
SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'initialize_user_trial';

-- 3. Check RLS policies on User table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'User';

-- 4. Check RLS policies on Subscription table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'Subscription';

-- 5. Check if RLS is enabled on tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('User', 'Subscription');

-- 6. Test the function manually (replace with a test UUID)
-- DO $$
-- DECLARE
--   test_user_id UUID := '00000000-0000-0000-0000-000000000000'::UUID;
-- BEGIN
--   PERFORM initialize_user_trial();
-- END $$;

