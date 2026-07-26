import { prisma } from '@/lib/prisma'
import { tierHasFeature } from '@/lib/planVersions'
import { slugify } from '@/lib/slugify'
import { decryptCredential } from '@/lib/wpCredentials'
import {
  type WpCredentials,
  type WpPostInput,
  createPost,
  updatePost,
  deletePost,
  deleteMedia,
  ensureCategory,
  ensureTag,
  uploadMedia,
  getPageContent,
  updatePageContent,
} from '@/lib/wordpressApi'

// Orchestration for WordPress native publishing (Phase 3, Website Integration
// for Local SEO). Decides WHAT syncs and WHEN; lib/wordpressApi.ts does the
// talking. Design spec: docs/plans/2026-07-21-wordpress-native-publish-design.md
//
// Sync status values on CheckIn.wpSyncStatus:
//   'synced'   — live on the customer's WordPress site right now
//   'failed'   — last sync attempt failed, needs attention
//   'revoked'  — was live under an active Titan subscription, pulled down when
//                they cancelled/downgraded. PERMANENT marker: these are the
//                jobs restored automatically on any future Titan resubscribe,
//                no matter how long the gap (design spec §8).
//   null       — never synced, or the customer unpublished the job themselves
//                (a customer choice, deliberately NOT restored later)

/** Pacing between requests during bulk restore. Roughly the rate a human
 *  editor publishing by hand would produce — safe for cheap shared hosting.
 *  Validate against a real WordPress install before shipping (spec §12.4). */
const BULK_DELAY_MS = 750

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Phase 3b: existing-page injection ────────────────────────────────────────
// Recent-jobs cap per injected page block (design §4). Bounds page weight; older
// jobs roll off the block but still exist as data / new posts.
export const PAGE_JOB_CAP = 12

// The delimiter pair the customer pastes (or we auto-append). We ONLY ever
// rewrite what sits between these two markers — never anything outside them.
// That is the hard content-safety guarantee (design §5).
const MARKER_START = '<!-- projectcheckin:start -->'
const MARKER_END = '<!-- projectcheckin:end -->'

/**
 * Splice a freshly-rendered block into a customer page's existing content,
 * touching nothing outside our own markers.
 *
 * - Both markers present, in order → replace only the content between them.
 * - Markers absent, or malformed (only one, or out of order) → append a fresh
 *   pair at the end. We never attempt to partial-repair a broken marker, which
 *   could corrupt surrounding content.
 * - An empty `blockHtml` (revoke) writes an empty pair — removes our content,
 *   leaves a clean placeholder, and still touches nothing else.
 *
 * Returns the full new page content plus which mode was used (for status/UI).
 */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Matches one full marker-delimited block, non-greedy so back-to-back pairs
// are matched individually rather than as one span from the first start to
// the last end.
const MARKER_BLOCK_RE = new RegExp(`${escapeRegex(MARKER_START)}[\\s\\S]*?${escapeRegex(MARKER_END)}`, 'g')

export function spliceBlock(
  existing: string,
  blockHtml: string
): { content: string; markerMode: 'marker' | 'append' } {
  const matches = [...existing.matchAll(MARKER_BLOCK_RE)]
  if (matches.length === 0) {
    return {
      content: `${existing}\n${MARKER_START}${blockHtml}${MARKER_END}`,
      markerMode: 'append',
    }
  }
  // Only the first marker pair (in document order) is "the" placement. Any
  // further pairs are stale leftovers from an earlier append or a moved
  // marker — strip them entirely instead of leaving duplicate content behind.
  let first = true
  const content = existing.replace(MARKER_BLOCK_RE, () => {
    if (first) {
      first = false
      return `${MARKER_START}${blockHtml}${MARKER_END}`
    }
    return ''
  })
  return { content, markerMode: 'marker' }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type OrgContext = {
  org: {
    id: string
    name: string
    slug: string | null
    website: string | null
    phone: string | null
    email: string | null
    planTier: string | null
    wpCreateNewPosts: boolean
  }
  creds: WpCredentials
}

/**
 * Resolve an org's WordPress credentials, but only when it is genuinely
 * entitled to publish right now: connection present AND on Titan. Every sync
 * path goes through this, so a lapsed subscription can't leak new content
 * onto a customer's site.
 */
async function getOrgContext(orgId: string): Promise<OrgContext | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      website: true,
      phone: true,
      email: true,
      planTier: true,
      wpCreateNewPosts: true,
      wpSiteUrl: true,
      wpUsername: true,
      wpApplicationPassword: true,
      wpConnectionStatus: true,
    },
  })
  if (!org) return null
  if (org.wpConnectionStatus !== 'connected') return null
  if (!tierHasFeature(org.planTier, 'website_integration')) return null
  if (!org.wpSiteUrl || !org.wpUsername || !org.wpApplicationPassword) return null

  const password = decryptCredential(org.wpApplicationPassword)
  if (!password) return null

  return {
    org,
    creds: { siteUrl: org.wpSiteUrl, username: org.wpUsername, password },
  }
}

