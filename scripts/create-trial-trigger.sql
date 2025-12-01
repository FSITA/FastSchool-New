-- Supabase Database Trigger for Automatic Trial Initialization
-- This trigger automatically creates a User record and trial Subscription when a new auth user is created
-- Run this in Supabase SQL Editor

-- First, drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_trial();

-- Create function to initialize user and trial
CREATE OR REPLACE FUNCTION initialize_user_trial()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  subscription_id TEXT;
BEGIN
  -- Extract name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'display_name',
    split_part(NEW.email, '@', 1),
    NULL
  );
  
  -- Insert into User table if not exists
  -- Use auth.users.id as User.id (UUID format, stored as TEXT)
  -- Include all required fields with defaults
  INSERT INTO "User" (
    id, 
    email, 
    name, 
    role,
    "hasAccess",
    "createdAt", 
    "updatedAt"
  )
  VALUES (
    NEW.id::text,
    NEW.email,
    user_name,
    'USER'::"UserRole",  -- Default role
    false,                -- Default hasAccess
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE("User".email, NEW.email),
    name = COALESCE("User".name, user_name),
    "updatedAt" = NOW();
  
  -- Generate subscription ID using cuid-like format (or use extension if available)
  -- For now, use a simple UUID-based approach that works with TEXT
  subscription_id := encode(gen_random_bytes(16), 'hex');
  
  -- Create trial subscription if not exists
  INSERT INTO "Subscription" (
    id, 
    "userId", 
    "trialStart", 
    "trialEnd", 
    "subscriptionStatus", 
    "cancelAtPeriodEnd",
    "createdAt", 
    "updatedAt"
  )
  VALUES (
    subscription_id,
    NEW.id::text,
    NOW(),
    NOW() + INTERVAL '2 days',
    'trialing',
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT ("userId") DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth user creation
    RAISE WARNING 'Error in initialize_user_trial: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_trial();

-- Grant necessary permissions (if not already granted)
-- Note: These may need to be run as superuser
DO $$
BEGIN
  -- Grant schema usage
  GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
  
  -- Grant table permissions
  GRANT ALL ON "User" TO postgres, anon, authenticated, service_role;
  GRANT ALL ON "Subscription" TO postgres, anon, authenticated, service_role;
  
  -- Allow the trigger function to bypass RLS
  ALTER FUNCTION initialize_user_trial() SECURITY DEFINER;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Some permissions could not be granted. You may need to run as superuser.';
END $$;

