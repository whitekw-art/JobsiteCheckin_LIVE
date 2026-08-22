export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { postCheckInToGbp } from '@/lib/gbpSync'

// Publish one completed job to the customer's Google Business Profile.
// Design: docs/plans/2026-08-21-gbp-auto-posting-design.md
//
// Available on every paid plan (`gbp_post`). The Elite/Titan `gbp_auto_post`
// key only governs whether this happens automatically on publish — it is not
// checked here, because posting a job by hand is the Pro-tier feature.
//
// The work itself lives in lib/gbpSync.ts so the Phase 2 auto-post hook can
// call exactly the same code path rather than reimplementing it.

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json()) as { id?: string }
    const id = (body.id || '').trim()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { planTier: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'gbp_post')) {
      return NextResponse.json({ error: 'This feature requires a paid plan' }, { status: 403 })
    }

    // Scoped to the caller's own organization — the id alone must never be
    // enough to publish another customer's job onto their own listing.
    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true, isPublic: true },
    })
    if (!checkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!checkIn.isPublic) {
      return NextResponse.json({ error: 'Publish this job before posting it to Google' }, { status: 400 })
    }

    const result = await postCheckInToGbp(checkIn.id)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, needsReconnect: result.needsReconnect },
        { status: result.needsReconnect ? 409 : 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      gbpPostUrl: result.data?.searchUrl ?? null,
      gbpPostedAt: result.data?.postedAt ?? null,
    })
  } catch (error) {
    console.error('Error posting job to Google Business Profile:', error)
    return NextResponse.json({ error: 'Failed to post this job to Google' }, { status: 500 })
  }
}
