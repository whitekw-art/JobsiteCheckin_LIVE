import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { googleReviewsListUrl, reviewContentCurrent } from '@/lib/googleReviews'
import { suggestJobs, type MatchJob } from '@/lib/reviewMatching'
import { resyncJobsAfterReviewChange } from '@/lib/reviewResync'

// Review tracking for the Job Dashboard (Titan only; Owner and Admin).
//   GET   request counts per job, linked reviews, suggestions, unmatched and
//         hidden reviews, and when Google was last checked
//   POST  { action, reviewId, checkInId? } with action one of:
//         link (confirm a suggestion, or link from the unmatched panel),
//         dismiss (Not this job), unlink, hide (Not from a job), restore

type Gate =
  | { ok: true; orgId: string; userId: string }
  | { ok: false; res: NextResponse }

async function gate(): Promise<Gate> {
  const user = await getCurrentUser()
  if (!user || !user.organizationId) return { ok: false, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return { ok: false, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  const org = await prisma.organization.findUnique({ where: { id: user.organizationId }, select: { planTier: true } })
  if (!org || !tierHasFeature(org.planTier, 'review_request')) {
    return { ok: false, res: NextResponse.json({ error: 'This feature requires the Titan plan' }, { status: 403 }) }
  }
  return { ok: true, orgId: user.organizationId, userId: user.id }
}

type StoredReview = {
  id: string
  checkInId: string | null
  state: string
  reviewerName: string | null
  starRating: number | null
  comment: string | null
  replyComment: string | null
  postedAt: Date | null
  confirmedWithGoogleAt: Date | null
  dismissedCheckInIds: string[]
}

/** Review as the dashboard sees it; content is withheld once it is past the 30-day limit. */
function present(r: StoredReview) {
  const current = reviewContentCurrent(r.confirmedWithGoogleAt)
  return {
    id: r.id,
    checkInId: r.checkInId,
    state: r.state,
    expired: !current,
    reviewerName: current ? r.reviewerName : null,
    starRating: current ? r.starRating : null,
    comment: current ? r.comment : null,
    hasReply: current ? !!r.replyComment : null,
    postedAt: r.postedAt?.toISOString() ?? null,
  }
}

export async function GET() {
  try {
    const g = await gate()
    if (!g.ok) return g.res

    const [org, events, reviews] = await Promise.all([
      prisma.organization.findUnique({
        where: { id: g.orgId },
        select: { gbpConnectionStatus: true, googleReviewsCheckedAt: true, gbpPlaceId: true },
      }),
      prisma.reviewRequestEvent.findMany({
        where: { organizationId: g.orgId },
        select: { checkInId: true, kind: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.googleReview.findMany({
        where: { organizationId: g.orgId },
        orderBy: { postedAt: 'desc' },
      }),
    ])

    // Per-job request summary: count and most recent time for each kind.
    type KindSummary = { count: number; last: string }
    const requests: Record<string, Record<string, KindSummary>> = {}
    const firstRequestAt = new Map<string, Date>()
    for (const e of events) {
      const job = (requests[e.checkInId] ??= {})
      const k = (job[e.kind] ??= { count: 0, last: e.createdAt.toISOString() })
      k.count += 1
      k.last = e.createdAt.toISOString()
      if (!firstRequestAt.has(e.checkInId)) firstRequestAt.set(e.checkInId, e.createdAt)
    }

    const linked = reviews.filter((r) => r.state === 'linked' && r.checkInId)
    const linkedJobIds = new Set(linked.map((r) => r.checkInId as string))
    const unmatched = reviews.filter((r) => r.state === 'unmatched')

    // Suggestions only for jobs that have a recorded request.
    const jobIds = [...firstRequestAt.keys()]
    const jobs = jobIds.length
      ? await prisma.checkIn.findMany({
          where: { id: { in: jobIds }, organizationId: g.orgId },
          select: { id: true, homeCustomerName: true },
        })
      : []
    const matchJobs: MatchJob[] = jobs.map((j) => ({
      id: j.id,
      homeCustomerName: j.homeCustomerName,
      firstRequestAt: firstRequestAt.get(j.id) ?? null,
      hasLinkedReview: linkedJobIds.has(j.id),
    }))

    const suggestions: Record<string, Array<{ reviewId: string; match: string; firstRequestAt: string }>> = {}
    for (const r of unmatched) {
      if (!reviewContentCurrent(r.confirmedWithGoogleAt)) continue
      for (const s of suggestJobs(r, matchJobs)) {
        ;(suggestions[s.checkInId] ??= []).push({
          reviewId: r.id,
          match: s.match,
          firstRequestAt: s.firstRequestAt.toISOString(),
        })
      }
    }

    const needsReply = linked.filter((r) => reviewContentCurrent(r.confirmedWithGoogleAt) && !r.replyComment).length

    return NextResponse.json({
      gbpConnected: org?.gbpConnectionStatus === 'connected',
      lastCheckedAt: org?.googleReviewsCheckedAt?.toISOString() ?? null,
      reviewsListUrl: googleReviewsListUrl(org?.gbpPlaceId),
      requests,
      firstRequestAt: Object.fromEntries([...firstRequestAt].map(([k, v]) => [k, v.toISOString()])),
      reviews: reviews.map(present),
      suggestions,
      needsReplyCount: needsReply,
    })
  } catch (error) {
    console.error('Reviews GET failed:', error)
    return NextResponse.json({ error: 'Could not load review tracking' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const g = await gate()
    if (!g.ok) return g.res

    const body = (await request.json().catch(() => ({}))) as { action?: string; reviewId?: string; checkInId?: string }
    const action = body.action
    const reviewId = (body.reviewId || '').trim()
    if (!reviewId || !['link', 'dismiss', 'unlink', 'hide', 'restore'].includes(action || '')) {
      return NextResponse.json({ error: 'reviewId and a valid action are required' }, { status: 400 })
    }

    const review = await prisma.googleReview.findFirst({ where: { id: reviewId, organizationId: g.orgId } })
    if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

    const jobId = (body.checkInId || '').trim()
    const ownJob = async () =>
      jobId ? prisma.checkIn.findFirst({ where: { id: jobId, organizationId: g.orgId }, select: { id: true } }) : null

    let resync: string[] = []

    if (action === 'link') {
      if (!(await ownJob())) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      if (review.state === 'linked' && review.checkInId === jobId) return NextResponse.json({ ok: true })
      if (review.state === 'linked') {
        return NextResponse.json({ error: 'This review is already linked to another job. Unlink it first.' }, { status: 409 })
      }
      const taken = await prisma.googleReview.findFirst({ where: { checkInId: jobId }, select: { id: true } })
      if (taken) {
        return NextResponse.json({ error: 'This job already has a review. Unlink that review first.' }, { status: 409 })
      }
      try {
        await prisma.googleReview.update({
          where: { id: review.id },
          data: { state: 'linked', checkInId: jobId, linkedAt: new Date(), linkedByUserId: g.userId },
        })
      } catch (err) {
        // Another review was linked to this job at the same moment.
        if ((err as { code?: string })?.code === 'P2002') {
          return NextResponse.json({ error: 'This job already has a review. Unlink that review first.' }, { status: 409 })
        }
        throw err
      }
      resync = [jobId]
    } else if (action === 'dismiss') {
      if (!(await ownJob())) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
      if (!review.dismissedCheckInIds.includes(jobId)) {
        await prisma.googleReview.update({
          where: { id: review.id },
          data: { dismissedCheckInIds: { push: jobId } },
        })
      }
    } else if (action === 'unlink') {
      if (review.checkInId) resync = [review.checkInId]
      await prisma.googleReview.update({
        where: { id: review.id },
        data: { state: 'unmatched', checkInId: null, linkedAt: null, linkedByUserId: null },
      })
    } else if (action === 'hide') {
      if (review.checkInId) resync = [review.checkInId]
      await prisma.googleReview.update({
        where: { id: review.id },
        data: { state: 'hidden', checkInId: null, linkedAt: null, linkedByUserId: null },
      })
    } else if (action === 'restore') {
      await prisma.googleReview.update({ where: { id: review.id }, data: { state: 'unmatched' } })
    }

    if (resync.length) {
      after(async () => {
        await resyncJobsAfterReviewChange(resync)
      })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Reviews POST failed:', error)
    return NextResponse.json({ error: 'Could not update the review' }, { status: 500 })
  }
}
