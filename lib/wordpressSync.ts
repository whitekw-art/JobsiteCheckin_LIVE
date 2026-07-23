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
  return (job.seoDescription || job.notes || '').trim()
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

  // Reconcile photos against what we've already uploaded. Matching on the
  // origin URL means a resync re-uses existing Media Library entries (no
  // duplicates), uploads only genuinely new photos, and still rebuilds the
  // full post body — an earlier version dropped every image on resync.
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
    select: { id: true, organizationId: true, wpPostId: true, wpMedia: true },
  })
  if (!job?.organizationId || !job.wpPostId) return { ok: true }

  // Deliberately does NOT go through getOrgContext's Titan gate: revocation has
  // to work at the exact moment a subscription ends, when that gate is already
  // false. Credentials are read directly instead.
  const org = await prisma.organization.findUnique({
    where: { id: job.organizationId },
    select: { wpSiteUrl: true, wpUsername: true, wpApplicationPassword: true },
  })
  const password = decryptCredential(org?.wpApplicationPassword)
  if (org?.wpSiteUrl && org.wpUsername && password) {
    const creds: WpCredentials = {
      siteUrl: org.wpSiteUrl,
      username: org.wpUsername,
      password,
    }
    await deletePost(creds, job.wpPostId)
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
  return { ok: true }
}

/**
 * Subscription ended or dropped below Titan: pull everything down.
 * No partial retention — all-or-nothing by design (spec §8).
 */
export async function revokeOrgWordPress(orgId: string): Promise<{ removed: number }> {
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

  const jobs = await prisma.checkIn.findMany({
    where: { organizationId: orgId, wpSyncStatus: 'revoked', isPublic: true },
    select: { id: true },
    orderBy: { timestamp: 'asc' },
  })

  let restored = 0
  for (const job of jobs) {
    const res = await syncCheckIn(job.id)
    if (res.ok) restored++
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
