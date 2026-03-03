# Phase H — Subscription System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire Stripe subscriptions into the app so that when a customer pays, their Organization record is updated with their plan tier and subscription status.

**Architecture:** After registration, users are redirected to a `/pricing` page embedding a Stripe Pricing Table. When a customer completes checkout, Stripe fires a webhook, and the handler finds the Organization by customer email and saves subscription data. The app tracks tier but does not gate features in this pass.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Prisma 6, Stripe SDK, Supabase PostgreSQL

---

## Task 1: Add subscription fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add 5 fields to the Organization model**

Open `prisma/schema.prisma`. Find the Organization model and add these fields after `website`:

```prisma
model Organization {
  id          String        @id @default(uuid())
  name        String
  slug        String?       @unique
  createdAt   DateTime      @default(now())
  phone       String?
  website     String?
  // --- ADD THESE 5 LINES ---
  stripeCustomerId     String?
  stripeSubscriptionId String?
  stripePriceId        String?
  subscriptionStatus   String?
  planTier             String?
  // --- END ADD ---
  Invitations Invitations[]
  users       User[]
  checkIns    CheckIn[]
}
```

**Step 2: Run migration locally**

```bash
cd "C:/Users/white/Desktop/AI Projects/00 - Backup versions/JobsiteCheckIn"
npx prisma migrate dev --name add_subscription_fields
```

Expected output: `Your database is now in sync with your schema.`
This creates a file in `prisma/migrations/` — commit it.

**Step 3: Verify the generated client has the new fields**

```bash
npx prisma studio
```

Open Organization in the browser UI — confirm the 5 new columns are visible.
Then close Prisma Studio (Ctrl+C).

**Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add subscription fields to Organization model"
```

---

## Task 2: Apply migration to staging database

**Context:** Vercel does not run `prisma migrate deploy` automatically. You must run it manually pointed at the staging DB.

**Step 1: Get your staging DATABASE_URL**

Go to Vercel → staging project → Settings → Environment Variables → copy `DATABASE_URL`.

**Step 2: Run migration against staging**

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Replace `postgresql://...` with your staging DATABASE_URL value.

Expected output: `1 migration applied.`

**Step 3: Verify in Supabase**

Go to your staging Supabase project → Table Editor → Organization table.
Confirm the 5 new columns appear.

---

## Task 3: Fix the checkout session route

**Files:**
- Modify: `app/api/create-checkout-session/route.ts`

**Context:** Line 64 uses `mode: 'payment'` (one-time charge). This must be `mode: 'subscription'`. The hardcoded amount fallback is also removed since the Pricing Table handles its own prices.

**Step 1: Update the route**

Replace the entire `session` creation block (lines 63–70) with:

```typescript
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: lineItems,
  customer_email: customerEmail,
  metadata,
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
})
```

