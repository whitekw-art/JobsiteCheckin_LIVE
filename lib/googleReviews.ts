import { prisma } from '@/lib/prisma'
import { getLocationPlaceId, listReviews } from '@/lib/gbpApi'
import { markGbpNeedsReconnect } from '@/lib/gbpSync'
import { tierHasFeature } from '@/lib/planVersions'

// Google reviews read from a Titan business's profile (phase 2 review engine,
// part B).
//
// Google's Business Profile API policy allows content read through the API
// to be kept "for no more than 30 calendar days". Every stored review is
// therefore re-confirmed with Google daily; one that has not been confirmed
// for ERASE_AFTER_DAYS has its name, stars, comment and reply erased, keeping
// only Google's review ID and its job link. The next successful refresh
// restores the content.
//
// Only reviews posted on or after the business's first recorded review request
// are stored (plus any review already linked to a job), so the unmatched list
// never fills with reviews from before ProjectCheckin was used.

export const ERASE_AFTER_DAYS = 29
const DAY_MS = 24 * 60 * 60 * 1000

/** True when a stored review's content may still be shown (30-day rule). */
export function reviewContentCurrent(confirmedWithGoogleAt: Date | null, now: number = Date.now()): boolean {
  return !!confirmedWithGoogleAt && now - confirmedWithGoogleAt.getTime() < ERASE_AFTER_DAYS * DAY_MS
}

export type ReviewRefreshOutcome = 'updated' | 'skipped' | 'failed'

export interface ReviewRefreshResult {
  outcome: ReviewRefreshOutcome
  /** Jobs whose linked review appeared, changed or disappeared (their WordPress posts need a rewrite). */
  changedCheckInIds: string[]
}

const sameTime = (a: Date | null, b: Date | null) => (a?.getTime() ?? null) === (b?.getTime() ?? null)

/** Read one organization's reviews from Google and bring the stored copies up to date. */
export async function refreshOrgReviews(orgId: string): Promise<ReviewRefreshResult> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      planTier: true,
      gbpRefreshToken: true,
      gbpAccessToken: true,
      gbpAccountId: true,
      gbpLocationId: true,
      gbpConnectionStatus: true,
    },
  })
  if (
    !org ||
    !tierHasFeature(org.planTier, 'review_request') ||
    org.gbpConnectionStatus !== 'connected' ||
    !org.gbpRefreshToken ||
    !org.gbpAccountId ||
    !org.gbpLocationId
  ) {
    return { outcome: 'skipped', changedCheckInIds: [] }
  }

  const result = await listReviews(org.gbpRefreshToken, org.gbpAccessToken, org.gbpAccountId, org.gbpLocationId)
  if (!result.ok || !result.data) {
    if (result.needsReconnect) await markGbpNeedsReconnect(orgId)
    return { outcome: 'failed', changedCheckInIds: [] }
  }

  const now = new Date()
  const firstRequest = await prisma.reviewRequestEvent.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  })
  const stored = await prisma.googleReview.findMany({ where: { organizationId: orgId } })
  const storedById = new Map(stored.map((r) => [r.googleReviewId, r]))
  const changed = new Set<string>()

  for (const g of result.data.reviews) {
    const row = storedById.get(g.reviewId)
    const content = {
      reviewerName: g.reviewerName,
      starRating: g.starRating,
      comment: g.comment,
      replyComment: g.replyComment,
      replyUpdatedAt: g.replyUpdatedAt,
      postedAt: g.postedAt,
      googleUpdatedAt: g.updatedAt,
      confirmedWithGoogleAt: now,
    }
    if (row) {
      const contentChanged =
        row.reviewerName !== g.reviewerName ||
        row.starRating !== g.starRating ||
        row.comment !== g.comment ||
        row.replyComment !== g.replyComment ||
        !sameTime(row.postedAt, g.postedAt)
      await prisma.googleReview.update({ where: { id: row.id }, data: content })
      if (contentChanged && row.checkInId) changed.add(row.checkInId)
      continue
    }
    if (!firstRequest || !g.postedAt || g.postedAt < firstRequest.createdAt) continue
    // A review can belong to only one organization; skip one already stored
    // for another (the same Google profile connected to two accounts).
    await prisma.googleReview
      .create({ data: { organizationId: orgId, googleReviewId: g.reviewId, ...content } })
      .catch((err: { code?: string }) => {
        if (err?.code !== 'P2002') throw err
      })
  }

  // A review missing from a complete list was deleted on Google.
  if (result.data.complete) {
    const onGoogle = new Set(result.data.reviews.map((r) => r.reviewId))
    const gone = stored.filter((r) => !onGoogle.has(r.googleReviewId))
    if (gone.length) {
      await prisma.googleReview.deleteMany({ where: { id: { in: gone.map((r) => r.id) } } })
      for (const r of gone) if (r.checkInId) changed.add(r.checkInId)
    }
  }

  // The place ID opens the business's Google reviews list from the job page.
  const place = await getLocationPlaceId(org.gbpRefreshToken, org.gbpAccessToken, org.gbpLocationId).catch(() => null)

  await prisma.organization.update({
    where: { id: orgId },
    data: { googleReviewsCheckedAt: now, ...(place?.ok ? { gbpPlaceId: place.data ?? null } : {}) },
  })
  return { outcome: 'updated', changedCheckInIds: [...changed] }
}

