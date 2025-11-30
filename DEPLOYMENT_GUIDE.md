# FastSchool Deployment Guide for Render.com

This guide will help you deploy FastSchool to Render.com with all the necessary configuration.

## 🚀 Pre-Deployment Checklist

- [ ] Project builds successfully (`pnpm run build`)
- [ ] All environment variables identified and documented
- [ ] Database connection configured
- [ ] Stripe test keys ready
- [ ] Resend API key obtained
- [ ] Supabase credentials configured

## 📋 Required Environment Variables for Render.com

Add these environment variables in your Render.com dashboard under **Environment** tab:

### 🔐 Database (Required)
```env
DATABASE_URL="postgresql://postgres.mofboditnsbvidtrepah:FastSchoolITalia@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&pgbouncer_mode=session&sslmode=require"
```
**Note:** Use Supabase Session Pooler connection string (with `pgbouncer=true`) - this is CRITICAL for Render.com!

### 🤖 AI Services (Required)
```env
GEMINI_API_KEY="your_gemini_api_key_here"
GOOGLE_SERVICE_KEY="your_base64_encoded_service_account_key"  # Optional
```

### 🔑 Supabase Configuration (Required)
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"  # ⚠️ CRITICAL for subscription system
```

### 💳 Stripe Configuration (Test Mode First)

**⚠️ IMPORTANT:** Start with test keys, then switch to live keys after testing!

```env
# Stripe Test Keys (Start Here)
STRIPE_SECRET_KEY="sk_test_your_test_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_test_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_test_webhook_secret"

# Stripe Product IDs (Test Mode)
STRIPE_PRODUCT_MONTHLY="prod_TVkIk1he6GaRpZ"
STRIPE_PRODUCT_YEARLY="prod_TVkISAXJLCD3Q4"
```

**After Testing Stripe (Switch to Live Keys):**
```env
# Stripe Live Keys (After Testing)
STRIPE_SECRET_KEY="sk_live_your_live_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_live_webhook_secret"

# Stripe Product IDs (Live Mode - Update these with your live product IDs)
STRIPE_PRODUCT_MONTHLY="prod_your_live_monthly_product_id"
STRIPE_PRODUCT_YEARLY="prod_your_live_yearly_product_id"
```

### 📧 Resend Email Configuration (For Contact Form)
```env
RESEND_API_KEY="re_your_resend_api_key"
RESEND_FROM_EMAIL="FastSchool <noreply@fastschool.com>"  # Must match your verified domain in Resend
```

### 🌐 Site Configuration
```env
NEXT_PUBLIC_SITE_URL="https://fastschool-new.onrender.com"  # Update with your Render.com URL
NODE_ENV="production"
```

### 🛠️ Render.com Configuration
```env
PORT="10000"
HOSTNAME="0.0.0.0"
SKIP_ENV_VALIDATION="true"  # Allows build to complete even if optional vars are missing
```

### 📹 YouTube Transcript (Optional)
```env
YT_TRANSCRIPT_IO_KEY="your_youtube_transcript_key"  # Optional
```

## 📝 How to Get Each API Key

### 1. Stripe Keys (Test Mode)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy **Publishable key** (starts with `pk_test_`)
3. Copy **Secret key** (starts with `sk_test_`)
4. For webhook secret:
   - Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
   - Click "Add endpoint"
   - URL: `https://your-render-url.onrender.com/api/stripe-webhook`
   - Select events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `checkout.session.completed`
   - Copy the webhook signing secret (starts with `whsec_`)

### 2. Resend API Key

1. Go to [Resend](https://resend.com/)
2. Sign up/Login
3. Go to API Keys section
4. Create a new API key
5. Verify your domain (for `RESEND_FROM_EMAIL`)
6. Copy the API key (starts with `re_`)

### 3. Supabase Keys

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Keep this secret!

### 4. Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to `GEMINI_API_KEY`

## 🚢 Deployment Steps on Render.com

### Step 1: Create a New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Name:** `fastschool-new` (or your preferred name)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `/` (or leave empty)
   - **Runtime:** `Node`
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm start`

### Step 2: Add Environment Variables

1. Go to **Environment** tab in your Render service
2. Add each environment variable from the list above
3. Click **"Save Changes"**

### Step 3: Configure Database Connection

⚠️ **IMPORTANT:** Make sure your `DATABASE_URL` uses the **Session Pooler** connection string from Supabase, not the direct connection string!

Format:
```
postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres?pgbouncer=true&pgbouncer_mode=session&sslmode=require
```

### Step 4: Deploy

1. Click **"Manual Deploy"** → **"Deploy latest commit"**
2. Wait for build to complete (usually 5-10 minutes)
3. Check build logs for any errors

### Step 5: Configure Stripe Webhook (After First Deploy)

1. Once deployed, copy your Render.com URL
2. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
3. Add endpoint: `https://your-render-url.onrender.com/api/stripe-webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `checkout.session.completed`
5. Copy the webhook signing secret
6. Add `STRIPE_WEBHOOK_SECRET` to Render.com environment variables
7. Redeploy the service

## 🧪 Testing Stripe (Test Mode)

### Testing Checklist:

1. ✅ Test subscription checkout flow
2. ✅ Test webhook events are received
3. ✅ Test subscription status updates
4. ✅ Test trial initialization
5. ✅ Test payment portal access

### After Testing:

Once everything works with test keys:
1. Switch to Stripe **Live Mode**
2. Create live products in Stripe Dashboard
3. Get live API keys
4. Create live webhook endpoint
5. Update all Stripe environment variables in Render.com
6. Update product IDs
7. Redeploy

## 🔍 Troubleshooting

### Build Fails

- Check build logs in Render.com dashboard
- Ensure all required environment variables are set
- Verify `SKIP_ENV_VALIDATION="true"` is set

### Database Connection Issues

- Verify `DATABASE_URL` uses session pooler
- Check Supabase connection pooling is enabled
- Ensure IP is allowed in Supabase (if IP restrictions are set)

### Stripe Webhook Not Working

- Verify webhook URL is correct
- Check webhook secret matches
- Review Render.com logs for webhook events
- Test webhook locally with Stripe CLI first

### Email Not Sending

- Verify `RESEND_API_KEY` is correct
- Check domain is verified in Resend
- Ensure `RESEND_FROM_EMAIL` matches verified domain
- Check Render.com logs for email errors

## 📚 Additional Resources

- [Stripe Testing Guide](STRIPE_SETUP_GUIDE.md)
- [Supabase Setup Guide](SUPABASE_SETUP.md)
- [Subscription System Documentation](TRIAL_SYSTEM_COMPLETE.md)

## 🎯 Next Steps After Deployment

1. ✅ Test all features on production URL
2. ✅ Test Stripe payments with test cards
3. ✅ Switch to Stripe live mode
4. ✅ Monitor error logs
5. ✅ Set up monitoring/alerts
6. ✅ Configure custom domain (if needed)

---

**Need Help?** Check the logs in Render.com dashboard or review the troubleshooting section above.

