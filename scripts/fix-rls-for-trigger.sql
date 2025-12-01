-- Fix RLS (Row Level Security) policies to allow trigger function to insert
-- This is likely the main issue causing "Database error saving new user"

-- Option 1: Disable RLS entirely (if you don't need it)
-- ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;

-- Option 2: Create policies that allow the trigger function (RECOMMENDED)
-- The trigger function runs with SECURITY DEFINER, so it should bypass RLS
-- But we'll create policies just in case

-- Check current RLS status
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'Subscription');

-- Create policies for User table
DROP POLICY IF EXISTS "Allow trigger to insert users" ON "User";
CREATE POLICY "Allow trigger to insert users"
ON "User" FOR INSERT
TO authenticated, anon, service_role, postgres
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow trigger to update users" ON "User";
CREATE POLICY "Allow trigger to update users"
ON "User" FOR UPDATE
TO authenticated, anon, service_role, postgres
USING (true)
WITH CHECK (true);

-- Create policies for Subscription table
DROP POLICY IF EXISTS "Allow trigger to insert subscriptions" ON "Subscription";
CREATE POLICY "Allow trigger to insert subscriptions"
ON "Subscription" FOR INSERT
TO authenticated, anon, service_role, postgres
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow trigger to update subscriptions" ON "Subscription";
CREATE POLICY "Allow trigger to update subscriptions"
ON "Subscription" FOR UPDATE
TO authenticated, anon, service_role, postgres
USING (true)
WITH CHECK (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('User', 'Subscription')
ORDER BY tablename, policyname;

