import { safeFetch, validateSsrfUrl } from '@/lib/ssrf'

// Low-level WordPress REST API client for Phase 3 of Website Integration for
// Local SEO ("the plugin" in customer-facing copy — technically an API
// connection using a customer-generated Application Password, no plugin file).
//
// This module is deliberately prisma-free: it speaks HTTP to a customer's
// WordPress site and nothing else. Orchestration (which job syncs when, and
// what happens on cancellation) lives in lib/wordpressSync.ts.

const TIMEOUT_MS = 15000

export interface WpCredentials {
  siteUrl: string
  username: string
  password: string
}

export interface WpResult<T> {
  ok: boolean
  data?: T
  /** Customer-facing message. Kept to one plain sentence per the design spec. */
  error?: string
  /** True when the failure looks transient (timeout, 5xx) and is worth retrying. */
  transient?: boolean
  /** HTTP status, when a response was actually received. */
  status?: number
}

/** Normalize a customer-entered site URL to a clean https base with no trailing slash. */
export function normalizeSiteUrl(raw: string): string {
  let url = (raw || '').trim()
  if (!url) return ''
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`
  return url.replace(/\/+$/, '')
}

function authHeader(creds: WpCredentials): string {
  // WordPress Application Passwords authenticate over HTTP Basic.
  return `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString('base64')}`
}

/**
 * Authenticated request to a customer's WordPress REST API.
 *
 * Redirects are NOT followed: credentials travel in the Authorization header,
 * and following a redirect could hand them to a host we never validated. The
 * site URL is canonicalized once at connect time instead.
 */
async function wpFetch(
  creds: WpCredentials,
  path: string,
  init: RequestInit = {}
): Promise<WpResult<Response>> {
  const target = `${creds.siteUrl}/wp-json${path}`
  const check = await validateSsrfUrl(target)
  if (!check.ok) return { ok: false, error: 'That website address could not be reached.' }

  try {
    const res = await fetch(target, {
      ...init,
      headers: {
        Authorization: authHeader(creds),
        'User-Agent': 'ProjectCheckin/1.0',
        ...init.headers,
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (res.status >= 300 && res.status < 400) {
      return { ok: false, status: res.status, error: 'That website address could not be reached.' }
    }
    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: res.status, error: 'WordPress rejected the username or Application Password.' }
    }
    if (res.status === 404) {
      return { ok: false, status: 404, error: "We couldn't find the WordPress connection on that site." }
    }
    if (res.status >= 500) {
      return { ok: false, status: res.status, error: 'That website is not responding right now.', transient: true }
    }
    if (!res.ok) {
      return { ok: false, status: res.status, error: 'WordPress refused the request.' }
    }
    return { ok: true, data: res, status: res.status }
  } catch {
    // AbortSignal.timeout and network failures both land here.
    return { ok: false, error: 'That website is not responding right now.', transient: true }
  }
}

async function wpJson<T>(
  creds: WpCredentials,
  path: string,
  init: RequestInit = {}
): Promise<WpResult<T>> {
  const res = await wpFetch(creds, path, init)
  if (!res.ok || !res.data) {
    return { ok: false, error: res.error, transient: res.transient, status: res.status }
  }
  try {
    return { ok: true, data: (await res.data.json()) as T, status: res.status }
  } catch {
    return { ok: false, error: 'WordPress returned an unexpected response.', status: res.status }
  }
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }
}

/**
 * Verify credentials work AND that this user can actually publish.
 * A subscriber-level account authenticates fine but can't create posts, so
 * check capabilities here rather than failing later on the first real job.
 */
export async function testConnection(
  creds: WpCredentials
): Promise<WpResult<{ userId: number; canPublish: boolean }>> {
  const me = await wpJson<{ id: number; capabilities?: Record<string, boolean> }>(
    creds,
    '/wp/v2/users/me?context=edit'
  )
  if (!me.ok || !me.data) return { ok: false, error: me.error, transient: me.transient }

  const canPublish = me.data.capabilities?.publish_posts === true
  if (!canPublish) {
    return {
      ok: false,
      error: 'That WordPress account does not have permission to publish posts.',
    }
  }
  return { ok: true, data: { userId: me.data.id, canPublish } }
}

/** Find a category/tag by exact name, creating it if it doesn't exist yet. */
async function ensureTerm(
  creds: WpCredentials,
  taxonomy: 'categories' | 'tags',
  name: string
): Promise<number | null> {
  const clean = name.trim()
  if (!clean) return null

  const found = await wpJson<Array<{ id: number; name: string }>>(
    creds,
    `/wp/v2/${taxonomy}?search=${encodeURIComponent(clean)}&per_page=100`
  )
  if (found.ok && found.data) {
    const match = found.data.find((t) => t.name.toLowerCase() === clean.toLowerCase())
    if (match) return match.id
  }

  const created = await wpJson<{ id: number }>(
    creds,
    `/wp/v2/${taxonomy}`,
    jsonInit('POST', { name: clean })
  )
  if (created.ok && created.data) return created.data.id

  // A 400 here usually means the term already exists but the search missed it
  // (pagination//accents). Not worth failing the whole publish over.
  return null
}

export async function ensureCategory(creds: WpCredentials, name: string) {
  return ensureTerm(creds, 'categories', name)
}
export async function ensureTag(creds: WpCredentials, name: string) {
  return ensureTerm(creds, 'tags', name)
}

/**
 * Upload one image into the customer's Media Library so the file is genuinely
 * hosted on their domain (image-search credit follows the host).
 * `filename` should be SEO-descriptive, not a raw UUID.
 */
export async function uploadMedia(
  creds: WpCredentials,
  sourceUrl: string,
  filename: string,
  altText: string
): Promise<WpResult<{ id: number; sourceUrl: string }>> {
  // Must go through safeFetch, not a bare fetch: a photo URL can reach this
  // point from client-supplied input (appendPhotoUrls on the check-in update
  // route), so validating only the first URL would let a public host redirect
  // us to an internal address whose response we'd then upload to the
  // customer's Media Library. safeFetch re-validates every redirect hop.
  let bytes: ArrayBuffer
  let contentType: string
  try {
    const src = await safeFetch(sourceUrl)
    if (!src || !src.ok) return { ok: false, error: 'Could not read that photo.', transient: true }
    contentType = src.headers.get('content-type') || 'image/jpeg'
    // Only ever forward real images — never an HTML error page or a JSON
    // credential blob that happened to sit behind the URL.
    if (!contentType.toLowerCase().startsWith('image/')) {
      return { ok: false, error: 'Could not read that photo.' }
    }
    bytes = await src.arrayBuffer()
  } catch {
    return { ok: false, error: 'Could not read that photo.', transient: true }
  }

  const created = await wpJson<{ id: number; source_url: string }>(creds, '/wp/v2/media', {
    method: 'POST',
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: Buffer.from(bytes),
  })
  if (!created.ok || !created.data) {
    return { ok: false, error: created.error, transient: created.transient }
  }

  // Alt text is a separate write — it's real on-page SEO content, but a
  // failure here shouldn't discard a photo that uploaded fine.
  await wpJson(creds, `/wp/v2/media/${created.data.id}`, jsonInit('POST', { alt_text: altText }))

  return { ok: true, data: { id: created.data.id, sourceUrl: created.data.source_url } }
}

/** Media has no trash state in WordPress — deletion is always permanent. */
export async function deleteMedia(creds: WpCredentials, mediaId: number): Promise<void> {
  await wpFetch(creds, `/wp/v2/media/${mediaId}?force=true`, { method: 'DELETE' })
}

export interface WpPostInput {
  title: string
  content: string
  excerpt: string
  slug: string
  categoryIds: number[]
  tagIds: number[]
  featuredMediaId?: number | null
  /** Meta title/description for Yoast, when installed. Best-effort. */
  seoTitle: string
  seoDescription: string
}

export async function createPost(
  creds: WpCredentials,
  input: WpPostInput
): Promise<WpResult<{ id: number; link: string }>> {
  const res = await wpJson<{ id: number; link: string }>(
    creds,
    '/wp/v2/posts',
    jsonInit('POST', {
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      slug: input.slug,
      status: 'publish',
      categories: input.categoryIds,
      tags: input.tagIds,
      ...(input.featuredMediaId ? { featured_media: input.featuredMediaId } : {}),
    })
  )
  if (!res.ok || !res.data) return { ok: false, error: res.error, transient: res.transient }

  await setSeoMeta(creds, res.data.id, input.seoTitle, input.seoDescription)
  return { ok: true, data: { id: res.data.id, link: res.data.link } }
}

export async function updatePost(
  creds: WpCredentials,
  postId: number,
  input: WpPostInput
): Promise<WpResult<{ id: number; link: string }>> {
  const res = await wpJson<{ id: number; link: string }>(
    creds,
    `/wp/v2/posts/${postId}`,
    jsonInit('POST', {
      title: input.title,
      content: input.content,
      excerpt: input.excerpt,
      categories: input.categoryIds,
      tags: input.tagIds,
      ...(input.featuredMediaId ? { featured_media: input.featuredMediaId } : {}),
    })
  )
  if (!res.ok || !res.data) return { ok: false, error: res.error, transient: res.transient }

  await setSeoMeta(creds, postId, input.seoTitle, input.seoDescription)
  return { ok: true, data: { id: res.data.id, link: res.data.link } }
}

/**
 * Best-effort Yoast meta write — no plugin detection.
 *
 * WordPress silently ignores meta keys that aren't registered for REST, so on a
 * site without Yoast this is an inert no-op. On a site with Yoast it makes the
 * job's real title/description drive search snippets instead of Yoast's generic
 * auto-fallback. Deliberately a separate request from post creation so it can
 * never block the post itself from publishing.
 */
async function setSeoMeta(
  creds: WpCredentials,
  postId: number,
  title: string,
  description: string
): Promise<void> {
  try {
    await wpJson(
      creds,
      `/wp/v2/posts/${postId}`,
      jsonInit('POST', {
        meta: { _yoast_wpseo_title: title, _yoast_wpseo_metadesc: description },
      })
    )
  } catch {
    // Never surface — this is an enhancement, not a requirement.
  }
}

/** Permanently delete a post (force=true skips trash — see design spec §8). */
export async function deletePost(creds: WpCredentials, postId: number): Promise<WpResult<null>> {
  const res = await wpFetch(creds, `/wp/v2/posts/${postId}?force=true`, { method: 'DELETE' })
  // Already gone (customer deleted it themselves) is a success for our purposes.
  if (!res.ok && res.status === 404) return { ok: true }
  if (!res.ok) return { ok: false, error: res.error, transient: res.transient }
  return { ok: true }
}

// ── Phase 3b: existing-page injection ────────────────────────────────────────
// Reading and marker-safe writing of a customer's own already-existing pages.
// Unlike posts (which we create and may delete), these pages belong to the
// customer — we only ever rewrite the slice between our own markers, and never
// delete the page. The splice itself lives in lib/wordpressSync.ts; this module
// only does the raw read/write and a best-effort page-builder probe.

export interface WpPageRef {
  id: number
  type: 'page' | 'post'
  /** True when a page builder is detected — injection is unreliable, so the
   *  caller falls back to creating a normal post instead (design §9.1). */
  builder: boolean
}

interface WpObjectProbe {
  id: number
  meta?: Record<string, unknown> | unknown[]
  content?: { raw?: string; rendered?: string }
}

// Rendered/stored markup fragments that reliably indicate a page builder.
// Best-effort by nature — builders change over time, so this is a heuristic
// that fails safe (a miss just means we attempt injection, which either works
// or visibly does nothing; a hit routes the customer to the post fallback).
const BUILDER_SIGNALS = [
  'data-elementor-type', 'elementor-widget', 'elementor-element', // Elementor
  'et_pb_', // Divi
  'vc_row', '[vc_row', 'wpb_wrapper', // WPBakery
]

function detectBuilder(obj: WpObjectProbe): boolean {
  const meta = obj.meta && !Array.isArray(obj.meta) ? (obj.meta as Record<string, unknown>) : {}
  if (meta._elementor_edit_mode) return true
  const haystack = `${obj.content?.raw ?? ''}${obj.content?.rendered ?? ''}`
  return BUILDER_SIGNALS.some((sig) => haystack.includes(sig))
}

/**
 * Resolve a customer-pasted page URL to a WordPress object id + type, and probe
 * whether it was built with a page builder. Rejects URLs that aren't on the
 * connected site. Tries Pages first (the common case), then Posts used as
 * landing pages.
 */
export async function resolvePageByUrl(
  creds: WpCredentials,
  pageUrl: string
): Promise<WpResult<WpPageRef>> {
  let slug: string
  try {
    const target = new URL((pageUrl || '').trim())
    const site = new URL(creds.siteUrl)
    if (target.host.replace(/^www\./, '') !== site.host.replace(/^www\./, '')) {
      return { ok: false, error: 'That URL is not on your connected site.' }
    }
    const segments = target.pathname.split('/').filter(Boolean)
    slug = decodeURIComponent(segments[segments.length - 1] || '')
  } catch {
    return { ok: false, error: 'That does not look like a valid page address.' }
  }
  if (!slug) return { ok: false, error: 'Add the full page URL, including the page name.' }

  for (const rest of ['pages', 'posts'] as const) {
    const found = await wpJson<Array<{ id: number }>>(
      creds,
      `/wp/v2/${rest}?slug=${encodeURIComponent(slug)}&_fields=id&context=edit`
    )
    if (found.ok && found.data && found.data.length > 0) {
      const id = found.data[0].id
      const type = rest === 'pages' ? 'page' : 'post'
      const probe = await wpJson<WpObjectProbe>(
        creds,
        `/wp/v2/${rest}/${id}?context=edit&_fields=id,meta,content`
      )
      const builder = probe.ok && probe.data ? detectBuilder(probe.data) : false
      return { ok: true, data: { id, type, builder } }
    }
    // A transient failure shouldn't be reported as "page not found".
    if (!found.ok && found.transient) return { ok: false, error: found.error, transient: true }
  }
  return { ok: false, error: "We couldn't find that page on your site. Paste the exact page URL." }
}

/** Read a page/post's raw (unrendered) content — the source we splice into. */
export async function getPageContent(
  creds: WpCredentials,
  pageId: number,
  type: 'page' | 'post'
): Promise<WpResult<{ raw: string }>> {
  const rest = type === 'page' ? 'pages' : 'posts'
  const res = await wpJson<{ content?: { raw?: string } }>(
    creds,
    `/wp/v2/${rest}/${pageId}?context=edit&_fields=content`
  )
  if (!res.ok || !res.data) return { ok: false, error: res.error, transient: res.transient }
  return { ok: true, data: { raw: res.data.content?.raw ?? '' } }
}

/**
 * Write a page/post's full content back. The caller has already spliced the new
 * block into the existing content between our markers, so this only ever sends
 * the `content` field — nothing else about the customer's page is touched.
 */
export async function updatePageContent(
  creds: WpCredentials,
  pageId: number,
  type: 'page' | 'post',
  fullContent: string
): Promise<WpResult<null>> {
  const rest = type === 'page' ? 'pages' : 'posts'
  const res = await wpJson<{ id: number }>(
    creds,
    `/wp/v2/${rest}/${pageId}`,
    jsonInit('POST', { content: fullContent })
  )
  if (!res.ok || !res.data) return { ok: false, error: res.error, transient: res.transient }
  return { ok: true }
}
