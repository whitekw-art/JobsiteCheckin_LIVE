export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import {
  gbpConfigured,
  buildConsentUrl,
  listLocations,
  revokeAccess,
  GBP_STATE_COOKIE,
} from '@/lib/gbpApi'

// Google Business Profile connection management.
// Design: docs/plans/2026-08-21-gbp-auto-posting-design.md
//
// Shape mirrors the Search Console route (app/api/organization/gsc/route.ts):
// GET status, POST to start, PATCH to pick a location, DELETE to disconnect.
//
// Gating note, CORRECTED 2026-08-22: the real integration this route manages
// — connecting a Google Business Profile at all, the one-click button, and
// automatic posting — is `gbp_integration`, Elite + Titan only. `gbp_post` is
// a separate, older key (every paid plan) that gates nothing here; it only
// covers the pre-existing copy-and-paste GBP modal on the dashboard job card,
// which Pro keeps unchanged. A Pro org never reaches this route successfully.
//
// NO SUPER_ADMIN BYPASS on the tier check, corrected 2026-08-22. An earlier
// version exempted SUPER_ADMIN so support could manage an org's connection
// regardless of tier — but the check reads the ORG's planTier, not the
// signed-in admin's, so that exemption only ever mattered for an org below
// Elite/Titan, and there is nothing to "manage" for an org that was never
// entitled to a connection in the first place. It also broke Keith's actual
// use of the admin panel's tier switcher: testing as SUPER_ADMIN always saw
// the unlocked card no matter what tier the org was set to. Every other
// tier-gated feature in the app (see app/dashboard/page.tsx's ai_job_
// description and review_request checks) has never had this exemption.
//
// The OAuth handshake itself finishes in ./callback/route.ts.

async function requireOwnerWithFeature() {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.organizationId) {
    return { error: NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 }) }
  }
  if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
    return { error: NextResponse.json({ error: 'Only owners can manage the Google Business Profile connection' }, { status: 403 }) }
  }
  const org = await prisma.organization.findUnique({
    where: { id: currentUser.organizationId },
    select: {
      id: true,
      planTier: true,
      gbpAccessToken: true,
      gbpRefreshToken: true,
      gbpAccountId: true,
      gbpLocationId: true,
      gbpLocationName: true,
      gbpConnectionStatus: true,
      gbpConnectedAt: true,
      gbpAutoPost: true,
    },
  })
  if (!org) {
    return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) }
  }
  if (!tierHasFeature(org.planTier, 'gbp_integration')) {
    return { error: NextResponse.json({ error: 'This feature requires the Elite or Titan plan' }, { status: 403 }) }
  }
  return { org }
}

// GET — connection status for the Account → Connections card. Never returns
// tokens, only whether one exists and which location it points at.
export async function GET() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    return NextResponse.json({
      connected: Boolean(org.gbpRefreshToken) && org.gbpConnectionStatus === 'connected',
      status: org.gbpConnectionStatus,
      locationId: org.gbpLocationId,
      locationName: org.gbpLocationName,
      connectedAt: org.gbpConnectedAt,
      // Reaching this route at all already requires gbp_integration, so
      // automation is never a further upsell from here — unlike the earlier
      // design, there is no partial tier that can connect but not automate.
      autoPost: org.gbpAutoPost,
    })
  } catch (error) {
    console.error('Error loading Google Business Profile connection:', error)
    return NextResponse.json({ error: 'Failed to load Google Business Profile connection' }, { status: 500 })
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

    if (!gbpConfigured()) {
      console.error('GBP: missing GOOGLE_OAUTH_CLIENT_ID/SECRET or encryption key — refusing to start OAuth')
      return NextResponse.json(
        { error: 'Google Business Profile connections are temporarily unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    // CSRF: a random state echoed back by Google and matched against an
    // httpOnly cookie. Without this, a third party could feed the customer a
    // callback URL carrying THEIR authorization code and quietly attach their
    // Business Profile to this organization.
    const state = crypto.randomBytes(32).toString('hex')
    const jar = await cookies()
    jar.set(GBP_STATE_COOKIE, `${org.id}:${state}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // must survive the top-level redirect back from Google
      path: '/',
      maxAge: 600, // 10 minutes is ample for a consent screen
    })

    return NextResponse.json({ consentUrl: buildConsentUrl(state) })
  } catch (error) {
    console.error('Error starting Google Business Profile connection:', error)
    return NextResponse.json({ error: 'Failed to start the Google Business Profile connection' }, { status: 500 })
  }
}

// PATCH — two independent settings, either or both may be present:
//   { locationId } — choose which listing to post to (multi-location accounts)
//   { autoPost }   — switch automatic posting on/off
// Both require gbp_integration, already enforced by requireOwnerWithFeature —
// there is no partial tier that reaches this route without also being allowed
// to flip automation, so no separate check is needed here.
export async function PATCH(request: NextRequest) {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (!org.gbpRefreshToken) {
      return NextResponse.json({ error: 'Connect your Google Business Profile first' }, { status: 400 })
    }

    const body = (await request.json()) as { locationId?: string; autoPost?: boolean }
    const data: { gbpAccountId?: string; gbpLocationId?: string; gbpLocationName?: string; gbpConnectionStatus?: string; gbpAutoPost?: boolean } = {}

    if (typeof body.autoPost === 'boolean') {
      data.gbpAutoPost = body.autoPost
    }

    if (body.locationId !== undefined) {
      const locationId = (body.locationId || '').trim()
      if (!locationId) {
        return NextResponse.json({ error: 'Choose a business location to continue' }, { status: 400 })
      }

      // Re-read the live list rather than trusting the posted value: it decides
      // whose Google listing this organization can publish to from here on.
      const locations = await listLocations(org.gbpRefreshToken, org.gbpAccessToken)
      if (!locations.ok) {
        return NextResponse.json(
          { error: locations.error, needsReconnect: locations.needsReconnect },
          { status: locations.needsReconnect ? 409 : 502 }
        )
      }
      const match = locations.data?.find((l) => l.name === locationId)
      if (!match) {
        return NextResponse.json({ error: 'That business is not available on your Google account' }, { status: 400 })
      }

      data.gbpAccountId = match.accountName
      data.gbpLocationId = match.name
      data.gbpLocationName = match.title
      data.gbpConnectionStatus = 'connected'
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data,
      select: { gbpLocationId: true, gbpLocationName: true, gbpAutoPost: true, gbpConnectionStatus: true },
    })

    return NextResponse.json({ ok: true, ...updated })
  } catch (error) {
    console.error('Error updating Google Business Profile connection:', error)
    return NextResponse.json({ error: 'Failed to save your changes' }, { status: 500 })
  }
}

// DELETE — disconnect. Clears our copy unconditionally; revoking on Google's
// side is attempted first but never allowed to block the disconnect.
//
// Posts already published are deliberately left on the customer's listing.
// They are the customer's own content on the customer's own profile — pulling
// them down would be hostile, and unlike the WordPress integration there is no
// artifact of ours sitting on their property that needs cleaning up.
export async function DELETE() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (org.gbpRefreshToken) {
      await revokeAccess(org.gbpRefreshToken)
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        gbpAccessToken: null,
        gbpRefreshToken: null,
        gbpAccountId: null,
        gbpLocationId: null,
        gbpLocationName: null,
        gbpConnectionStatus: null,
        gbpConnectedAt: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error disconnecting Google Business Profile:', error)
    return NextResponse.json({ error: 'Failed to disconnect Google Business Profile' }, { status: 500 })
  }
}
