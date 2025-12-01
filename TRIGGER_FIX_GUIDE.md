# Trigger Fix Guide - Database Error Saving New User

## Problem
Getting "Database error saving new user" when trying to sign up. This is likely caused by the database trigger failing.

## Quick Fix Options

### Option 1: Disable Trigger Temporarily (Test if trigger is the issue)

1. Run `scripts/disable-trigger-temporarily.sql` in Supabase SQL Editor
2. Try signing up again
3. If it works, the trigger is the issue - proceed to Option 2 or 3
4. If it still fails, the issue is elsewhere (check RLS policies)

### Option 2: Use Updated Trigger (Recommended)

1. Run `scripts/create-trial-trigger.sql` (updated version) in Supabase SQL Editor
2. This version includes:
   - Better error handling
   - All required fields
   - Proper exception handling

### Option 3: Use Alternative Trigger

1. Run `scripts/fix-trigger-alternative.sql` in Supabase SQL Editor
2. This is a simpler version that might work better

### Option 4: Disable Trigger and Use Application-Level Only

1. Run `scripts/disable-trigger-temporarily.sql`
2. The application code will handle trial initialization (already implemented)
3. This is less reliable but will work

## Diagnosing the Issue

Run `scripts/diagnose-trigger-issue.sql` to check:
- If trigger exists
- If RLS policies are blocking inserts
- If function has correct permissions

## Common Issues and Fixes

### Issue: RLS Policies Blocking Insert

**Fix:** Disable RLS on User and Subscription tables (if safe for your use case):

```sql
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" DISABLE ROW LEVEL SECURITY;
```

Or create a policy that allows the trigger function:

```sql
CREATE POLICY "Allow trigger function to insert users"
ON "User" FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);

CREATE POLICY "Allow trigger function to insert subscriptions"
ON "Subscription" FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (true);
```

### Issue: Missing Required Fields

**Fix:** The updated trigger now includes all required fields:
- `role` (defaults to 'USER')
- `hasAccess` (defaults to false)
- `cancelAtPeriodEnd` (defaults to false)

### Issue: ID Format Mismatch

**Fix:** The trigger now uses `NEW.id::text` to convert UUID to TEXT, which should work with Prisma's TEXT id field.

## Recommended Approach

1. **First:** Disable trigger temporarily to confirm it's the issue
2. **Then:** Run the updated trigger script
3. **If still failing:** Check RLS policies and disable if needed (or create proper policies)
4. **Last resort:** Disable trigger and rely on application-level initialization

## Testing

After applying a fix:

1. Try email signup - should work
2. Try Google OAuth - should work
3. Check Supabase Dashboard:
   - `auth.users` should have new user
   - `User` table should have matching record
   - `Subscription` table should have trial record

## Fallback: Application-Level Only

If triggers continue to cause issues, you can rely solely on application-level initialization:

1. Disable the trigger permanently
2. The code in `src/contexts/AuthContext.tsx` and `src/app/auth/callback/page.tsx` will handle trial creation
3. This is less reliable (can fail if API call fails) but will work

