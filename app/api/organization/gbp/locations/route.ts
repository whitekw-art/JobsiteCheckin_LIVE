export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { listLocations } from '@/lib/gbpApi'

// The customer's Google business locations, for the "choose a location" picker
// and for re-checking after they claim a listing with Google. Split out from
// ../route.ts so the Account page's status check stays a cheap DB read — this
// one always costs a live call to Google.

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 })
    }
    if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Only owners can manage the Google Business Profile connection' }, { status: 403 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { id: true, planTier: true, gbpAccessToken: true, gbpRefreshToken: true, gbpConnectionStatus: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gbp_post')) {
      return NextResponse.json({ error: 'This feature requires a paid plan' }, { status: 403 })
    }
    if (!org.gbpRefreshToken) {
      return NextResponse.json({ error: 'Connect your Google Business Profile first' }, { status: 400 })
    }

    const result = await listLocations(org.gbpRefreshToken, org.gbpAccessToken)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, needsReconnect: result.needsReconnect },
        { status: result.needsReconnect ? 409 : 502 }
      )
    }

    const locations = result.data ?? []

    // Doubles as the "check again" path for a customer who was stored as
    // no_locations and has since claimed their listing with Google. Promoting
    // the status here means they never have to re-consent to get unstuck.
    if (org.gbpConnectionStatus === 'no_locations' && locations.length > 0) {
      const single = locations.length === 1 ? locations[0] : null
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          gbpAccountId: single?.accountName ?? null,
          gbpLocationId: single?.name ?? null,
          gbpLocationName: single?.title ?? null,
          gbpConnectionStatus: single ? 'connected' : 'select_location',
        },
      })
    }

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error listing Google business locations:', error)
    return NextResponse.json({ error: 'Failed to load your Google business listings' }, { status: 500 })
  }
}
