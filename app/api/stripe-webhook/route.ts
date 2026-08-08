export const runtime = 'nodejs'

import { NextRequest, NextResponse, after } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { CURRENT_PLAN_VERSION, tierHasFeature } from '@/lib/planVersions'
import { revokeOrgWordPress, restoreOrgWordPress } from '@/lib/wordpressSync'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

/**
 * Keep the customer's WordPress site in step with their subscription.
 *
 * Titan is what entitles published jobs to live on the customer's own site
 * (design spec §8). Dropping out of Titan pulls everything down; coming back to
 * Titan restores it. Runs after the webhook response — a bulk restore is paced
 * and would otherwise risk a Stripe delivery timeout.
 */
function syncWordPressEntitlement(orgId: string, wasTitan: boolean, isTitan: boolean): void {
  if (wasTitan === isTitan) return
  after(async () => {
    try {
      if (isTitan) {
        const { restored } = await restoreOrgWordPress(orgId)
        if (restored) console.info('Webhook: restored WordPress posts on Titan resubscribe', { orgId, restored })
      } else {
        const { removed } = await revokeOrgWordPress(orgId)
        if (removed) console.info('Webhook: revoked WordPress posts on loss of Titan', { orgId, removed })
      }
    } catch (err) {
      console.error('WordPress entitlement sync failed:', err)
    }
  })
}

function getPlanTier(priceId: string): string {
  const entries: [string | undefined, string][] = [
    [process.env.STRIPE_PRICE_PRO_MONTHLY, 'pro'],
    [process.env.STRIPE_PRICE_PRO_ANNUAL, 'pro'],
    [process.env.STRIPE_PRICE_ELITE_MONTHLY, 'elite'],
    [process.env.STRIPE_PRICE_ELITE_ANNUAL, 'elite'],
    [process.env.STRIPE_PRICE_TITAN_MONTHLY, 'titan'],
    [process.env.STRIPE_PRICE_TITAN_ANNUAL, 'titan'],
  ]
  const map = Object.fromEntries(
    entries.filter((e): e is [string, string] => typeof e[0] === 'string')
  )
  return map[priceId] ?? 'free'
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })
  }

  const rawBody = Buffer.from(await request.arrayBuffer()).toString('utf-8')
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    console.error('Stripe webhook signature verification failed:', error.message)
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
        if (!user?.organizationId) break

        const priorOrg = await prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: { planTier: true },
        })

        await prisma.organization.update({
          where: { id: user.organizationId },
          data: {
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer)?.id ?? '',
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            planTier,
            planVersion: CURRENT_PLAN_VERSION,
          },
        })

        // Resubscribe path: a returning Titan customer gets everything that was
        // revoked put back automatically.
        syncWordPressEntitlement(
          user.organizationId,
          tierHasFeature(priorOrg?.planTier, 'website_integration'),
          tierHasFeature(planTier, 'website_integration')
        )

        console.info('Webhook: organization updated', { orgId: user.organizationId, planTier, status: subscription.status })
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const planTier = getPlanTier(priceId)

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (!org) break

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            planTier,
          },
        })

        // Upgrade to Titan restores; downgrade away from Titan revokes. A
        // subscription that is no longer in good standing counts as not-Titan.
        const inGoodStanding = ['active', 'trialing'].includes(subscription.status)
        syncWordPressEntitlement(
          org.id,
          tierHasFeature(org.planTier, 'website_integration'),
          inGoodStanding && tierHasFeature(planTier, 'website_integration')
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        const org = await prisma.organization.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        })

        if (!org) break

        await prisma.organization.update({
          where: { id: org.id },
          data: {
            subscriptionStatus: 'canceled',
            planTier: 'free',
          },
        })

        // Cancellation: pull all published job content off the customer's own
        // WordPress site immediately. Nothing is deleted on our side — every
        // job stays marked 'revoked' and comes back if they return to Titan.
        syncWordPressEntitlement(
          org.id,
          tierHasFeature(org.planTier, 'website_integration'),
          false
        )

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
