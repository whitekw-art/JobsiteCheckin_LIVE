export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

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

  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    // Diagnostics — do NOT log full secret, only metadata
    console.error('[webhook-diag] signature verification failed')
    console.error('[webhook-diag] rawBody length:', rawBody.length)
    console.error('[webhook-diag] rawBody has CRLF:', rawBody.includes('\r\n'))
    console.error('[webhook-diag] webhookSecret length:', webhookSecret.length)
    console.error('[webhook-diag] webhookSecret has leading space:', webhookSecret[0] === ' ')
    console.error('[webhook-diag] webhookSecret has trailing space:', webhookSecret[webhookSecret.length - 1] === ' ')
    console.error('[webhook-diag] stripe-signature header present:', !!signature)
    console.error('[webhook-diag] error message:', error.message)
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.info('[webhook] checkout.session.completed', { sessionId: session.id, mode: session.mode })

        if (session.mode !== 'subscription') {
          console.info('[webhook] skipping: not subscription mode')
          break
        }

        const email = session.customer_details?.email ?? session.customer_email
        console.info('[webhook] customer email resolved', { hasEmail: !!email, hasSubscription: !!session.subscription })
        if (!email || !session.subscription) {
          console.warn('[webhook] missing email or subscription id — cannot link org')
          break
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id ?? ''
        const planTier = getPlanTier(priceId)
        console.info('[webhook] subscription retrieved', { subscriptionId: subscription.id, priceId, planTier, status: subscription.status })

        const user = await prisma.user.findUnique({ where: { email } })
        console.info('[webhook] user lookup', { found: !!user, hasOrgId: !!user?.organizationId })
        if (!user?.organizationId) {
          console.warn('[webhook] no org found for email — org may not have been created at registration')
          break
        }

        await prisma.organization.update({
          where: { id: user.organizationId },
          data: {
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer)?.id ?? '',
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: subscription.status,
            planTier,
          },
        })

        console.info('[webhook] organization updated successfully', { orgId: user.organizationId, planTier, status: subscription.status })
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