type JobRecord = {
  id: string
  doorType: string | null
  city: string | null
  state: string | null
  seoTitle: string | null
  seoDescription: string | null
  notes: string | null
  photoUrls: string | null
  beforePhotoUrl: string | null
  afterPhotoUrl: string | null
  featuredPhotoUrl: string | null
  timestamp: Date | null
  wpPostId: number | null
  wpMedia: string | null
}

/**
 * One photo we've uploaded into the customer's Media Library.
 * `origin` is the URL in our own storage — it's what lets a resync tell an
 * already-uploaded photo from a newly added one, and what the customer's
 * featured-photo pick is matched against.
 */
interface SyncedMedia {
  id: number
  origin: string
  url: string
  role: 'before' | 'after' | 'gallery'
}

function parseMedia(raw: string | null): SyncedMedia[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SyncedMedia[]) : []
  } catch {
    return []
  }
}

const JOB_SELECT = {
  id: true,
  doorType: true,
  city: true,
  state: true,
  seoTitle: true,
  seoDescription: true,
  notes: true,
  photoUrls: true,
  beforePhotoUrl: true,
  afterPhotoUrl: true,
  featuredPhotoUrl: true,
  timestamp: true,
  wpPostId: true,
  wpMedia: true,
} as const

function jobTitle(job: JobRecord): string {
  const type = (job.doorType || 'Completed Job').trim()
  const place = [job.city?.trim(), job.state?.trim()].filter(Boolean).join(', ')
  return place ? `${type} in ${place}` : type
}

function jobDescription(job: JobRecord): string {
  return (job.notes || job.seoDescription || '').trim()
}

/**
 * Per-post JSON-LD: a Service node that references the business by @id rather
 * than repeating a full LocalBusiness entity on every post (spec §4 — avoids
 * duplicate-schema bloat across dozens of job posts).
 */
function buildJsonLd(job: JobRecord, org: OrgContext['org'], siteUrl: string): string {
  // Stable business identity across every job post on their site, so the posts
  // all reference one entity instead of each declaring its own.
  const businessId = `${org.website || siteUrl}#business`
  const graph: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: jobTitle(job),
    ...(jobDescription(job) ? { description: jobDescription(job) } : {}),
    ...(job.timestamp ? { datePublished: job.timestamp.toISOString() } : {}),
    provider: {
      '@type': 'LocalBusiness',
      '@id': businessId,
      name: org.name,
      ...(org.website ? { url: org.website } : {}),
      ...(org.phone ? { telephone: org.phone } : {}),
      ...(org.email ? { email: org.email } : {}),
    },
    ...(job.city
      ? {
          areaServed: {
            '@type': 'Place',
            address: {
              '@type': 'PostalAddress',
              addressLocality: job.city,
              ...(job.state ? { addressRegion: job.state } : {}),
            },
          },
        }
      : {}),
  }
  // Escape "<" so a value can never break out of the script tag.
  return JSON.stringify(graph).replace(/</g, '\\u003c')
}

