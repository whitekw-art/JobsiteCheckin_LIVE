import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { tierHasFeature } from '@/lib/planVersions'
import { createLocalPost, deleteLocalPost, buildPostSummary, type GbpResult } from '@/lib/gbpApi'

// Orchestration for publishing a job to a customer's Google Business Profile.
//
// Design: docs/plans/2026-08-21-gbp-auto-posting-design.md
//
// Kept separate from the route so the Phase 2 auto-post hook (an `after()` call
// in app/api/checkins/publish/route.ts) runs exactly the same code path as the
// manual button, rather than a second near-copy that drifts.
//
// Mirrors the shape of lib/wordpressSync.ts: read everything needed in one
// query, do the outside call, record the outcome on the job either way.

export interface GbpPostOutcome {
  searchUrl: string | null
  postedAt: Date
}

/**
 * Publish one job to the org's connected listing.
 *
 * Records `gbpPostStatus` on the CheckIn whether it succeeds or fails, so the
 * dashboard can show a real state instead of the button forgetting what
 * happened the moment the page reloads.
 */
export async function postCheckInToGbp(checkInId: string): Promise<GbpResult<GbpPostOutcome>> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      id: true,
      doorType: true,
      city: true,
      state: true,
      notes: true,
      seoDescription: true,
      photoUrls: true,
      featuredPhotoUrl: true,
      isPublic: true,
      wpPostUrl: true,
      organization: {
        select: {
          id: true,
          slug: true,
          planTier: true,
          gbpAccessToken: true,
          gbpRefreshToken: true,
          gbpAccountId: true,
          gbpLocationId: true,
          gbpConnectionStatus: true,
          wpConnectionStatus: true,
          customSubdomain: true,
          subdomainStatus: true,
          portfolioPageUrl: true,
        },
      },
    },
  })

  if (!job || !job.organization) {
    return { ok: false, error: 'That job could not be found.' }
  }
  const org = job.organization

  if (!org.gbpRefreshToken || !org.gbpAccountId || !org.gbpLocationId) {
    return { ok: false, error: 'Connect your Google Business Profile first.' }
  }
  if (org.gbpConnectionStatus !== 'connected') {
    return { ok: false, error: 'Finish setting up your Google Business Profile connection first.' }
  }

  // `notes` is the real narrative — hand-written or AI-generated. `seoDescription`
  // is the auto-built template ("Installed a Wood Door at ...") meant for a meta
  // tag, so it is the fallback rather than the first choice. Same priority the
  // widget embed settled on for the same reason: the template reads as filler.
  const description = job.notes?.trim() || job.seoDescription?.trim() || null

  const summary = buildPostSummary({
    id: job.id,
    jobType: (job.doorType || 'Job').trim(),
    city: job.city,
    state: job.state,
    description,
  })

  const result = await createLocalPost(
    org.gbpRefreshToken,
    org.gbpAccessToken,
    org.gbpAccountId,
    org.gbpLocationId,
    {
      summary,
      linkUrl: resolveLinkTarget(job, org),
      photoUrl: coverPhoto(job),
    }
  )

  if (!result.ok) {
    // Recorded so the job card can offer a retry rather than silently reverting
    // to looking like it was never attempted.
    await prisma.checkIn
      .update({ where: { id: job.id }, data: { gbpPostStatus: 'failed' } })
      .catch((err) => console.error('GBP: could not record failed post status', err))
    // Re-shaped rather than returned directly: the failure carries no data, and
    // the two result types differ in their success payload.
    return { ok: false, error: result.error, needsReconnect: result.needsReconnect }
  }

  const postedAt = new Date()
  await prisma.checkIn.update({
    where: { id: job.id },
    data: {
      gbpPostName: result.data?.name || null,
      gbpPostUrl: result.data?.searchUrl || null,
      gbpPostedAt: postedAt,
      gbpPostStatus: 'posted',
    },
  })

  return { ok: true, data: { searchUrl: result.data?.searchUrl ?? null, postedAt } }
}

export interface GbpRetractOutcome {
  /** False when there was nothing to remove — the common case from the
   *  unpublish hook, which calls this unconditionally on every job. */
  removed: boolean
}

