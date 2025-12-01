# Troubleshooting: Cannot Access AI Pages Despite Active Trial

## Issue
- ✅ Trial shows as active (2 days remaining) in UI
- ✅ Status API returns correct trial data
- ❌ Cannot access AI pages (redirected to /pricing)

## Root Cause
The middleware queries Supabase directly, but there may be a table/column name mismatch between Prisma and Supabase.

## Immediate Action Required

### 1. Check Server Logs (NOT Browser Console)
The middleware logs are **server-side only**. Check your server console/terminal for:

**Look for these log prefixes:**
- `[Middleware]` - Shows access check process
- `[hasActiveAccessEdge]` - Shows subscription query attempts

**What to look for:**
- Which table/column combinations are being tried
- Any error messages about table/column not found
- Whether subscription is found or not

### 2. Verify Environment Variables
Make sure these are set in your `.env` or production environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key  # ⚠️ CRITICAL
```

Without `SUPABASE_SERVICE_ROLE_KEY`, queries will fail due to RLS (Row Level Security).

### 3. Check Database Table Structure
Run this in Supabase SQL Editor to see actual table/column names:

```sql
-- Check if table exists and its name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name = 'Subscription' OR table_name = 'subscription');

-- Check column names
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Subscription' OR table_name = 'subscription';
```

### 4. Verify Subscription Exists
Check if subscription exists for your user:

```sql
-- Try with capitalized table name
SELECT * FROM "Subscription" WHERE "userId" = 'your-user-id-here';

-- Try with lowercase table name  
SELECT * FROM subscription WHERE user_id = 'your-user-id-here';

-- Try with camelCase column
SELECT * FROM subscription WHERE "userId" = 'your-user-id-here';
```

## What the Enhanced Logging Will Show

The updated code now logs:
1. **Every table/column combination tried**
2. **Exact error messages** from Supabase
3. **Whether subscription is found** and from which table/column
4. **Final access decision** (granted or denied)

## Next Steps

1. **Share your server logs** - Copy all `[Middleware]` and `[hasActiveAccessEdge]` logs
2. **Share table structure** - Results from SQL queries above
3. **Verify service key** - Confirm `SUPABASE_SERVICE_ROLE_KEY` is set

With this information, we can identify the exact issue and fix it.

## Quick Test

Try accessing an AI page and immediately check your server logs. You should see:
```
[Middleware] ========== MIDDLEWARE CALLED ==========
[Middleware] Pathname: /presentation
[hasActiveAccessEdge] ========== STARTING ACCESS CHECK ==========
[hasActiveAccessEdge] 🔍 Starting subscription search...
[hasActiveAccessEdge] 🔍 Strategy 1: Table="Subscription", Column="userId"
...
```

If you see errors about table/column not found, that's the issue!

