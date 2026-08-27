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
 * Record that the stored Google grant no longer works.
 *
 * Both API modules already detect a revoked grant and return `needsReconnect`,
 * but before 2026-08-27 that signal died in a log line: the org row kept
 * saying 'connected', the Account card kept showing a green dot, and auto-post
 * kept firing into a dead connection. Keith hit exactly this on staging -
 * posting failed with no indication anything was wrong until he opened Account
 * and reconnected.
 *
 * Writing 'needs_reconnect' composes with the existing gates rather than
 * needing new ones: every check in this file and in the routes compares
 * against 'connected', so auto-post stops on its own, the API's `connected`
 * flag flips false, and the Reporting section reverts. `gbpConnectionStatus`
 * is already a nullable String column, so this value needs no migration.
 *
 * Never throws: callers include a background `after()` hook, where an
 * unhandled rejection would be invisible.
 */
async function markGbpNeedsReconnect(organizationId: string): Promise<void> {
  await prisma.organization
    .update({
      where: { id: organizationId },
      data: { gbpConnectionStatus: 'needs_reconnect' },
    })
    .catch((err) => console.error('GBP: could not record needs_reconnect status', organizationId, err))
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

  // ── Claim this job before calling Google ──
  // Two callers can now race for the same job: the auto-post hook that fires on
  // publish, and the manual button. Without a claim, both would reach
  // createLocalPost and the customer would get two posts on their listing for
  // one job — visible, embarrassing, and only removable one at a time.
  //
  // The claim is a conditional UPDATE: flip to 'posting' only from a state that
  // is not already in flight. Postgres serializes the two writes, so exactly one
  // caller sees count === 1 and proceeds.
  //
  // `gbpPostedAt` doubles as the claim timestamp so a claim orphaned by a crash
  // or a timeout can be reclaimed instead of wedging the job forever. On success
  // it is overwritten with the real post time; on failure it is cleared.
  const STALE_CLAIM_MS = 5 * 60 * 1000
  const claimedAt = new Date()
  const staleBefore = new Date(claimedAt.getTime() - STALE_CLAIM_MS)

  const claim = await prisma.checkIn.updateMany({
    where: {
      id: job.id,
      OR: [
        { gbpPostStatus: { not: 'posting' } },
        { gbpPostStatus: null },
        // Reclaim a stuck 'posting' left behind by a crashed run.
        { AND: [{ gbpPostStatus: 'posting' }, { gbpPostedAt: { lt: staleBefore } }] },
      ],
    },
    data: { gbpPostStatus: 'posting', gbpPostedAt: claimedAt },
  })

  if (claim.count === 0) {
    // Someone else is mid-post for this job. Reporting success avoids showing
    // the customer an error for what is really "already happening".
    return { ok: false, error: 'This job is already being posted to Google. Give it a moment.' }
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
    // to looking like it was never attempted. Clearing the claim timestamp
    // releases the job for an immediate retry.
    await prisma.checkIn
      .update({ where: { id: job.id }, data: { gbpPostStatus: 'failed', gbpPostedAt: null } })
      .catch((err) => console.error('GBP: could not record failed post status', err))
    // A dead grant is not a per-job failure, it is a connection failure, and
    // leaving the org row on 'connected' is what made this invisible before.
    // Marking it here also stops auto-post from retrying into a grant that
    // cannot recover on its own, since every gate checks for 'connected'.
    if (result.needsReconnect) {
      await markGbpNeedsReconnect(org.id)
    }
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

/** Why an auto-post did nothing, for the log line. */
export type GbpAutoPostSkipReason =
  | 'not_connected'
  | 'auto_post_off'
  | 'tier'
  | 'not_public'
  | 'already_posted'

export interface GbpAutoPostOutcome {
  posted: boolean
  /** Present only when `posted` is false. */
  skipped?: GbpAutoPostSkipReason
  searchUrl?: string | null
}

/**
 * Whether publishing this job should trigger an automatic Google post.
 *
 * Split out from the posting itself so the publish route can answer the
 * question *synchronously, before responding* — the dashboard needs to know an
 * auto-post is coming so it can show the job as already posting. Without that,
 * the card would sit on an enabled "Post to Google" button while the background
 * post was mid-flight, and one impatient click would put a second post on the
 * customer's listing.
 *
 * Silently returns a skip reason in every case a customer hasn't opted in,
 * which is the overwhelmingly common path: most orgs have no GBP connection at
 * all, so this has to be cheap and quiet rather than noisy.
 *
 * The tier is re-checked here even though the connection couldn't have been
 * made without it. A downgrade leaves the stored tokens in place by design
 * (disconnecting on downgrade would be hostile), so without this check an org
 * that dropped to Pro would keep auto-posting off the old grant.
 */
export async function shouldAutoPostOnPublish(
  checkInId: string
): Promise<{ eligible: boolean; skipped?: GbpAutoPostSkipReason }> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      isPublic: true,
      gbpPostStatus: true,
      organization: {
        select: {
          planTier: true,
          gbpAutoPost: true,
          gbpRefreshToken: true,
          gbpConnectionStatus: true,
        },
      },
    },
  })
  if (!job || !job.organization) return { eligible: false, skipped: 'not_connected' }
  const org = job.organization

  if (!org.gbpRefreshToken || org.gbpConnectionStatus !== 'connected') {
    return { eligible: false, skipped: 'not_connected' }
  }
  if (!org.gbpAutoPost) return { eligible: false, skipped: 'auto_post_off' }
  if (!tierHasFeature(org.planTier, 'gbp_integration')) return { eligible: false, skipped: 'tier' }
  if (!job.isPublic) {
    // Guards a race where the job was unpublished again between the response
    // and the background hook running.
    return { eligible: false, skipped: 'not_public' }
  }
  if (job.gbpPostStatus === 'posted' || job.gbpPostStatus === 'posting') {
    // Republishing a job that is still live on Google must not create a second
    // post. Unpublishing clears this field on a successful retract, so the
    // normal unpublish/republish cycle does post again — this only skips when
    // a real post is still standing, or one is already in flight.
    return { eligible: false, skipped: 'already_posted' }
  }
  return { eligible: true }
}

