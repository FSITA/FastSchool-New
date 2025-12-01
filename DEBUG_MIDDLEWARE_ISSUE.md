# Debugging Middleware Access Issue

## Problem
User has active trial (2 days remaining) but cannot access AI pages. Middleware is blocking access.

## Client-Side Evidence
- ✅ Trial status shows: "Free Trial" with 2 days remaining
- ✅ Status API returns: `isTrial: true, daysRemaining: 2`
- ✅ Card click is logged
- ❌ No access to AI page (likely redirected to /pricing)

## Server-Side Investigation Needed

### Check Server Logs For:
1. `[Middleware]` logs - Should show access check process
2. `[hasActiveAccessEdge]` logs - Should show subscription query attempts
3. Any errors about table/column names

### Possible Issues:

#### 1. Table Name Mismatch
- Prisma creates table as `Subscription` (capitalized)
- Supabase might expect `subscription` (lowercase)
- **Fix**: Try both in query

#### 2. Column Name Mismatch  
- Prisma uses `userId` (camelCase)
- PostgreSQL might store as `user_id` (snake_case)
- **Fix**: Try both in query

#### 3. Service Role Key Missing
- `SUPABASE_SERVICE_ROLE_KEY` might not be set
- Without it, queries might fail due to RLS
- **Check**: Environment variable is set

#### 4. Database Sync Issue
- Subscription created in Prisma but not visible in Supabase
- **Check**: Query Supabase directly to see if subscription exists

## Debugging Steps

### Step 1: Check Server Logs
Look for these log prefixes in your server console:
- `[Middleware]`
- `[hasActiveAccessEdge]`

### Step 2: Verify Environment Variables
```bash
# Check if these are set:
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Step 3: Check Database Directly
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM "Subscription" WHERE "userId" = 'your-user-id';
-- Also try:
SELECT * FROM subscription WHERE user_id = 'your-user-id';
```

### Step 4: Check Table Structure
```sql
-- Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check Subscription table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Subscription' OR table_name = 'subscription';
```

## Enhanced Logging Added

I've added comprehensive logging to:
1. `src/lib/stripe/subscription-helpers-edge.ts` - More detailed query attempts
2. `src/middleware.ts` - Better access check logging
3. `src/app/page.tsx` - Dashboard render logging

## Next Steps

1. **Check your server logs** (not browser console) for middleware logs
2. **Verify SUPABASE_SERVICE_ROLE_KEY** is set in environment
3. **Check database** to see actual table/column names
4. **Share server logs** so we can see what's happening

The enhanced logging will show exactly which table/column combinations are being tried and what errors occur.

