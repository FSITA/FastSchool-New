import Stripe from 'stripe';

console.log('[STRIPE CLIENT] Initializing Stripe client...');
console.log('[STRIPE CLIENT] Environment check:', {
  hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
  stripeSecretKeyPrefix: process.env.STRIPE_SECRET_KEY 
    ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' 
    : 'MISSING',
  nodeEnv: process.env.NODE_ENV,
});

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('[STRIPE CLIENT] ❌ STRIPE_SECRET_KEY is not set!');
  throw new Error('STRIPE_SECRET_KEY is not set');
}

// Validate key format
const keyPrefix = process.env.STRIPE_SECRET_KEY.substring(0, 7);
if (!keyPrefix.startsWith('sk_')) {
  console.warn('[STRIPE CLIENT] ⚠️ Stripe secret key does not start with "sk_" - might be invalid');
  console.warn('[STRIPE CLIENT] Key prefix:', keyPrefix);
}

let stripe: Stripe;
try {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-12-18.acacia',
    typescript: true,
  });
  console.log('[STRIPE CLIENT] ✅ Stripe client initialized successfully');
} catch (error) {
  console.error('[STRIPE CLIENT] ❌ Failed to initialize Stripe client:', error);
  throw error;
}

export { stripe };

