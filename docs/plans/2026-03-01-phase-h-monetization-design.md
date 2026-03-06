# Phase H — Subscription System Design
**Date:** 2026-03-01
**Status:** Approved
**Scope:** Subscription tracking (no feature gating in this pass)

## Problem

The app has no subscription awareness. Payments are invisible to the database. The checkout flow uses one-time payment mode, hardcoded prices, and no pricing table. Nothing is saved when a customer pays.

## Goal

When a customer registers and selects a plan, Stripe fires a webhook, and the app saves their subscription data to their Organization record. This enables future gating, billing management, and customer support visibility.

## What Is NOT in This Pass

- Feature gating (no routes locked behind planTier yet)
- Billing management UI (no "manage subscription" page)
- Email notifications on subscription events
- Free trial logic

## Architecture

### Data Flow

1. User registers → account + organization created in DB
2. User redirected to `/pricing` page (new)
3. User selects plan in Stripe Pricing Table → Stripe handles checkout
4. Stripe fires `checkout.session.completed` webhook
5. Webhook handler finds Organization by customer email → saves subscription fields
6. On subscription changes, Stripe fires `customer.subscription.updated` / `customer.subscription.deleted`
7. Webhook handler updates Organization accordingly

### Tier → Price ID Mapping (from env vars)

| Tier  | Env Var                      |
|-------|------------------------------|
| pro   | STRIPE_PRICE_PRO_MONTHLY / STRIPE_PRICE_PRO_ANNUAL |
| elite | STRIPE_PRICE_ELITE_MONTHLY / STRIPE_PRICE_ELITE_ANNUAL |
| titan | STRIPE_PRICE_TITAN_MONTHLY / STRIPE_PRICE_TITAN_ANNUAL |

The webhook handler reads all 6 price ID env vars and resolves incoming `stripePriceId` to a tier name.

## Changes (in implementation order)

### 1. prisma/schema.prisma
Add 5 fields to Organization model:
```
stripeCustomerId     String?
stripeSubscriptionId String?
stripePriceId        String?
subscriptionStatus   String?   // active | trialing | past_due | canceled | free
planTier             String?   // free | pro | elite | titan
```

### 2. Prisma migration
Run on staging DB first, verify, then run on production DB.

### 3. app/api/create-checkout-session/route.ts
- Line 64: change `mode: 'payment'` → `mode: 'subscription'`
- Remove hardcoded amount fallback (STRIPE_REGISTRATION_AMOUNT env var no longer used)
- Keep priceId path intact (used for direct checkout if needed later)

### 4. app/api/stripe-webhook/route.ts
Handle three events:
- `checkout.session.completed` — get `customer_email`, find User by email → get organizationId → update Organization with Stripe customer ID, subscription ID, price ID, status, tier
- `customer.subscription.updated` — look up org by stripeCustomerId or stripeSubscriptionId → update status + tier
- `customer.subscription.deleted` — set subscriptionStatus = 'canceled', planTier = 'free'

### 5. app/auth/register/page.tsx
Remove lines 183–208 (hardcoded checkout call). After successful registration, redirect to `/pricing` instead of `/payments/checkout`.

### 6. app/pricing/page.tsx (new file)
Simple server component that renders the Stripe Pricing Table embed:
```tsx
<script async src="https://js.stripe.com/v3/pricing-table.js" />
<stripe-pricing-table
  pricing-table-id={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}
  publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
/>
```
Add `/pricing` to middleware public paths.

## Testing Plan

**Local:**
- Run `stripe listen --forward-to localhost:3000/api/stripe-webhook` in terminal 2
- Copy whsec_ into .env.local as STRIPE_WEBHOOK_SECRET
- Run `npm run dev` in terminal 1
- Complete a test checkout with Stripe test card
- Verify Organization record updated in DB

**Staging:**
- Push to staging branch
- Complete test checkout on staging URL
- Verify webhook fires (check Stripe dashboard → Webhooks → events)
- Verify Organization record updated in staging DB

**Production:**
- Push to main after staging passes
- Verify with a real subscription if available, or monitor webhook logs

## Files Touched

| File | Change Type |
|------|-------------|
| `prisma/schema.prisma` | Add 5 fields to Organization |
| `app/api/create-checkout-session/route.ts` | mode: payment → subscription |
| `app/api/stripe-webhook/route.ts` | Handle 3 subscription events |
| `app/auth/register/page.tsx` | Replace checkout call with /pricing redirect |
| `app/pricing/page.tsx` | New file — Stripe Pricing Table embed |
| `middleware.ts` | Add /pricing to public paths |