/**
 * Post a job to Google automatically, if this org has asked for that.
 *
 * Called from the publish route's `after()` hook. Re-runs the full eligibility
 * check rather than trusting the route's earlier answer, since the two happen
 * either side of the HTTP response and the job could have changed in between.
 */
export async function autoPostCheckInIfEnabled(checkInId: string): Promise<GbpResult<GbpAutoPostOutcome>> {
  const gate = await shouldAutoPostOnPublish(checkInId)
  if (!gate.eligible) {
    return { ok: true, data: { posted: false, skipped: gate.skipped } }
  }

  const result = await postCheckInToGbp(checkInId)
  if (!result.ok) {
    // No markGbpNeedsReconnect call here on purpose: postCheckInToGbp already
    // wrote it. Repeating it would be a second pointless write on the path
    // that runs inside a background after() hook.
    return { ok: false, error: result.error, needsReconnect: result.needsReconnect }
  }
  return { ok: true, data: { posted: true, searchUrl: result.data?.searchUrl ?? null } }
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
      // `id` is here for markGbpNeedsReconnect below, not for the delete call.
      organization: { select: { id: true, gbpAccessToken: true, gbpRefreshToken: true } },
    },
  })
  if (!job) return { ok: false, error: 'That job could not be found.' }

  if (!job.gbpPostName || !job.organization?.gbpRefreshToken) {
    return { ok: true, data: { removed: false } }
  }

  const result = await deleteLocalPost(job.organization.gbpRefreshToken, job.organization.gbpAccessToken, job.gbpPostName)
  if (!result.ok) {
    console.warn('GBP: could not delete post on Google, keeping local record so it stays retryable', checkInId, result.error)
    if (result.needsReconnect) {
      await markGbpNeedsReconnect(job.organization.id)
    }
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
