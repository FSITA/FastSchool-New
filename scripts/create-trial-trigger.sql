-- Supabase Database Trigger for Automatic Trial Initialization
-- This trigger automatically creates a User record and trial Subscription when a new auth user is created
-- Run this in Supabase SQL Editor

-- Create function to initialize user and trial
CREATE OR REPLACE FUNCTION initialize_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into User table if not exists
  -- Use auth.users.id as User.id (must match exactly)
  INSERT INTO "User" (id, email, name, "createdAt", "updatedAt")
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE("User".email, NEW.email),
    name = COALESCE("User".name, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    "updatedAt" = NOW();
  
  -- Create trial subscription if not exists
  INSERT INTO "Subscription" (id, "userId", "trialStart", "trialEnd", "subscriptionStatus", "createdAt", "updatedAt")
  VALUES (
    gen_random_uuid()::text,
    NEW.id,
    NOW(),
    NOW() + INTERVAL '2 days',
    'trialing',
    NOW(),
    NOW()
  )
  ON CONFLICT ("userId") DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_trial();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON "User" TO postgres, anon, authenticated, service_role;
GRANT ALL ON "Subscription" TO postgres, anon, authenticated, service_role;

