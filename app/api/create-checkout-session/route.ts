import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const DEFAULT_AMOUNT_DOLLARS = Number(process.env.STRIPE_REGISTRATION_AMOUNT || '199')
const DEFAULT_CURRENCY = process.env.STRIPE_REGISTRATION_CURRENCY || 'usd'
const DEFAULT_PRODUCT_NAME =
  process.env.STRIPE_REGISTRATION_PRODUCT_NAME || 'Jobsite Check-In Registration'

export async function POST(request: NextRequest) {
  try {
    const {
      priceId,
      amount,
      currency,
      productName,
      customerEmail,
      metadata,
    }: {
      priceId?: string
      amount?: number
      currency?: string
      productName?: string
      customerEmail?: string
      metadata?: Record<string, string>
    } = await request.json()

    if (!customerEmail) {
      return NextResponse.json({ error: 'Missing customer email' }, { status: 400 })
    }

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]

    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }]
    } else {
      const resolvedAmountDollars = amount ?? DEFAULT_AMOUNT_DOLLARS

      if (!resolvedAmountDollars || resolvedAmountDollars <= 0) {
        return NextResponse.json(
          { error: 'Invalid registration amount. Please provide a valid priceId or amount.' },
          { status: 400 }
        )
      }

      lineItems = [
        {
          price_data: {
            currency: (currency || DEFAULT_CURRENCY).toLowerCase(),
            product_data: {
              name: productName || DEFAULT_PRODUCT_NAME,
            },
            unit_amount: Math.round(resolvedAmountDollars * 100),
          },
          quantity: 1,
        },
      ]
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: customerEmail,
      metadata,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
    })

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL')
    }

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe session error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