/**
 * Remove a job's post from Google and clear our record of it, so the job goes
 * back to "not posted" and can be posted again fresh.
 *
 * Two callers, both needing the same behavior: an explicit "Remove from
 * Google" click, and the automatic best-effort call when a job is unpublished
 * (app/api/checkins/publish/route.ts). Both must be safe to call on a job that
 * was never posted.
 *
 * ── WHY THE LOCAL RECORD IS *NOT* CLEARED ON FAILURE ──
 * The tempting shortcut is to clear our fields regardless, mirroring how
 * revokeAccess shrugs off a failed revoke on disconnect. That is wrong here,
 * and the two cases are not analogous. A failed revoke leaves a stale grant
 * that costs nothing; a failed delete leaves a post still LIVE on the
 * customer's Google listing. Clearing our copy at that point orphans it —
 * the app forgets the post exists, so the customer can never remove it
 * through us again, and it keeps pointing at a job page that may no longer
 * be public.
 *
 * So the record survives a genuine failure and the job keeps showing as
 * posted, which is the truth and leaves the retry reachable. Note
 * deleteLocalPost already treats 404 as success, so "the post was deleted by
 * hand on Google" and "the post expired" both land in the ok branch and do
 * clear correctly — which is the case Keith actually hit on staging.
 */
export async function retractCheckInFromGbp(checkInId: string): Promise<GbpResult<GbpRetractOutcome>> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      id: true,
      gbpPostName: true,
      organization: { select: { gbpAccessToken: true, gbpRefreshToken: true } },
    },
  })
  if (!job) return { ok: false, error: 'That job could not be found.' }

  if (!job.gbpPostName || !job.organization?.gbpRefreshToken) {
    return { ok: true, data: { removed: false } }
  }

  const result = await deleteLocalPost(job.organization.gbpRefreshToken, job.organization.gbpAccessToken, job.gbpPostName)
  if (!result.ok) {
    console.warn('GBP: could not delete post on Google, keeping local record so it stays retryable', checkInId, result.error)
    return { ok: false, error: result.error, needsReconnect: result.needsReconnect }
  }

  await prisma.checkIn.update({
    where: { id: job.id },
    data: { gbpPostName: null, gbpPostUrl: null, gbpPostedAt: null, gbpPostStatus: null },
  })

  return { ok: true, data: { removed: true } }
}

/**
 * Where the post's "Learn more" button sends someone — the tiered rule from
 * project_gbp_strategy, confirmed 2026-04-11.
 *
 * Pro and Elite point at the ProjectCheckin job page, so the link equity builds
 * projectcheckin.com. Titan points at the customer's own domain instead, which
 * is the whole reason that tier exists: they bought the SEO credit.
 *
 * The Titan branch walks the three website-integration options in the same
 * Good/Better/Best order the Connections page already uses, strongest first.
 * A Titan customer with none of them set up falls through to the job page —
 * a post with no link at all would be strictly worse for them.
 */
function resolveLinkTarget(
  job: {
    id: string
    doorType: string | null
    city: string | null
    state: string | null
    wpPostUrl: string | null
  },
  org: {
    slug: string | null
    planTier: string | null
    wpConnectionStatus: string | null
    customSubdomain: string | null
    subdomainStatus: string | null
    portfolioPageUrl: string | null
  }
): string {
  const utm = 'utm_source=googlebusiness&utm_medium=post&utm_campaign=projectcheckin'

  if (tierHasFeature(org.planTier, 'website_integration')) {
    // 1 — WordPress, strongest: a real post on their own domain. Requires THIS
    // job to have actually synced, not just a live connection — linking to a
    // post that failed to sync would be a dead link on their Google listing.
    if (org.wpConnectionStatus === 'connected' && job.wpPostUrl) {
      return withUtm(job.wpPostUrl, utm)
    }
    // 2 — CNAME subdomain: a real page on their domain, though the jobs index
    // rather than this specific job.
    if (org.customSubdomain && org.subdomainStatus === 'live') {
      return withUtm(`https://${org.customSubdomain}/`, utm)
    }
    // 3 — whichever page they pasted the widget onto.
    if (org.portfolioPageUrl) {
      return withUtm(org.portfolioPageUrl, utm)
    }
  }

  return withUtm(projectCheckinJobUrl(job, org.slug), utm)
}

function projectCheckinJobUrl(
  job: { id: string; doorType: string | null; city: string | null; state: string | null },
  orgSlug: string | null
): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
  const citySlug = slugify(job.city || '')
  const stateSlug = slugify(job.state || '')
  const doorTypeSlug = slugify(job.doorType || 'job')
  const slug = orgSlug ? `${doorTypeSlug}-${orgSlug}-${job.id}` : `${doorTypeSlug}-${job.id}`
  return `${base}/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${slug}`
}

function withUtm(url: string, utm: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}${utm}`
}

/**
 * The single photo Google gets. Honors the customer's chosen cover photo when
 * they set one — every other customer-facing surface already does, and a post
 * showing a different image than their own job page would look like a bug.
 */
function coverPhoto(job: { photoUrls: string | null; featuredPhotoUrl: string | null }): string | null {
  const photos = job.photoUrls
    ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []
  if (photos.length === 0) return null
  if (job.featuredPhotoUrl && photos.includes(job.featuredPhotoUrl)) return job.featuredPhotoUrl
  return photos[0]
}
