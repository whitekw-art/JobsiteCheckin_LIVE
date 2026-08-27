export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { postCheckInToGbp, retractCheckInFromGbp } from '@/lib/gbpSync'

// Publish (POST) or remove (DELETE) one job on the customer's Google Business
// Profile. Design: docs/plans/2026-08-21-gbp-auto-posting-design.md
//
// POST requires `gbp_integration` (Elite + Titan). CORRECTED 2026-08-22: this
// was originally gated on `gbp_post` (every paid plan), on the assumption that
// manual posting was a Pro-tier feature and only automation was Elite/Titan.
// Keith clarified the real scope: Pro keeps only the pre-existing
// copy-and-paste GBP modal (still gated by `gbp_post`, on the dashboard job
// card, untouched by this route) — the one-click button this route serves is
// Elite + Titan only, same as automatic posting.
//
// DELETE is deliberately NOT tier-gated: a customer who downgrades still owns
// whatever they already posted and must be able to remove it. Gating cleanup
// behind a plan they no longer have would strand them.
//
// The work itself lives in lib/gbpSync.ts so the Phase 2 auto-post hook and
// the unpublish auto-retract hook can call exactly the same code paths
// rather than reimplementing them.

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
    // No SUPER_ADMIN exemption, corrected 2026-08-22 — see the full reasoning
    // in app/api/organization/gbp/route.ts.
    if (!tierHasFeature(org.planTier, 'gbp_integration')) {
      return NextResponse.json({ error: 'This feature requires the Elite or Titan plan' }, { status: 403 })
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

export async function DELETE(request: NextRequest) {
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

    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true },
    })
    if (!checkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = await retractCheckInFromGbp(checkIn.id)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error removing job from Google Business Profile:', error)
    return NextResponse.json({ error: 'Failed to remove this job from Google' }, { status: 500 })
  }
}