function photoHtml(p: SyncedMedia, alt: string): string {
  return `<img src="${escapeHtml(p.url)}" alt="${escapeHtml(alt)}" class="wp-image-${p.id}" loading="lazy" />`
}

function buildContent(
  job: JobRecord,
  org: OrgContext['org'],
  media: SyncedMedia[],
  siteUrl: string
): string {
  const alt = jobTitle(job)
  const before = media.find((m) => m.role === 'before') ?? null
  const after = media.find((m) => m.role === 'after') ?? null
  const photos = media.filter((m) => m.role === 'gallery')
  const parts: string[] = []
  const description = jobDescription(job)
  if (description) parts.push(`<p>${escapeHtml(description)}</p>`)

  // Before/after as two labelled images side by side — no injected JS/CSS, so
  // it renders in any theme, and both images stay separately indexable.
  if (before && after) {
    parts.push(
      `<figure class="wp-block-columns" style="display:flex;gap:16px;flex-wrap:wrap">` +
        `<div style="flex:1 1 240px"><p><strong>Before</strong></p>${photoHtml(before, `${alt} — before`)}</div>` +
        `<div style="flex:1 1 240px"><p><strong>After</strong></p>${photoHtml(after, `${alt} — after`)}</div>` +
        `</figure>`
    )
  }

  for (const p of photos) parts.push(`<figure>${photoHtml(p, alt)}</figure>`)

  const place = [job.city?.trim(), job.state?.trim()].filter(Boolean).join(', ')
  if (place) parts.push(`<p><strong>Location:</strong> ${escapeHtml(place)}</p>`)

  // Attribution: the business is credited as the author in the visible line and
  // in schema. The WP post_author field is just plumbing (see spec §3).
  parts.push(
    `<p><em>Documented by ${escapeHtml(org.name)} — publishing powered by ` +
      `<a href="https://projectcheckin.com" rel="nofollow">ProjectCheckin</a>.</em></p>`
  )

  parts.push(
    `<script type="application/ld+json">${buildJsonLd(job, org, siteUrl)}</script>`
  )

  return parts.join('\n')
}

/** SEO-descriptive media filename — never a raw UUID. */
function mediaFilename(job: JobRecord, index: number): string {
  const base = slugify(
    [job.doorType || 'job', job.city || '', job.state || ''].filter(Boolean).join(' ')
  )
  return `${base || 'job'}-${index + 1}.jpg`
}

function jobPhotoUrls(job: JobRecord): string[] {
  return job.photoUrls
    ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
    : []
}

/**
 * Read an org's WordPress credentials directly, bypassing the Titan
 * entitlement gate in getOrgContext. Used only by revoke/clear paths, which
 * must work at the exact moment a subscription ends — when getOrgContext would
 * already refuse (matching how unsyncCheckIn has always worked).
 */
async function getDirectCreds(orgId: string): Promise<WpCredentials | null> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { wpSiteUrl: true, wpUsername: true, wpApplicationPassword: true },
  })
  const password = decryptCredential(org?.wpApplicationPassword)
  if (!org?.wpSiteUrl || !org.wpUsername || !password) return null
  return { siteUrl: org.wpSiteUrl, username: org.wpUsername, password }
}

/**
 * Upload a job's photos into the customer's Media Library, reusing anything
 * already uploaded (matched on origin URL), uploading only genuinely new
 * photos, and deleting anything no longer on the job. Returns the current media
 * set; the caller persists it on the job. Shared by post publishing
 * (syncCheckIn) and page injection (renderPageMapping).
 */
