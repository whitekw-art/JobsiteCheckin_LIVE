export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { exchangeCode, listProperties, GSC_STATE_COOKIE } from '@/lib/gscApi'

// OAuth callback for Google Search Console. This URL is registered on the
// OAuth client for both staging and production and must not move without
// updating the Google Cloud console to match.
//
// Always ends in a redirect back to Account → Connections: the customer is
// arriving here from Google in their browser, so a JSON error body would be a
// dead end. Outcomes are passed as a `gsc` query param the Account page reads.

const OUTCOMES = {
  connected: 'connected',
  selectProperty: 'select_property',
  noProperties: 'no_properties',
  denied: 'denied',
  failed: 'failed',
} as const

function backToAccount(outcome: string): NextResponse {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
  const res = NextResponse.redirect(`${base}/account?gsc=${outcome}`)
  // One-shot cookie — clear it whatever the outcome so a stale state can never
  // be replayed against a later handshake.
  res.cookies.set(GSC_STATE_COOKIE, '', { path: '/', maxAge: 0 })
  return res
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams

    // The customer pressed Cancel on Google's consent screen. Not an error.
    if (params.get('error')) {
      return backToAccount(OUTCOMES.denied)
    }

    const code = params.get('code')
    const state = params.get('state')
    if (!code || !state) return backToAccount(OUTCOMES.failed)

    const jar = await cookies()
    const stored = jar.get(GSC_STATE_COOKIE)?.value
    if (!stored) return backToAccount(OUTCOMES.failed)

    const separator = stored.indexOf(':')
    const cookieOrgId = stored.slice(0, separator)
    const cookieState = stored.slice(separator + 1)

    // Constant-time compare — a plain !== on a CSRF token is a (small, but
    // free to avoid) timing oracle.
    if (!cookieState || !safeEqual(cookieState, state)) {
      console.warn('GSC: OAuth state mismatch — rejecting callback')
      return backToAccount(OUTCOMES.failed)
    }

    // Re-check the session rather than trusting the cookie alone: the state
    // proves the flow started here, not that whoever came back is still a
    // signed-in owner of that organization.
    const currentUser = await getCurrentUser()
    if (
      !currentUser ||
      !currentUser.organizationId ||
      currentUser.organizationId !== cookieOrgId ||
      !['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)
    ) {
      console.warn('GSC: callback session did not match the org that started the flow')
      return backToAccount(OUTCOMES.failed)
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { id: true, planTier: true },
    })
    if (!org) return backToAccount(OUTCOMES.failed)
    if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gsc_integration')) {
      return backToAccount(OUTCOMES.failed)
    }

    const exchanged = await exchangeCode(code)
    if (!exchanged.ok || !exchanged.data?.refreshToken) {
      return backToAccount(OUTCOMES.failed)
    }
    const { accessToken, refreshToken } = exchanged.data

    // OAuth succeeding says nothing about whether this customer has ever
    // verified a site in Search Console — that is a separate step on Google's
    // side, and an account with none is the common case for a small business.
    const properties = await listProperties(refreshToken, accessToken)
    if (!properties.ok) {
      return backToAccount(OUTCOMES.failed)
    }
    const found = properties.data ?? []

    // Tokens are stored in every branch, including the empty one: the customer
    // can verify a property with Google and then re-check from the Account page
    // without going through consent a second time.
    const outcome =
      found.length === 0
        ? OUTCOMES.noProperties
        : found.length === 1
          ? OUTCOMES.connected
          : OUTCOMES.selectProperty

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        gscAccessToken: accessToken,
        gscRefreshToken: refreshToken,
        gscPropertyUrl: found.length === 1 ? found[0] : null,
        gscConnectionStatus: outcome,
        gscConnectedAt: new Date(),
      },
    })

    return backToAccount(outcome)
  } catch (error) {
    console.error('Error completing Search Console connection:', error)
    return backToAccount(OUTCOMES.failed)
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}
