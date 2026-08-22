export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { exchangeCode, listLocations, GBP_STATE_COOKIE } from '@/lib/gbpApi'

// OAuth callback for Google Business Profile. This URL is registered on the
// OAuth client for both staging and production and must not move without
// updating the Google Cloud console to match.
//
// Always ends in a redirect back to Account → Connections: the customer is
// arriving here from Google in their browser, so a JSON error body would be a
// dead end. Outcomes are passed as a `gbp` query param the Account page reads.

const OUTCOMES = {
  connected: 'connected',
  selectLocation: 'select_location',
  noLocations: 'no_locations',
  denied: 'denied',
  failed: 'failed',
} as const

function backToAccount(outcome: string): NextResponse {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
  const res = NextResponse.redirect(`${base}/account?gbp=${outcome}`)
  // One-shot cookie — clear it whatever the outcome so a stale state can never
  // be replayed against a later handshake.
  res.cookies.set(GBP_STATE_COOKIE, '', { path: '/', maxAge: 0 })
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
    const stored = jar.get(GBP_STATE_COOKIE)?.value
    if (!stored) return backToAccount(OUTCOMES.failed)

    const separator = stored.indexOf(':')
    const cookieOrgId = stored.slice(0, separator)
    const cookieState = stored.slice(separator + 1)

    // Constant-time compare — a plain !== on a CSRF token is a (small, but
    // free to avoid) timing oracle.
    if (!cookieState || !safeEqual(cookieState, state)) {
      console.warn('GBP: OAuth state mismatch — rejecting callback')
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
      console.warn('GBP: callback session did not match the org that started the flow')
      return backToAccount(OUTCOMES.failed)
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { id: true, planTier: true },
    })
    if (!org) return backToAccount(OUTCOMES.failed)
    if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gbp_integration')) {
      return backToAccount(OUTCOMES.failed)
    }

    const exchanged = await exchangeCode(code)
    if (!exchanged.ok || !exchanged.data?.refreshToken) {
      return backToAccount(OUTCOMES.failed)
    }
    const { accessToken, refreshToken } = exchanged.data

    // OAuth succeeding says nothing about whether this Google account actually
    // manages a business listing. Someone signing in with a personal Gmail
    // authorizes perfectly and comes back with zero locations — that is the
    // single most common support case, so it gets its own stored status and its
    // own UI state rather than reading as a failure.
    const locations = await listLocations(refreshToken, accessToken)
    if (!locations.ok) {
      return backToAccount(OUTCOMES.failed)
    }
    const found = locations.data ?? []

    // Tokens are stored in every branch, including the empty one: a customer who
    // claims their listing with Google afterwards can re-check from the Account
    // page without going through consent a second time.
    const outcome =
      found.length === 0
        ? OUTCOMES.noLocations
        : found.length === 1
          ? OUTCOMES.connected
          : OUTCOMES.selectLocation

    const single = found.length === 1 ? found[0] : null

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        gbpAccessToken: accessToken,
        gbpRefreshToken: refreshToken,
        gbpAccountId: single?.accountName ?? null,
        gbpLocationId: single?.name ?? null,
        gbpLocationName: single?.title ?? null,
        gbpConnectionStatus: outcome,
        gbpConnectedAt: new Date(),
      },
    })

    return backToAccount(outcome)
  } catch (error) {
    console.error('Error completing Google Business Profile connection:', error)
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
