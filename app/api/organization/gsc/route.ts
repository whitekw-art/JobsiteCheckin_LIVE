export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import {
  gscConfigured,
  buildConsentUrl,
  listProperties,
  revokeAccess,
  GSC_STATE_COOKIE,
} from '@/lib/gscApi'

// Google Search Console connection management (Elite + Titan).
// Design: docs/plans/2026-07-31-gsc-integration-design.md
//
// Shape mirrors the WordPress connection route
// (app/api/organization/wordpress/route.ts): GET status, POST to start, DELETE
// to disconnect. PATCH is extra here — it selects which property to report on
// when a customer's Google account has more than one verified site.
//
// The OAuth handshake itself finishes in ./callback/route.ts.

async function requireOwnerWithFeature() {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.organizationId) {
    return { error: NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 }) }
  }
  if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
    return { error: NextResponse.json({ error: 'Only owners can manage the Search Console connection' }, { status: 403 }) }
  }
  const org = await prisma.organization.findUnique({
    where: { id: currentUser.organizationId },
    select: {
      id: true,
      planTier: true,
      gscAccessToken: true,
      gscRefreshToken: true,
      gscPropertyUrl: true,
      gscConnectionStatus: true,
      gscConnectedAt: true,
      // Needed by DELETE only: GSC and GBP share one OAuth grant, so
      // disconnecting one must not revoke the other. See the comment there.
      gbpRefreshToken: true,
    },
  })
  if (!org) {
    return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) }
  }
  if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gsc_integration')) {
    return { error: NextResponse.json({ error: 'This feature requires the Elite or Titan plan' }, { status: 403 }) }
  }
  return { org }
}

// GET — connection status for the Account → Connections card. Never returns
// tokens, only whether one exists and which property it points at.
export async function GET() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    return NextResponse.json({
      connected: Boolean(org.gscRefreshToken) && org.gscConnectionStatus === 'connected',
      status: org.gscConnectionStatus,
      propertyUrl: org.gscPropertyUrl,
      connectedAt: org.gscConnectedAt,
    })
  } catch (error) {
    console.error('Error loading Search Console connection:', error)
    return NextResponse.json({ error: 'Failed to load Search Console connection' }, { status: 500 })
  }
}

// POST — begin the OAuth handshake. Returns the Google consent URL for the
// client to navigate to; no redirect is issued here so the caller can surface
// a configuration error inline instead of bouncing the customer to Google.
export async function POST() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (!gscConfigured()) {
      console.error('GSC: missing GOOGLE_OAUTH_CLIENT_ID/SECRET or encryption key — refusing to start OAuth')
      return NextResponse.json(
        { error: 'Search Console connections are temporarily unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    // CSRF: a random state echoed back by Google and matched against an
    // httpOnly cookie. Without this, a third party could feed the customer a
    // callback URL carrying THEIR authorization code and quietly attach their
    // Search Console account to this organization.
    const state = crypto.randomBytes(32).toString('hex')
    const jar = await cookies()
    jar.set(GSC_STATE_COOKIE, `${org.id}:${state}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // must survive the top-level redirect back from Google
      path: '/',
      maxAge: 600, // 10 minutes is ample for a consent screen
    })

    return NextResponse.json({ consentUrl: buildConsentUrl(state) })
  } catch (error) {
    console.error('Error starting Search Console connection:', error)
    return NextResponse.json({ error: 'Failed to start the Search Console connection' }, { status: 500 })
  }
}

// PATCH { propertyUrl } — choose which verified property to report on. Only
// reachable when the customer has more than one; a single property is selected
// automatically during the callback.
export async function PATCH(request: NextRequest) {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (!org.gscRefreshToken) {
      return NextResponse.json({ error: 'Connect Google Search Console first' }, { status: 400 })
    }

    const body = (await request.json()) as { propertyUrl?: string }
    const propertyUrl = (body.propertyUrl || '').trim()
    if (!propertyUrl) {
      return NextResponse.json({ error: 'Choose a website to continue' }, { status: 400 })
    }

    // Re-read the live list rather than trusting the posted value: it decides
    // whose search data this organization can see from here on.
    const properties = await listProperties(org.gscRefreshToken, org.gscAccessToken)
    if (!properties.ok) {
      return NextResponse.json(
        { error: properties.error, needsReconnect: properties.needsReconnect },
        { status: properties.needsReconnect ? 409 : 502 }
      )
    }
    if (!properties.data?.includes(propertyUrl)) {
      return NextResponse.json({ error: 'That website is not available on your Google account' }, { status: 400 })
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: { gscPropertyUrl: propertyUrl, gscConnectionStatus: 'connected' },
    })

    return NextResponse.json({ ok: true, propertyUrl })
  } catch (error) {
    console.error('Error selecting Search Console property:', error)
    return NextResponse.json({ error: 'Failed to save your website selection' }, { status: 500 })
  }
}

// DELETE — disconnect. Clears our copy unconditionally; revoking on Google's
// side is attempted first but never allowed to block the disconnect.
export async function DELETE() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    // GSC and GBP authorize through the SAME OAuth client, and both consent
    // URLs set `include_granted_scopes: true`, which merges their scopes into
    // one combined authorization on the customer's Google account. Google's
    // docs are explicit that revoking a token representing a combined
    // authorization revokes every scope in it at once - so revoking here while
    // GBP is still connected silently kills GBP's access, with our own GBP row
    // left reading "connected". That is a real bug this guard exists to
    // prevent; it was hit on staging 2026-08-26.
    //
    // So: revoke on Google's side only when nothing else is still using the
    // grant. When GBP still holds a token we clear our own credentials and
    // leave Google's authorization intact for it. The customer can always
    // revoke the whole app from their own Google Account permissions page.
    const gbpStillConnected = Boolean(org.gbpRefreshToken)
    if (org.gscRefreshToken && !gbpStillConnected) {
      await revokeAccess(org.gscRefreshToken)
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        gscAccessToken: null,
        gscRefreshToken: null,
        gscPropertyUrl: null,
        gscConnectionStatus: null,
        gscConnectedAt: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error disconnecting Search Console:', error)
    return NextResponse.json({ error: 'Failed to disconnect Search Console' }, { status: 500 })
  }
}
