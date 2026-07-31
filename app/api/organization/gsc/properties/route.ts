export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { listProperties } from '@/lib/gscApi'

// The customer's verified Search Console properties, for the "choose a website"
// picker. Split out from ../route.ts so the Account page's status check stays a
// cheap DB read — this one always costs a live call to Google.

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 })
    }
    if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Only owners can manage the Search Console connection' }, { status: 403 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { planTier: true, gscAccessToken: true, gscRefreshToken: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gsc_integration')) {
      return NextResponse.json({ error: 'This feature requires the Elite or Titan plan' }, { status: 403 })
    }
    if (!org.gscRefreshToken) {
      return NextResponse.json({ error: 'Connect Google Search Console first' }, { status: 400 })
    }

    const result = await listProperties(org.gscRefreshToken, org.gscAccessToken)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, needsReconnect: result.needsReconnect },
        { status: result.needsReconnect ? 409 : 502 }
      )
    }

    return NextResponse.json({ properties: result.data ?? [] })
  } catch (error) {
    console.error('Error listing Search Console properties:', error)
    return NextResponse.json({ error: 'Failed to load your Search Console websites' }, { status: 500 })
  }
}
