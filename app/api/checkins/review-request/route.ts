import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { ensureReviewLinkCode, recordReviewEvent, reviewTrackingUrl } from '@/lib/reviewTracking'

// The Request a Google Review window on the Job Dashboard (Titan only).
//   action 'link'          returns the job's tracking link for the message
//   action 'text' | 'email' records one click on Send via Text or Send via Email
// Copy Text is never recorded: copying is not a send.
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await request.json().catch(() => ({}))) as { id?: string; action?: string }
    const id = (body.id || '').trim()
    const action = body.action
    if (!id || !['link', 'text', 'email'].includes(action || '')) {
      return NextResponse.json({ error: 'id and a valid action are required' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { planTier: true },
    })
    if (!org || !tierHasFeature(org.planTier, 'review_request')) {
      return NextResponse.json({ error: 'This feature requires the Titan plan' }, { status: 403 })
    }

    // Scoped to the caller's organization: an id alone never reaches another
    // customer's job.
    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true },
    })
    if (!checkIn) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (action === 'link') {
      const code = await ensureReviewLinkCode(checkIn.id)
      return NextResponse.json({ url: reviewTrackingUrl(code) })
    }

    await recordReviewEvent({
      organizationId: currentUser.organizationId,
      checkInId: checkIn.id,
      kind: action as 'text' | 'email',
      userId: currentUser.id,
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Review request route failed:', error)
    return NextResponse.json({ error: 'Could not record the review request' }, { status: 500 })
  }
}
