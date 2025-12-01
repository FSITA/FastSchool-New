-- Alternative: Simpler trigger that uses Prisma's cuid() format
-- If the above trigger still fails, try this version

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS initialize_user_trial();

-- Create a simpler function that uses extensions for cuid generation
-- Or use a simpler ID generation
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
    split_part(COALESCE(NEW.email, ''), '@', 1),
    NULL
  );
  
  -- Insert into User table
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
    'USER'::"UserRole",
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = COALESCE("User".email, NEW.email),
    name = COALESCE("User".name, user_name),
    "updatedAt" = NOW();
  
  -- Generate a simple ID for subscription (32 char hex string)
  subscription_id := lower(encode(gen_random_bytes(16), 'hex'));
  
  -- Create trial subscription
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
    -- Log the error
    RAISE WARNING 'Error in initialize_user_trial for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow auth user creation to succeed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION initialize_user_trial();

-- Verify trigger was created
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