async function reconcileJobMedia(creds: WpCredentials, job: JobRecord): Promise<SyncedMedia[]> {
  const alt = jobTitle(job)
  const previous = parseMedia(job.wpMedia)
  const wanted: Array<{ origin: string; role: SyncedMedia['role']; alt: string }> = []

  if (job.beforePhotoUrl) wanted.push({ origin: job.beforePhotoUrl, role: 'before', alt: `${alt} — before` })
  if (job.afterPhotoUrl) wanted.push({ origin: job.afterPhotoUrl, role: 'after', alt: `${alt} — after` })
  for (const url of jobPhotoUrls(job)) {
    if (url === job.beforePhotoUrl || url === job.afterPhotoUrl) continue
    wanted.push({ origin: url, role: 'gallery', alt })
  }

  const media: SyncedMedia[] = []
  for (let i = 0; i < wanted.length; i++) {
    const want = wanted[i]
    const existing = previous.find((p) => p.origin === want.origin)
    if (existing) {
      media.push({ ...existing, role: want.role })
      continue
    }
    const r = await uploadMedia(creds, want.origin, mediaFilename(job, i), want.alt)
    if (r.ok && r.data) {
      media.push({ id: r.data.id, origin: want.origin, url: r.data.sourceUrl, role: want.role })
    }
  }

  // Photos removed from the job shouldn't linger in their Media Library.
  for (const old of previous) {
    if (!media.some((m) => m.id === old.id)) await deleteMedia(creds, old.id)
  }
  return media
}

type MappingLike = {
  matchCity: string | null
  matchState: string | null
  matchService: string | null
  createdAt: Date
}

/**
 * Pick which page mapping (if any) a job belongs to. A mapping matches when
 * every dimension it *sets* equals the job's value; a null dimension is a
 * wildcard. When several match, the most specific wins (more set dimensions);
 * ties break to the most recently created mapping (design §3). Pure/testable.
 */
export function pickMapping<T extends MappingLike>(
  mappings: T[],
  job: { city: string | null; state: string | null; doorType: string | null }
): T | null {
  const matches = mappings.filter((m) => {
    if (m.matchCity) {
      if ((m.matchCity ?? '') !== (job.city ?? '')) return false
      if ((m.matchState ?? '') !== (job.state ?? '')) return false
    }
    if (m.matchService && (m.matchService ?? '') !== (job.doorType ?? '')) return false
    return true
  })
  if (matches.length === 0) return null

  const specificity = (m: T) => (m.matchCity ? 1 : 0) + (m.matchService ? 1 : 0)
  matches.sort((a, b) => {
    const s = specificity(b) - specificity(a)
    return s !== 0 ? s : b.createdAt.getTime() - a.createdAt.getTime()
  })
  return matches[0]
}

/**
 * Publish (or re-publish) one job to the customer's WordPress site.
 * Safe to call repeatedly — updates in place when a post already exists.
 */
