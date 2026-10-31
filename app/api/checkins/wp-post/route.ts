export const runtime = 'nodejs'
// A post uploads every photo on the job to the customer's Media Library, which
// can take several seconds per photo on a slow host.
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { syncCheckIn } from '@/lib/wordpressSync'
import { wpConnectionActive, wpJobDisplayState } from '@/lib/wpStatus'

// Repost one job that did not reach the customer's WordPress site (the Post to
// WordPress button on the Job Dashboard). Mirrors app/api/checkins/gbp-post.
//
// Only for a published job that is currently shown as failed, on Titan, with a
// working connection. When the connection is waiting to be reconnected the
// button is not shown, and this route answers 409 so a stale page cannot post
// with a dead password. The same-job claim inside syncCheckIn stops a double
// click or a concurrent background sync from creating a second post.
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
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { planTier: true, wpConnectionStatus: true },
    })
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    if (!tierHasFeature(org.planTier, 'website_integration')) {
      return NextResponse.json({ error: 'This feature requires the Titan plan' }, { status: 403 })
    }
    if (org.wpConnectionStatus === 'needs_reconnect') {
      return NextResponse.json(
        { error: 'Reconnect WordPress before posting this job.', needsReconnect: true },
        { status: 409 }
      )
    }
    if (!wpConnectionActive(org.wpConnectionStatus)) {
      return NextResponse.json({ error: 'Connect your WordPress site first.' }, { status: 400 })
    }

    // Scoped to the caller's own organization: the id alone must never be
    // enough to post another customer's job.
    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true, isPublic: true, wpSyncStatus: true, wpSyncedAt: true },
    })
    if (!checkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (wpJobDisplayState(checkIn) !== 'failed') {
      return NextResponse.json({ error: 'This job does not need to be posted again.' }, { status: 400 })
    }

    const result = await syncCheckIn(checkIn.id)
    if (result.busy) {
      return NextResponse.json({ error: result.error, busy: true }, { status: 409 })
    }
    if (!result.ok) {
      // Read the connection back: a rejected login during this attempt has
      // just switched it to 'needs_reconnect', and the page must show that.
      const after = await prisma.organization.findUnique({
        where: { id: currentUser.organizationId },
        select: { wpConnectionStatus: true },
      })
      return NextResponse.json(
        {
          error: result.error || 'This job did not post to WordPress.',
          wpConnectionStatus: after?.wpConnectionStatus ?? null,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error posting job to WordPress:', error)
    return NextResponse.json({ error: 'This job did not post to WordPress.' }, { status: 500 })
  }
}
