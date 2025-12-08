# Presentation Generation Fix - Foreign Key Constraint Issue

## Problem
Getting `Foreign key constraint violated: BaseDocument_userId_fkey` error when trying to generate presentations.

## Root Cause
The `createPresentation` function in `src/app/_actions/presentation/presentationActions.ts` was using a hardcoded `userId = "anonymous-user"`, but:
1. The "anonymous-user" record doesn't exist in the User table (we cleaned up all data during auth rebuild)
2. The code wasn't using the actual authenticated user's ID

## Solution Applied

### Updated `createPresentation` Function
- ✅ Now gets the authenticated user from Supabase Auth
- ✅ Ensures User record exists in Prisma database before creating BaseDocument
- ✅ Uses actual authenticated user ID instead of hardcoded "anonymous-user"
- ✅ Creates User record if it doesn't exist (handles edge cases)

### Changes Made
1. **Added authentication check**: Gets user from Supabase Auth
2. **Added `ensureUserExists` helper**: Creates User record if missing
3. **Removed hardcoded userId**: Now uses actual authenticated user ID

## Files Modified
- ✅ `src/app/_actions/presentation/presentationActions.ts`

## What's Protected
- ✅ Supabase Auth system - **NOT TOUCHED**
- ✅ User database - **NOT TOUCHED** (only reads/creates if missing)
- ✅ Subscription system - **NOT TOUCHED**
- ✅ Prisma schema - **NOT TOUCHED**

## Testing
After this fix:
1. ✅ Try creating a new presentation
2. ✅ Try generating outlines
3. ✅ Try generating slides
4. ✅ All should work with your authenticated user

## How It Works Now

1. User is authenticated (via middleware)
2. `createPresentation` gets user from Supabase Auth
3. Checks if User record exists in Prisma database
4. Creates User record if missing (using auth user's ID, email, name)
5. Creates BaseDocument with correct userId
6. Foreign key constraint is satisfied ✅

The fix ensures the User record exists before creating any BaseDocument, preventing the foreign key violation error.