export async function syncCheckIn(
  checkInId: string
): Promise<{ ok: boolean; error?: string; transient?: boolean }> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: { ...JOB_SELECT, isPublic: true, organizationId: true },
  })
  if (!job?.organizationId) return { ok: false, error: 'Job not found.' }
  if (!job.isPublic) return { ok: false, error: 'Job is not published.' }

  const ctx = await getOrgContext(job.organizationId)
  if (!ctx) return { ok: false, error: 'No active WordPress connection.' }

  const { creds, org } = ctx

  // ── Routing (Phase 3b): existing-page injection vs. new post ──
  // Look up whether this job matches one of the org's existing-page mappings.
  const mappings = await prisma.wordPressPageMapping.findMany({
    where: { organizationId: job.organizationId },
  })
  const mapping = pickMapping(mappings, job)

  // Case A: matched an injectable page AND not already a standalone post →
  // this job belongs to that page's block, not a post. renderPageMapping
  // re-renders the whole block (which now includes this job) and sets the
  // job's own media/sync fields. (wpPostId stays null; invariant 3.)
  if (mapping && !mapping.builderBlocked && job.wpPostId == null) {
    await renderPageMapping(mapping.id)
    return { ok: true }
  }

  // Case B: decide whether a standalone post is warranted at all.
  //  - builder-blocked mapping → publish anyway (customer explicitly mapped
  //    this location; injection just isn't possible — design §9.1)
  //  - already a post → keep it synced (design §9.8 leaves pre-existing posts)
  //  - unmatched → only when the org keeps new-post creation on
  const wantPost =
    (mapping != null && mapping.builderBlocked) ||
    job.wpPostId != null ||
    (mapping == null && org.wpCreateNewPosts)
  if (!wantPost) return { ok: true } // injection-only mode, unmatched job → nothing to do

  // Reconcile photos against what we've already uploaded (reuse existing,
  // upload new, drop removed) — shared with page injection.
  const media = await reconcileJobMedia(creds, job)

  // Featured image: the customer's explicit pick, else the "after" shot,
  // else the first photo. Matched on origin, not the WordPress URL.
  const featuredMediaId =
    media.find((m) => m.origin === job.featuredPhotoUrl)?.id ??
    media.find((m) => m.role === 'after')?.id ??
    media[0]?.id ??
    null

  const title = job.seoTitle?.trim() || jobTitle(job)
  const description = jobDescription(job)
  const excerpt = description.slice(0, 155)
  const slug = slugify(`${job.doorType || 'job'} ${job.city || ''} ${job.state || ''}`) || `job-${job.id.slice(0, 8)}`

  const [categoryId, tagId] = await Promise.all([
    job.doorType ? ensureCategory(creds, job.doorType.trim()) : Promise.resolve(null),
    job.city
      ? ensureTag(creds, [job.city.trim(), job.state?.trim()].filter(Boolean).join(' '))
      : Promise.resolve(null),
  ])

  const input: WpPostInput = {
    title,
    content: buildContent(job, org, media, creds.siteUrl),
    excerpt,
    slug,
    categoryIds: categoryId ? [categoryId] : [],
    tagIds: tagId ? [tagId] : [],
    featuredMediaId,
    seoTitle: title,
    seoDescription: excerpt,
  }

  const result = job.wpPostId
    ? await updatePost(creds, job.wpPostId, input)
    : await createPost(creds, input)

  if (!result.ok || !result.data) {
    await prisma.checkIn.update({
      where: { id: job.id },
      data: { wpSyncStatus: 'failed' },
    })
    return { ok: false, error: result.error, transient: result.transient }
  }

  await prisma.checkIn.update({
    where: { id: job.id },
    data: {
      wpPostId: result.data.id,
      wpPostUrl: result.data.link,
      wpMedia: media.length ? JSON.stringify(media) : null,
      wpSyncedAt: new Date(),
      wpSyncStatus: 'synced',
    },
  })
  return { ok: true }
}

/**
 * Remove one job from the customer's WordPress site.
 *
 * `reason` decides whether it can ever come back automatically:
 *   'unpublished' — the customer's own choice, status cleared, not restored
 *   'revoked'     — subscription lapsed, permanently eligible for restore
 */
export async function unsyncCheckIn(
  checkInId: string,
  reason: 'unpublished' | 'revoked' = 'unpublished'
): Promise<{ ok: boolean }> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      id: true,
      organizationId: true,
      wpPostId: true,
      wpMedia: true,
      wpSyncStatus: true,
      city: true,
      state: true,
      doorType: true,
    },
  })
  if (!job?.organizationId) return { ok: true }
  // Nothing was ever synced for this job (neither a post nor an injected entry).
  const wasInjected = !job.wpPostId && (job.wpSyncStatus === 'synced' || !!job.wpMedia)
  if (!job.wpPostId && !wasInjected) return { ok: true }

  // Deliberately bypasses getOrgContext's Titan gate (see getDirectCreds):
  // revocation has to work at the exact moment a subscription ends.
  const creds = await getDirectCreds(job.organizationId)
  if (creds) {
    // A standalone post gets deleted; an injected job has no post of its own —
    // only its Media Library uploads are removed, and the page block is
    // re-rendered below so the job drops off.
    if (job.wpPostId) await deletePost(creds, job.wpPostId)
    // Media has no trash state — must be deleted explicitly or the image files
    // stay publicly reachable at their upload URLs (spec §8).
    for (const m of parseMedia(job.wpMedia)) {
      await deleteMedia(creds, m.id)
    }
  }

  await prisma.checkIn.update({
    where: { id: job.id },
    data: {
      wpPostId: null,
      wpPostUrl: null,
      wpMedia: null,
      wpSyncedAt: null,
      wpSyncStatus: reason === 'revoked' ? 'revoked' : null,
    },
  })

  // Injected job unpublished by the customer: rebuild its page block so it no
  // longer appears. The job's isPublic is already false by now (the publish
  // route updates it before calling this), so renderPageMapping excludes it.
  // On 'revoked', the org isn't entitled so renderPageMapping no-ops — the
  // whole block is emptied by clearPageMapping in revokeOrgWordPress instead.
  if (wasInjected && reason === 'unpublished') {
    const mappings = await prisma.wordPressPageMapping.findMany({
      where: { organizationId: job.organizationId },
    })
    const mapping = pickMapping(mappings, job)
    if (mapping && !mapping.builderBlocked) await renderPageMapping(mapping.id)
  }
  return { ok: true }
}