/**
 * Erase the content of reviews not confirmed with Google for ERASE_AFTER_DAYS
 * (Google's 30-day storage limit). Returns the jobs whose linked review was
 * erased, so their WordPress posts can be rewritten without it.
 */
export async function eraseStaleReviewContent(now: Date = new Date()): Promise<string[]> {
  const cutoff = new Date(now.getTime() - ERASE_AFTER_DAYS * DAY_MS)
  const where = {
    OR: [{ confirmedWithGoogleAt: null }, { confirmedWithGoogleAt: { lt: cutoff } }],
    NOT: { reviewerName: null, starRating: null, comment: null, replyComment: null },
  }
  const affected = await prisma.googleReview.findMany({ where, select: { checkInId: true } })
  if (affected.length === 0) return []
  await prisma.googleReview.updateMany({
    where,
    data: { reviewerName: null, starRating: null, comment: null, replyComment: null, replyUpdatedAt: null },
  })
  return affected.map((r) => r.checkInId).filter((id): id is string => !!id)
}

/** Titan organizations with a connected profile not refreshed in the last 20 hours, oldest first. */
export async function orgsDueForReviewRefresh(limit: number, now: Date = new Date()): Promise<string[]> {
  const due = new Date(now.getTime() - 20 * 60 * 60 * 1000)
  const rows = await prisma.organization.findMany({
    where: {
      gbpConnectionStatus: 'connected',
      gbpLocationId: { not: null },
      OR: [{ googleReviewsCheckedAt: null }, { googleReviewsCheckedAt: { lt: due } }],
    },
    select: { id: true, planTier: true },
    orderBy: { googleReviewsCheckedAt: { sort: 'asc', nulls: 'first' } },
    take: limit * 5,
  })
  return rows.filter((r) => tierHasFeature(r.planTier, 'review_request')).slice(0, limit).map((r) => r.id)
}

/** Google's page listing all of a business's reviews. */
export function googleReviewsListUrl(placeId: string | null | undefined): string | null {
  return placeId ? `https://search.google.com/local/reviews?placeid=${encodeURIComponent(placeId)}` : null
}

export interface PublicReview {
  reviewerName: string | null
  starRating: number | null
  comment: string | null
  replyComment: string | null
  postedAt: string | null
  /** The business's Google reviews list ("Read this review on Google"). */
  reviewsListUrl: string | null
}

/**
 * The confirmed Google review for a published job, as public pages show it:
 * only on Titan, only when linked by the owner, and only while the content is
 * inside Google's 30-day limit. Text is returned exactly as Google sent it.
 */
export async function publicReviewForJob(checkInId: string): Promise<PublicReview | null> {
  const review = await prisma.googleReview
    .findUnique({
      where: { checkInId },
      select: {
        state: true,
        reviewerName: true,
        starRating: true,
        comment: true,
        replyComment: true,
        postedAt: true,
        confirmedWithGoogleAt: true,
        organization: { select: { planTier: true, gbpPlaceId: true } },
      },
    })
    .catch(() => null)
  if (!review || review.state !== 'linked') return null
  if (!tierHasFeature(review.organization.planTier, 'review_request')) return null
  if (!reviewContentCurrent(review.confirmedWithGoogleAt) || !review.starRating) return null
  return {
    reviewerName: review.reviewerName,
    starRating: review.starRating,
    comment: review.comment,
    replyComment: review.replyComment,
    postedAt: review.postedAt?.toISOString() ?? null,
    reviewsListUrl: googleReviewsListUrl(review.organization.gbpPlaceId),
  }
}
