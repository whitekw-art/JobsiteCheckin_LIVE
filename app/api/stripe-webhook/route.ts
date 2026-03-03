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
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : (session.customer as Stripe.Customer)?.id ?? '',
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