/**
 * Re-render whichever mapping a given location/service used to match. Used when
 * a job moves (its city/state/service was edited) so its *previous* page stops
 * showing it (design §9.5). The job's new placement is handled separately by
 * syncCheckIn on the same edit.
 */
export async function rerenderMappingForLocation(
  orgId: string,
  loc: { city: string | null; state: string | null; doorType: string | null }
): Promise<void> {
  const mappings = await prisma.wordPressPageMapping.findMany({ where: { organizationId: orgId } })
  const mapping = pickMapping(mappings, loc)
  if (mapping && !mapping.builderBlocked) await renderPageMapping(mapping.id)
}

/**
 * Subscription ended or dropped below Titan: pull everything down.
 * No partial retention — all-or-nothing by design (spec §8).
 */
export async function revokeOrgWordPress(orgId: string): Promise<{ removed: number }> {
  // 1) Standalone posts: delete each post + its media (existing behavior).
  const jobs = await prisma.checkIn.findMany({
    where: { organizationId: orgId, wpPostId: { not: null } },
    select: { id: true },
  })

  let removed = 0
  for (const job of jobs) {
    await unsyncCheckIn(job.id, 'revoked')
    removed++
    await sleep(BULK_DELAY_MS)
  }

  // 2) Injected page blocks: empty each block and mark its jobs 'revoked' so
  //    they auto-restore on a future Titan resubscribe. The customer's pages
  //    themselves are never deleted (design §6).
  const mappings = await prisma.wordPressPageMapping.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  })
  for (const m of mappings) {
    await clearPageMapping(m.id, 'revoked')
    await sleep(BULK_DELAY_MS)
  }
  return { removed }
}

/**
 * Titan resubscribe: restore everything that was ever live under a previous
 * active Titan subscription. No expiry window, no partial restore — a job
 * marked 'revoked' stays eligible indefinitely (spec §8).
 *
 * This is NOT backfill: jobs that were never synced while on Titan are not
 * touched here, which is what keeps the buy-one-month-to-publish-everything
 * loophole closed (spec §6).
 */
export async function restoreOrgWordPress(orgId: string): Promise<{ restored: number }> {
  const ctx = await getOrgContext(orgId)
  if (!ctx) return { restored: 0 }

  const mappings = await prisma.wordPressPageMapping.findMany({
    where: { organizationId: orgId },
  })

  // 1) Recreate standalone posts for revoked jobs that do NOT belong to an
  //    injectable mapping. After a revoke, both post-jobs and injected-jobs
  //    have wpPostId null, so we distinguish by whether they match a mapping.
  const jobs = await prisma.checkIn.findMany({
    where: { organizationId: orgId, wpSyncStatus: 'revoked', isPublic: true },
    select: { id: true, city: true, state: true, doorType: true },
    orderBy: { timestamp: 'asc' },
  })

  let restored = 0
  for (const job of jobs) {
    const m = pickMapping(mappings, job)
    if (m && !m.builderBlocked) continue // injected — restored via block render below
    const res = await syncCheckIn(job.id)
    if (res.ok) restored++
    await sleep(BULK_DELAY_MS)
  }

  // 2) Rebuild each injected page block from current jobs (one render per
  //    mapping restores all of its jobs at once, flipping them back to synced).
  for (const m of mappings) {
    if (m.builderBlocked) continue
    const r = await renderPageMapping(m.id)
    restored += r.rendered
    await sleep(BULK_DELAY_MS)
  }
  return { restored }
}

