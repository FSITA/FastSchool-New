# Image Generation Fix - Foreign Key Constraint Issue

## Problem
Images were not showing on slides. Getting `Foreign key constraint violated: GeneratedImage_userId_fkey` error when trying to save generated images.

## Root Cause
The `generateImageAction` function in `src/app/_actions/image/generate.ts` was using a hardcoded `userId = "anonymous-user"`, but:
1. The "anonymous-user" record doesn't exist in the User table (we cleaned up all data during auth rebuild)
2. The code wasn't using the actual authenticated user's ID

## Solution Applied

### Updated `generateImageAction` Function
- ✅ Now gets the authenticated user from Supabase Auth
- ✅ Ensures User record exists in Prisma database before creating GeneratedImage
- ✅ Uses actual authenticated user ID instead of hardcoded "anonymous-user"
- ✅ Creates User record if it doesn't exist (handles edge cases)

### Changes Made
1. **Added authentication check**: Gets user from Supabase Auth
2. **Added `ensureUserExists` helper**: Creates User record if missing
3. **Removed hardcoded userId**: Now uses actual authenticated user ID

## Files Modified
- ✅ `src/app/_actions/image/generate.ts`

## What's Protected
- ✅ Supabase Auth system - **NOT TOUCHED**
- ✅ User database - **NOT TOUCHED** (only reads/creates if missing)
- ✅ Subscription system - **NOT TOUCHED**
- ✅ Prisma schema - **NOT TOUCHED**
- ✅ Presentation system - **NOT TOUCHED**

## Testing
After this fix:
1. ✅ Try generating images in presentations
2. ✅ Images should now appear on slides
3. ✅ Image metadata should be saved correctly
4. ✅ All should work with your authenticated user

## How It Works Now

1. User is authenticated (via middleware)
2. `generateImageAction` gets user from Supabase Auth
3. Checks if User record exists in Prisma database
4. Creates User record if missing (using auth user's ID, email, name)
5. Creates GeneratedImage with correct userId
6. Foreign key constraint is satisfied ✅
7. Images are displayed on slides ✅

The fix ensures the User record exists before creating any GeneratedImage, preventing the foreign key violation error and allowing images to display properly.