Note: `cancel_url` updated from `/payments/cancel` to `/pricing` so users land back on the pricing page if they cancel.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/api/create-checkout-session/route.ts
git commit -m "fix: change checkout mode from payment to subscription"
```

---

## Task 4: Rewrite the stripe-webhook handler

**Files:**
- Modify: `app/api/stripe-webhook/route.ts`

**Context:** The current handler only logs `checkout.session.completed`. We need to:
1. On `checkout.session.completed` → find Organization by email, save subscription data
2. On `customer.subscription.updated` → update status and tier
3. On `customer.subscription.deleted` → set to canceled/free

The tier is determined by mapping the incoming `stripePriceId` against the 6 price ID env vars.

**Step 1: Replace the entire file with**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

function getPlanTier(priceId: string): string {
  const map: Record<string, string> = {
    [process.env.STRIPE_PRICE_PRO_MONTHLY!]: 'pro',
    [process.env.STRIPE_PRICE_PRO_ANNUAL!]: 'pro',
    [process.env.STRIPE_PRICE_ELITE_MONTHLY!]: 'elite',
    [process.env.STRIPE_PRICE_ELITE_ANNUAL!]: 'elite',
    [process.env.STRIPE_PRICE_TITAN_MONTHLY!]: 'titan',
    [process.env.STRIPE_PRICE_TITAN_ANNUAL!]: 'titan',
  }
  return map[priceId] ?? 'free'
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'subscription') break

        const email = session.customer_details?.email ?? session.customer_email
        if (!email || !session.subscription) break

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const planTier = getPlanTier(priceId)

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user?.organizationId) {
          console.warn('Webhook: no organization found for email:', email)
          break
        }

        await prisma.organization.update({
          where: { id: user.organizationId },
          data: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            planTier,
          },
        })

        console.info('Webhook: subscription linked', { email, planTier, status: subscription.status })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const planTier = getPlanTier(priceId)

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (!org) {
          console.warn('Webhook: no org for Stripe customer:', subscription.customer)
          break
        }

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            planTier,
          },
        })

        console.info('Webhook: subscription updated', { orgId: org.id, planTier, status: subscription.status })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (!org) {
          console.warn('Webhook: no org for Stripe customer:', subscription.customer)
          break
        }

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: 'canceled',
            planTier: 'free',
          },
        })

        console.info('Webhook: subscription canceled', { orgId: org.id })
        break
      }

      default:
        console.info('Unhandled Stripe event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handling error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 3: Commit**

```bash
git add app/api/stripe-webhook/route.ts
git commit -m "feat: handle subscription events in stripe webhook handler"
```

---

## Task 5: Update the registration page to redirect to /pricing

**Files:**
- Modify: `app/auth/register/page.tsx`

**Context:** Lines 183–208 call `/api/create-checkout-session` and redirect to a Stripe-generated URL. Replace this entire block with a simple router redirect to `/pricing?email=...`.

**Step 1: Remove the constants at lines 49–50**

Delete these two lines:
```typescript
const INDIVIDUAL_PRICE_DOLLARS = 199
const BUSINESS_PRICE_DOLLARS = 299
```

**Step 2: Replace lines 180–209 with**

```typescript
setFeedback({ type: 'success', text: 'Registration complete! Redirecting to pricing...' })
setRegisterForm((prev) => ({ ...initialFormState, registrationType: prev.registrationType }))
router.push(`/pricing?email=${encodeURIComponent(normalizedEmail)}`)
return
```

The `router` variable is already declared at line 53 (`const router = useRouter()`), so no new imports needed.

**Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step 4: Commit**

```bash
git add app/auth/register/page.tsx
git commit -m "feat: redirect to /pricing after registration instead of hardcoded checkout"
```

---

## Task 6: Create the /pricing page

**Files:**
- Create: `app/pricing/page.tsx`
- Create: `app/pricing/StripePricingTable.tsx`
- Modify: `middleware.ts`

### Part A — Create StripePricingTable client component

Create `app/pricing/StripePricingTable.tsx`:

```typescript
'use client'

import Script from 'next/script'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'pricing-table-id'?: string
        'publishable-key'?: string
        'customer-email'?: string
      }
    }
  }
}

export default function StripePricingTable({ email }: { email?: string }) {
  return (
    <>
      <Script
        async
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      <stripe-pricing-table
        pricing-table-id={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}
        publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        customer-email={email}
      />
    </>
  )
}
```

### Part B — Create pricing page server component

Create `app/pricing/page.tsx`:

```typescript
import type { Metadata } from 'next'
import StripePricingTable from './StripePricingTable'

export const metadata: Metadata = {
  title: 'Choose Your Plan | Project Check-In',
}