/** True when this org currently has a live WordPress connection. */
export async function hasActiveWordPressConnection(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { wpConnectionStatus: true },
  })
  return org?.wpConnectionStatus === 'connected'
}

// ── Phase 3b: existing-page injection ────────────────────────────────────────

/** One compact job card for an injected page block (design §4): lead photo,
 *  heading, location, description, and a link to the full PCK job page. No
 *  injected JS/CSS — renders in any theme and stays crawlable/indexable. */
function renderJobCard(
  job: JobRecord,
  media: SyncedMedia[],
  baseUrl: string,
  org: OrgContext['org'],
  siteUrl: string
): string {
  const alt = jobTitle(job)
  const before = media.find((m) => m.role === 'before') ?? null
  const after = media.find((m) => m.role === 'after') ?? null
  const gallery = media.filter((m) => m.role === 'gallery')
  const place = [job.city?.trim(), job.state?.trim()].filter(Boolean).join(', ')
  const desc = jobDescription(job)

  const citySlug = slugify(job.city || '')
  const stateSlug = slugify(job.state || '')
  const doorTypeSlug = slugify(job.doorType || 'job')
  const jobSlug = org.slug ? `${doorTypeSlug}-${org.slug}-${job.id}` : `${doorTypeSlug}-${job.id}`
  const pckUrl = `${baseUrl}/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${jobSlug}`

  const parts: string[] = ['<div class="projectcheckin-job">']
  parts.push(`<h3>${escapeHtml(alt)}</h3>`)

  // Same full photo treatment as a standalone post — every photo carries its
  // own SEO value (alt text, filename), so none of it should be left behind
  // on ProjectCheckin's own domain when it could be on the customer's.
  if (before && after) {
    parts.push(
      `<figure class="wp-block-columns" style="display:flex;gap:16px;flex-wrap:wrap">` +
        `<div style="flex:1 1 240px"><p><strong>Before</strong></p>${photoHtml(before, `${alt} — before`)}</div>` +
        `<div style="flex:1 1 240px"><p><strong>After</strong></p>${photoHtml(after, `${alt} — after`)}</div>` +
        `</figure>`
    )
  } else if (after) {
    parts.push(photoHtml(after, alt))
  } else if (before) {
    parts.push(photoHtml(before, alt))
  }
  for (const p of gallery) parts.push(`<figure>${photoHtml(p, alt)}</figure>`)

  if (place) parts.push(`<p><strong>Location:</strong> ${escapeHtml(place)}</p>`)
  if (desc) parts.push(`<p>${escapeHtml(desc)}</p>`)
  parts.push(`<p><a href="${escapeHtml(pckUrl)}">See the full project</a></p>`)
  parts.push(`<script type="application/ld+json">${buildJsonLd(job, org, siteUrl)}</script>`)
  parts.push('</div>')
  return parts.join('\n')
}

/**
 * Re-render one page mapping's injected block from the org's current matching
 * jobs, and write it back between the markers on the customer's existing page.
 * A pure function of (mapping filter, current published jobs) — safe to call
 * whenever a matching job changes. Titan-gated (only runs while entitled).
 */
