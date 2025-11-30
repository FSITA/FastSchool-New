# Stripe Payment & Subscription Setup Guide

This guide covers the complete setup and testing process for the payment and subscription system.

## Phase 1-9 Implementation Complete ✅

All phases have been implemented:
- ✅ Database schema with Subscription model
- ✅ Environment variables configuration
- ✅ Stripe dependencies installed
- ✅ Stripe utility functions
- ✅ API routes (checkout, portal, webhook)
- ✅ Middleware for route protection
- ✅ Trial initialization on signup
- ✅ Pricing page

## Environment Variables Setup

### Local Development (.env.local)

Add these variables to your `.env.local` file:

```env
# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Stripe Product IDs
STRIPE_PRODUCT_MONTHLY=prod_TVkIk1he6GaRpZ
STRIPE_PRODUCT_YEARLY=prod_TVkISAXJLCD3Q4

# Site URL (for redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Getting Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your **Test** publishable key (starts with `pk_test_`)
3. Copy your **Test** secret key (starts with `sk_test_`)
4. Keep these keys secure - never commit them to git

## Database Migration

Run the Prisma migration to create the Subscription table:

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Or create a migration
npx prisma migrate dev --name add_subscription_model
```

## Stripe Webhook Setup

### For Local Development

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

### For Production (Render.com)

1. Go to [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your endpoint URL: `https://fastschoolitalia.com/api/stripe-webhook`
4. Select these events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret and add it to Render.com environment variables

## Testing Flow

### 1. Test User Registration & Trial

1. Start your development server:
   ```bash
   pnpm dev
   ```

2. Register a new user at `http://localhost:3000/auth/register`
3. After registration, check the database:
   ```sql
   SELECT * FROM "Subscription" WHERE "userId" = 'YOUR_USER_ID';
   ```
   You should see:
   - `subscriptionStatus`: `"trialing"`
   - `trialStart`: Current timestamp
   - `trialEnd`: 2 days from now

4. Try accessing an AI page (e.g., `/presentation`)
   - Should work during trial period

### 2. Test Subscription Flow

1. Wait for trial to expire OR manually update the database:
   ```sql
   UPDATE "Subscription" 
   SET "trialEnd" = NOW() - INTERVAL '1 day'
   WHERE "userId" = 'YOUR_USER_ID';
   ```

2. Try accessing an AI page
   - Should redirect to `/pricing`

3. Go to `/pricing` and click "Subscribe" on a plan
   - Should redirect to Stripe Checkout

4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. Complete the payment
   - Webhook should update the subscription in database
   - Check database:
     ```sql
     SELECT * FROM "Subscription" WHERE "userId" = 'YOUR_USER_ID';
     ```
   - Should show:
     - `subscriptionStatus`: `"active"`
     - `plan`: `"monthly"` or `"yearly"`
     - `stripeCustomerId`: Customer ID
     - `stripeSubscriptionId`: Subscription ID
     - `currentPeriodEnd`: Future date

6. Try accessing an AI page again
   - Should work now

### 3. Test Webhook Events

You can trigger test webhook events using Stripe CLI:

```bash
# Test checkout completed
stripe trigger checkout.session.completed

# Test subscription created
stripe trigger customer.subscription.created

# Test subscription updated
stripe trigger customer.subscription.updated

# Test subscription deleted
stripe trigger customer.subscription.deleted

# Test payment succeeded
stripe trigger invoice.payment_succeeded

# Test payment failed
stripe trigger invoice.payment_failed
```

## Protected Routes

The following routes require an active subscription or valid trial:

- `/presentation`
- `/flashcards`
- `/lesson-generator`
- `/lesson-planner`
- `/quiz-generator`
- `/diagram-generator`
- `/summary-generator`

Public routes (no subscription required):
- `/` (homepage)
- `/auth/*` (authentication pages)
- `/pricing` (pricing page)
- `/contact` (contact page)
- `/api/*` (API routes)

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook endpoint is accessible:
   ```bash
   curl https://fastschoolitalia.com/api/stripe-webhook
   ```

2. Check Stripe Dashboard > Webhooks for delivery logs
3. Verify `STRIPE_WEBHOOK_SECRET` matches the webhook signing secret
4. Check server logs for errors

### Subscription Not Updating After Payment

1. Check webhook delivery in Stripe Dashboard
2. Verify webhook signature verification is working
3. Check database for errors
4. Review server logs

### Middleware Not Redirecting

1. Verify middleware is enabled (not commented out)
2. Check that protected routes are in `PROTECTED_AI_ROUTES` array
3. Verify `hasActiveAccess` function is working
4. Check user authentication status

### Trial Not Initializing

1. Check `/api/subscription/initialize-trial` endpoint
2. Verify it's called after successful signup
3. Check database for subscription record
4. Review server logs

## Next Steps (Phase 10 - Production)

Once testing is complete:

1. **Switch to Live Mode**:
   - Get live Stripe keys from Stripe Dashboard
   - Update environment variables on Render.com
   - Update webhook endpoint in Stripe Dashboard

2. **Update Product IDs** (if needed):
   - Verify product IDs match your live products
   - Update in code if different

3. **Test with Real Payment**:
   - Use a real card (will be charged)
   - Verify webhook delivery
   - Test subscription management

4. **Monitor**:
   - Set up Stripe webhook monitoring
   - Monitor subscription status changes
   - Set up alerts for failed payments

## Support

For issues or questions:
- Check Stripe Dashboard logs
- Review server logs
- Check database subscription records
- Verify environment variables are set correctly