interface PricingPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams
  const email = params.email ?? ''

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Start free. Upgrade anytime.</p>
        </div>
        <StripePricingTable email={email} />
      </div>
    </div>
  )
}
```

### Part C — Add /pricing to middleware public paths

In `middleware.ts`, find the `publicPaths` array and add `/pricing`:

```typescript
const publicPaths = [
  '/',
  '/auth/signin',
  '/auth/register',
  '/auth/invite',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/payments/checkout',
  '/pricing',            // ADD THIS LINE
]
```

Note: The `publicPaths` array is declared but not actually used in the current middleware logic (the auth check uses `startsWith` conditions below it). So also add `/pricing` to the unauthenticated pass-through condition:

Find this block:
```typescript
if (
  !token &&
  !pathname.startsWith('/jobs/') &&
  !pathname.startsWith('/portfolio/') &&
  !pathname.startsWith('/sitemap') &&
  pathname !== '/robots.txt' &&
  !isPublicAssetPath
) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}
```

Add `pathname !== '/pricing' &&` to the condition:
```typescript
if (
  !token &&
  !pathname.startsWith('/jobs/') &&
  !pathname.startsWith('/portfolio/') &&
  !pathname.startsWith('/sitemap') &&
  pathname !== '/robots.txt' &&
  pathname !== '/pricing' &&
  !isPublicAssetPath
) {
  return NextResponse.redirect(new URL('/auth/signin', req.url))
}
```

**Step after all three parts:**

```bash
npx tsc --noEmit
```

Expected: no errors.

**Step: Commit**

```bash
git add app/pricing/page.tsx app/pricing/StripePricingTable.tsx middleware.ts
git commit -m "feat: add /pricing page with Stripe Pricing Table embed"
```

---

## Task 7: Test locally with Stripe CLI

**Step 1: Open Terminal 1 — start dev server**

```bash
cd "C:/Users/white/Desktop/AI Projects/00 - Backup versions/JobsiteCheckIn"
npm run dev
```

**Step 2: Open Terminal 2 — start Stripe webhook forwarding**

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Copy the `whsec_...` value it prints. Add it to `.env.local`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxx
```

Restart Terminal 1 (`Ctrl+C`, then `npm run dev`) to pick up the new env var.

**Step 3: Test the pricing page**

Navigate to `http://localhost:3000/pricing` — confirm the Stripe Pricing Table loads with the 3 tiers.

**Step 4: Complete a test checkout**

Click a plan in the pricing table. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

**Step 5: Verify webhook fired**

In Terminal 2, you should see:
```
--> checkout.session.completed [evt_...]
<-- [200] POST http://localhost:3000/api/stripe-webhook
--> customer.subscription.created [evt_...]
<-- [200] POST http://localhost:3000/api/stripe-webhook
```

**Step 6: Verify database updated**

```bash
npx prisma studio
```

Open Organization table. Find the org for the email you used. Confirm:
- `stripeCustomerId` is set
- `stripeSubscriptionId` is set
- `planTier` is `pro` / `elite` / `titan` (whichever you clicked)
- `subscriptionStatus` is `active`

---

## Task 8: Deploy to staging and test

**Step 1: Push to staging**

```bash
git push origin <your-staging-branch>
```

**Step 2: Apply migration to staging DB**

Get staging DATABASE_URL from Vercel env vars, then:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Step 3: Verify Vercel staging build succeeds**

Check Vercel dashboard — build should pass.

**Step 4: Test on staging URL**

Navigate to `https://jobsite-checkin-staging-6rg1sr1zo-whitekw92-9686s-projects.vercel.app/pricing`

Complete a test checkout. Check Stripe dashboard → Webhooks → look for the event and confirm it shows `200 OK`.

Check staging DB (Supabase staging project → Organization table) for the updated record.

---

## Task 9: Deploy to production

**Only after staging passes.**

**Step 1: Merge to main / push to production**

```bash
git push origin main
```

**Step 2: Apply migration to production DB**

Get production DATABASE_URL from Vercel env vars, then:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

**Step 3: Verify production webhook**

Go to Stripe Live mode → Webhooks → check recent events after the deploy.

**Step 4: Update CLAUDE.md**

Mark these Phase H items as complete:
- Create Stripe Pricing Table ✅
- Add subscription tracking to database ✅
- Fix checkout API ✅
- Fix registration flow ✅
- Update stripe-webhook handler ✅
