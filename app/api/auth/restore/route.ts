export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-11-17.clover',
})

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json({ error: 'missing session_id' }, { status: 400 })
  }

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'invalid session_id' }, { status: 400 })
  }

  if (checkoutSession.status !== 'complete') {
    return NextResponse.json({ error: 'payment not complete' }, { status: 400 })
  }

  // Reject sessions older than 30 minutes to limit replay window
  const ageSeconds = Math.floor(Date.now() / 1000) - checkoutSession.created
  if (ageSeconds > 1800) {
    return NextResponse.json({ error: 'session expired' }, { status: 400 })
  }

  const email = checkoutSession.customer_details?.email ?? checkoutSession.customer_email
  if (!email) {
    return NextResponse.json({ error: 'no email on session' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: { organization: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 })
  }

  const token = await encode({
    token: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      companyName: user.organization?.name ?? undefined,
      orgSlug: user.organization?.slug ?? undefined,
      onboardingComplete: user.organization?.onboardingComplete ?? true,
      planTier: user.organization?.planTier ?? undefined,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 30 * 24 * 60 * 60,
  })

  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  const response = NextResponse.json({ ok: true })
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
  })

  return response
}
