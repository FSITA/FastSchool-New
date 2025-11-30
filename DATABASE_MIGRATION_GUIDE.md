# Database Migration Guide

## Problem: "FATAL: Tenant or user not found"

This error occurs when using the **pooler connection** for Prisma migrations. Prisma needs a **direct connection** to run migrations.

## Solution: Use Two Different Connection Strings

### For Prisma Migrations (Direct Connection)

You need the **direct database connection** from Supabase:

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **Database**
3. Scroll down to **Connection string**
4. Select **URI** tab (not Session mode)
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### For Application (Pooler Connection)

Keep using the pooler connection for your application (in `.env.local`):
```
postgresql://postgres.mofboditnsbvidtrepah:FastSchoolITalia@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&pgbouncer_mode=session&sslmode=require
```

## Quick Fix: Run Migration with Direct Connection

### Option 1: Temporary Environment Variable (Recommended)

Run the migration with a direct connection string temporarily:

```bash
# Windows PowerShell
$env:DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"; npx prisma db push

# Or set it inline (replace with your actual direct connection)
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres" npx prisma db push
```

### Option 2: Create a Separate .env File for Migrations

Create a `.env.migration` file with the direct connection:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"
```

Then run:
```bash
# Load from .env.migration
dotenv -e .env.migration -- npx prisma db push
```

### Option 3: Update .env.local Temporarily

1. Open your `.env.local` file
2. Temporarily replace `DATABASE_URL` with the direct connection string
3. Run `npx prisma db push`
4. Change it back to the pooler connection after migration completes

## Getting Your Direct Connection String from Supabase

1. **Login to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings** → **Database**
4. **Find "Connection string"** section
5. **Select "URI"** (not Session mode)
6. **Copy the connection string**
7. **Replace `[YOUR-PASSWORD]`** with your actual database password

The format should be:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## After Migration

Once the migration is complete, make sure your `.env.local` has the **pooler connection** for normal application use:

```env
# Use pooler for application (better for production)
DATABASE_URL="postgresql://postgres.mofboditnsbvidtrepah:FastSchoolITalia@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&pgbouncer_mode=session&sslmode=require"
```

## Why Two Different Connections?

- **Direct Connection**: Required for migrations, schema changes, and Prisma Studio
- **Pooler Connection**: Better for production applications (handles connection pooling, better performance)

## Troubleshooting

### Still Getting "Tenant or user not found"?

1. **Verify your password**: Make sure you're using the correct database password
2. **Check project reference**: Ensure the project reference in the URL is correct
3. **Check IP restrictions**: Make sure your IP isn't blocked in Supabase
4. **Reset password**: If needed, reset your database password in Supabase Dashboard

### Connection Timeout?

- Make sure you're using the direct connection (not pooler)
- Check your internet connection
- Verify Supabase project is active

## Next Steps After Migration

Once the migration succeeds:

1. ✅ Verify the `Subscription` table was created
2. ✅ Test the application with the pooler connection
3. ✅ Continue with subscription system testing

