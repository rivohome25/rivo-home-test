# Billing & Subscription Setup Guide

This guide will help you set up Stripe billing for RivoHome.

## Prerequisites

1. A Stripe account (create one at https://stripe.com)
2. Your Supabase project with the billing tables migrated
3. Node.js and npm installed

## Step 1: Install Dependencies

```bash
npm install stripe @stripe/stripe-js
```

## Step 2: Create Stripe Products and Prices

1. Log in to your Stripe Dashboard
2. Navigate to **Products** → **Add Product**
3. Create three products:

### Free Plan
- **Name**: RivoHome Free
- **Description**: Basic home management features
- **Price**: $0 (one-time or recurring)

### Core Plan
- **Name**: RivoHome Core
- **Description**: Enhanced features for serious homeowners
- **Price**: $7.00/month (recurring)
- **Billing period**: Monthly

### Premium Plan
- **Name**: RivoHome Premium
- **Description**: All features with unlimited access
- **Price**: $20.00/month (recurring)
- **Billing period**: Monthly

4. Copy the Price IDs (they start with `price_`) for Core and Premium plans

## Step 3: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Stripe Price IDs
STRIPE_PRICE_ID_CORE=price_your_core_plan_price_id
STRIPE_PRICE_ID_PREMIUM=price_your_premium_plan_price_id

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Set Up Stripe Webhook

### Local Development (using Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login to Stripe CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET`

### Production Setup

1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
5. Copy the signing secret and add it to your production environment variables

## Step 5: Database Setup

The migration has already been applied, but verify these tables exist:
- `plans` - Contains your three plan tiers
- `user_plans` - Tracks user subscriptions with Stripe IDs

## Step 6: Test the Integration

### 1. Test Checkout Flow
- Sign up as a new user
- Navigate to Settings → Billing
- Click "Upgrade to Core"
- Use test card: `4242 4242 4242 4242`
- Complete the checkout

### 2. Test Subscription Management
- View your active subscription
- Check invoice history
- Test cancellation

### 3. Test Webhook Processing
- Monitor webhook events in Stripe Dashboard
- Verify database updates after successful payment

## Stripe Test Cards

Use these test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`

## Troubleshooting

### Webhook Signature Verification Failed
- Ensure you're using the correct webhook secret
- Check that you're passing the raw request body

### Checkout Session Not Created
- Verify your Stripe API keys
- Check that Price IDs are correct
- Ensure user is authenticated

### Subscription Status Not Updating
- Check webhook logs in Stripe Dashboard
- Verify database permissions for service role
- Check Supabase logs for errors

## Production Checklist

- [ ] Use production Stripe keys (start with `sk_live_` and `pk_live_`)
- [ ] Set up production webhook endpoint
- [ ] Configure proper CORS settings
- [ ] Enable Stripe tax collection if needed
- [ ] Set up proper error monitoring
- [ ] Test with real payment methods
- [ ] Configure subscription trial periods if desired

## Security Best Practices

1. **Never expose secret keys** - Only use `STRIPE_SECRET_KEY` on the server
2. **Validate webhook signatures** - Always verify Stripe webhook signatures
3. **Use HTTPS in production** - Stripe requires HTTPS for production webhooks
4. **Implement idempotency** - Handle duplicate webhook events gracefully
5. **Log important events** - Track subscription changes for audit trails 