export async function renderPageMapping(mappingId: string): Promise<{ rendered: number }> {
  const mapping = await prisma.wordPressPageMapping.findUnique({ where: { id: mappingId } })
  if (!mapping) return { rendered: 0 }
  // Builder pages can't be reliably injected — their jobs go through the post
  // path instead (design §9.1), so there's nothing to render here.
  if (mapping.builderBlocked) return { rendered: 0 }

  const ctx = await getOrgContext(mapping.organizationId)
  if (!ctx) return { rendered: 0 }
  const { creds, org } = ctx
  const pageType = mapping.wpPageType === 'post' ? 'post' : 'page'

  const jobs = await prisma.checkIn.findMany({
    where: {
      organizationId: mapping.organizationId,
      isPublic: true,
      // Never double-publish a job that already has its own standalone post
      // (invariant 3; also enforces design §9.8 — pre-existing posts stay posts).
      wpPostId: null,
      ...(mapping.matchCity ? { city: mapping.matchCity, state: mapping.matchState } : {}),
      ...(mapping.matchService ? { doorType: mapping.matchService } : {}),
    },
    orderBy: { timestamp: 'desc' },
    take: PAGE_JOB_CAP,
    select: JOB_SELECT,
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')

  const cards: string[] = []
  for (const job of jobs) {
    const media = await reconcileJobMedia(creds, job)
    cards.push(renderJobCard(job, media, baseUrl, org, creds.siteUrl))
    await prisma.checkIn.update({
      where: { id: job.id },
      data: {
        wpMedia: media.length ? JSON.stringify(media) : null,
        wpSyncedAt: new Date(),
        wpSyncStatus: 'synced',
      },
    })
  }

  const block = cards.length ? `<h2>Recent Projects</h2>\n${cards.join('\n')}` : ''

  const page = await getPageContent(creds, mapping.wpPageId, pageType)
  if (!page.ok || !page.data) return { rendered: 0 }
  const spliced = spliceBlock(page.data.raw, block)
  const write = await updatePageContent(creds, mapping.wpPageId, pageType, spliced.content)
  if (!write.ok) return { rendered: 0 }

  await prisma.wordPressPageMapping.update({
    where: { id: mapping.id },
    data: { markerMode: spliced.markerMode, lastRenderedAt: new Date() },
  })
  return { rendered: jobs.length }
}

/**
 * Empty one page mapping's injected block and delete the media its jobs put
 * into the customer's Media Library. NEVER deletes the page itself.
 * `reason` decides whether the jobs can auto-restore later:
 *   'unpublished' — mapping removed by the customer; status cleared
 *   'revoked'     — subscription lapsed; jobs stay eligible for restore
 * Bypasses the Titan gate (like unsyncCheckIn) so it works the instant a
 * subscription ends.
 */
export async function clearPageMapping(
  mappingId: string,
  reason: 'unpublished' | 'revoked' = 'unpublished'
): Promise<{ ok: boolean }> {
  const mapping = await prisma.wordPressPageMapping.findUnique({ where: { id: mappingId } })
  if (!mapping) return { ok: true }
  const pageType = mapping.wpPageType === 'post' ? 'post' : 'page'

  // The jobs currently represented in this page's block: matched, injected
  // (no standalone post), with media uploaded.
  const jobs = await prisma.checkIn.findMany({
    where: {
      organizationId: mapping.organizationId,
      wpPostId: null,
      wpMedia: { not: null },
      ...(mapping.matchCity ? { city: mapping.matchCity, state: mapping.matchState } : {}),
      ...(mapping.matchService ? { doorType: mapping.matchService } : {}),
    },
    select: { id: true, wpMedia: true },
  })

  const creds = await getDirectCreds(mapping.organizationId)
  if (creds) {
    // Empty our block from the page (builder pages never had one). The splice
    // rewrites only between our markers — the customer's own content is intact.
    if (!mapping.builderBlocked) {
      const page = await getPageContent(creds, mapping.wpPageId, pageType)
      if (page.ok && page.data) {
        const spliced = spliceBlock(page.data.raw, '')
        await updatePageContent(creds, mapping.wpPageId, pageType, spliced.content)
      }
    }
    for (const job of jobs) {
      for (const m of parseMedia(job.wpMedia)) await deleteMedia(creds, m.id)
    }
  }

  for (const job of jobs) {
    await prisma.checkIn.update({
      where: { id: job.id },
      data: {
        wpMedia: null,
        wpSyncedAt: null,
        wpSyncStatus: reason === 'revoked' ? 'revoked' : null,
      },
    })
  }
  return { ok: true }
}
