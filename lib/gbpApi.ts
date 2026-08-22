import { google } from 'googleapis'
import { encryptCredential, decryptCredential, encryptionConfigured } from '@/lib/wpCredentials'

// Google Business Profile client — connect a customer's listing and publish
// completed jobs to it as Local Posts.
//
// Design: docs/plans/2026-08-21-gbp-auto-posting-design.md
//
// Per-customer OAuth, same shape as the Search Console integration
// (lib/gscApi.ts): ProjectCheckin owns one OAuth client / consent screen and
// each customer authorizes access to their OWN Business Profile. Token
// encryption reuses lib/wpCredentials.ts — generic AES-256-GCM despite the
// WordPress-flavoured name, already shared with GSC.
//
// ── THE ONE THING THAT SURPRISES PEOPLE HERE ──
// "The Business Profile API" is not one API. Listing accounts and locations run
// on the modern v1 services, which DO have generated clients in googleapis:
//   google.mybusinessaccountmanagement('v1')      → accounts.list
//   google.mybusinessbusinessinformation('v1')    → accounts.locations.list
// Creating a post still lives on the legacy v4 service, which has NO generated
// client at all (verified against googleapis@144 — there is no `google.mybusiness`).
// So createLocalPost is a hand-rolled fetch against mybusiness.googleapis.com/v4
// with a bearer token. That is expected, not a workaround to be "fixed" later.
//
// Required env (both staging and production):
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET      (shared with GSC — one client, many scopes)
//   WP_CREDENTIAL_ENCRYPTION_KEY    (shared — already set for WordPress + GSC)

/**
 * One scope covers account listing, location listing, and posting.
 *
 * Confirmed non-sensitive in the Cloud Console on 2026-08-21, so publishing the
 * consent screen needed no Google verification review — same easy path GSC took.
 * Do not upload an App logo on the Branding page: that forces a review
 * regardless of scope classification.
 */
export const GBP_SCOPE = 'https://www.googleapis.com/auth/business.manage'

/**
 * httpOnly cookie holding `<orgId>:<state>` for the duration of the handshake.
 * Both halves are checked on callback: the state defeats CSRF, and the orgId
 * ensures the code is applied to the same organization that started the flow.
 */
export const GBP_STATE_COOKIE = 'pck_gbp_oauth_state'

/** Legacy v4 host — the only place Local Posts can be created. */
const V4_BASE = 'https://mybusiness.googleapis.com/v4'

/**
 * Hard ceiling on any one Google call. Posting happens behind a button the
 * customer is watching, so failing fast and offering a retry beats leaving a
 * spinner running on a bad day at Google.
 */
const REQUEST_TIMEOUT_MS = 10000

/**
 * Target length for post text. Google's own limit is 1,500 characters, but
 * 150-300 is the range that actually performs on a listing — long posts get
 * truncated behind a "more" link in the panel.
 */
const SUMMARY_TARGET_CHARS = 300

export interface GbpLocation {
  /** Resource name, e.g. "locations/12345678901234567890". */
  name: string
  /** Account this location hangs off, e.g. "accounts/123456789". */
  accountName: string
  /** Human label for the picker — business title plus locality when available. */
  title: string
}

export interface GbpPostResult {
  /** Resource name of the created post. */
  name: string
  /** Public Google link to the post, when Google returns one. */
  searchUrl: string | null
}

export interface GbpResult<T> {
  ok: boolean
  data?: T
  /** Customer-facing message — one plain sentence, no API jargon. */
  error?: string
  /**
   * True when the stored credentials no longer work (revoked on Google's side,
   * key rotated, tampered ciphertext). Callers should surface "reconnect",
   * not a generic failure.
   */
  needsReconnect?: boolean
}

/** True when the app is configured to do GBP OAuth at all. */
export function gbpConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    encryptionConfigured()
  )
}

/**
 * Absolute callback URL. Must match a redirect URI registered on the OAuth
 * client EXACTLY — Google compares full strings, not hosts.
 *
 * Derived from NEXT_PUBLIC_APP_URL rather than the incoming request so the
 * consent step and the token exchange always send byte-identical values. A
 * request-derived origin would break the moment someone reached the app over a
 * Vercel alias instead of the canonical domain.
 */
export function gbpRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
  return `${base}/api/organization/gbp/callback`
}

/**
 * The redirect URI is only meaningful for the consent + code-exchange steps.
 * Refreshing and revoking a token never use it, so those callers omit it.
 */
function oauthClient(redirectUri?: string) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    redirectUri
  )
}

/**
 * Build the Google consent URL the customer is sent to.
 *
 * `access_type: 'offline'` + `prompt: 'consent'` are both required to reliably
 * receive a refresh token — without them Google returns one only on a user's
 * very first authorization, so a customer who disconnects and reconnects would
 * come back with no refresh token and silently break a few hours later.
 */
export function buildConsentUrl(state: string): string {
  return oauthClient(gbpRedirectUri()).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GBP_SCOPE],
    state,
    include_granted_scopes: true,
  })
}

export interface GbpTokens {
  /** Encrypted, ready to store. */
  accessToken: string | null
  /** Encrypted, ready to store. */
  refreshToken: string | null
}

/** Exchange the one-time code from Google's callback for stored-ready tokens. */
export async function exchangeCode(code: string): Promise<GbpResult<GbpTokens>> {
  try {
    const { tokens } = await oauthClient(gbpRedirectUri()).getToken(code)
    if (!tokens.refresh_token) {
      // Nothing usable long-term — treat as a failed connect rather than
      // storing an access token that expires within the hour.
      return { ok: false, error: 'Google did not return a lasting connection. Please try connecting again.' }
    }
    return {
      ok: true,
      data: {
        accessToken: tokens.access_token ? encryptCredential(tokens.access_token) : null,
        refreshToken: encryptCredential(tokens.refresh_token),
      },
    }
  } catch (err) {
    console.error('GBP: code exchange failed', err)
    return { ok: false, error: 'We could not complete the connection with Google. Please try again.' }
  }
}

/**
 * An authorized client built from a stored refresh token.
 *
 * googleapis refreshes the access token itself when it is missing or expired,
 * which is why the stored access token is an optimization rather than a
 * requirement — a null one costs an extra round trip, nothing more.
 */
function authorizedClient(encryptedRefresh: string, encryptedAccess: string | null) {
  const refreshToken = decryptCredential(encryptedRefresh)
  if (!refreshToken) return null
  const client = oauthClient()
  client.setCredentials({
    refresh_token: refreshToken,
    access_token: decryptCredential(encryptedAccess) ?? undefined,
  })
  return client
}

/**
 * Every business location this Google account can manage, flattened across all
 * of its accounts.
 *
 * OAuth alone grants nothing here: someone who signs in with a personal Gmail
 * authorizes successfully and gets an empty list. That is the expected
 * "no listing on this account" path, not an error — it is by far the most
 * common support case, so it gets its own UI state rather than a failure toast.
 *
 * Locations are fetched per account and the accounts are queried in PARALLEL;
 * most customers have exactly one, but an agency-managed listing can sit under
 * a second account and skipping it would hide their real location.
 */
export async function listLocations(
  encryptedRefresh: string,
  encryptedAccess: string | null
): Promise<GbpResult<GbpLocation[]>> {
  const auth = authorizedClient(encryptedRefresh, encryptedAccess)
  if (!auth) return { ok: false, needsReconnect: true, error: 'Your Google connection needs to be set up again.' }

  try {
    const accountsApi = google.mybusinessaccountmanagement({ version: 'v1', auth })
    const accountsRes = await accountsApi.accounts.list({}, { timeout: REQUEST_TIMEOUT_MS })
    const accounts = (accountsRes.data.accounts ?? [])
      .map((a) => a.name)
      .filter((n): n is string => Boolean(n))

    if (accounts.length === 0) return { ok: true, data: [] }

    const infoApi = google.mybusinessbusinessinformation({ version: 'v1', auth })
    const perAccount = await Promise.all(
      accounts.map(async (accountName) => {
        try {
          const res = await infoApi.accounts.locations.list(
            {
              parent: accountName,
              // readMask is REQUIRED by this API — omitting it is a 400, not a
              // default-everything. storefrontAddress gives the picker enough
              // to tell two same-named locations apart.
              readMask: 'name,title,storefrontAddress',
              pageSize: 100,
            },
            { timeout: REQUEST_TIMEOUT_MS }
          )
          return (res.data.locations ?? []).map((loc) => {
            const locality = loc.storefrontAddress?.locality
            const region = loc.storefrontAddress?.administrativeArea
            const place = [locality, region].filter(Boolean).join(', ')
            return {
              name: loc.name ?? '',
              accountName,
              title: place ? `${loc.title ?? 'Business'} — ${place}` : (loc.title ?? 'Business'),
            }
          }).filter((l) => l.name)
        } catch (err) {
          // One unreadable account (permissions changed, listing suspended)
          // must not blank out the locations the customer CAN see.
          console.warn('GBP: could not list locations for an account', accountName, err)
          return []
        }
      })
    )

    return { ok: true, data: perAccount.flat() }
  } catch (err) {
    return { ok: false, ...classify(err, 'We could not read your Google business listings.') }
  }
}

export interface LocalPostInput {
  /** Post body. Trimmed to ~300 chars by buildPostSummary before it gets here. */
  summary: string
  /** Where the "Learn more" button sends someone. Required — never post without one. */
  linkUrl: string
  /** Public image URL. Google fetches this itself, so it must be reachable. */
  photoUrl?: string | null
}

/**
 * Create a "What's New" Local Post on the customer's listing.
 *
 * Hand-rolled fetch because googleapis ships no v4 client (see the file header).
 * The access token is pulled off the authorized client, which refreshes it
 * transparently if the stored one has expired.
 *
 * Worth knowing for support: Google shows a STANDARD post on the profile for
 * 7 days and then moves it to the profile's post archive. That is Google's
 * behavior, not a limit of ours, and customers do ask.
 */
export async function createLocalPost(
  encryptedRefresh: string,
  encryptedAccess: string | null,
  accountId: string,
  locationId: string,
  input: LocalPostInput
): Promise<GbpResult<GbpPostResult>> {
  const auth = authorizedClient(encryptedRefresh, encryptedAccess)
  if (!auth) return { ok: false, needsReconnect: true, error: 'Your Google connection needs to be set up again.' }

  let accessToken: string | null | undefined
  try {
    accessToken = (await auth.getAccessToken()).token
  } catch (err) {
    return { ok: false, ...classify(err, 'We could not reach Google to publish this job.') }
  }
  if (!accessToken) {
    return { ok: false, needsReconnect: true, error: 'Your Google connection is no longer active. Please connect again.' }
  }

  // Both ids arrive as full resource names ("accounts/123", "locations/456").
  // Normalizing here means callers can pass either form without thinking.
  const account = accountId.startsWith('accounts/') ? accountId : `accounts/${accountId}`
  const location = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`

  const body: Record<string, unknown> = {
    languageCode: 'en-US',
    summary: input.summary,
    topicType: 'STANDARD',
    callToAction: { actionType: 'LEARN_MORE', url: input.linkUrl },
  }
  if (input.photoUrl) {
    body.media = [{ mediaFormat: 'PHOTO', sourceUrl: input.photoUrl }]
  }

  try {
    const res = await fetch(`${V4_BASE}/${account}/${location}/localPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!res.ok) {
      const detail = await res.text().catch(() => '')
      if (res.status === 401 || res.status === 403) {
        console.warn('GBP: post rejected, authorization no longer valid', res.status, detail.slice(0, 400))
        return {
          ok: false,
          needsReconnect: true,
          error: 'Your Google connection is no longer active. Please connect again.',
        }
      }
      console.error('GBP: localPosts.create failed', res.status, detail.slice(0, 600))
      return {
        ok: false,
        error:
          res.status === 400
            ? 'Google would not accept this post. Check that the job has a photo and a description.'
            : 'Google could not publish this job right now. Please try again in a few minutes.',
      }
    }

    const json = (await res.json()) as { name?: string; searchUrl?: string }
    return {
      ok: true,
      data: { name: json.name ?? '', searchUrl: json.searchUrl ?? null },
    }
  } catch (err) {
    console.error('GBP: localPosts.create threw', err)
    return { ok: false, error: 'Google could not publish this job right now. Please try again in a few minutes.' }
  }
}

/** Best-effort revoke on disconnect. Never blocks clearing our own copy. */
export async function revokeAccess(encryptedRefresh: string): Promise<void> {
  const refreshToken = decryptCredential(encryptedRefresh)
  if (!refreshToken) return
  try {
    await oauthClient().revokeToken(refreshToken)
  } catch (err) {
    // The customer may have already revoked it from their Google account, which
    // errors here and is not a failure from their point of view.
    console.warn('GBP: token revoke failed (continuing with local disconnect)', err)
  }
}

/**
 * Assemble the post body from what a job already has.
 *
 * Deliberately varies the opening sentence by job id rather than emitting one
 * identical frame on every post from every customer. Google's duplicate
 * detection is aimed at bulk-templated content, and while these are genuinely
 * distinct jobs from unrelated businesses, identical scaffolding across
 * thousands of posts is the one part that would look machine-made. Rotating a
 * handful of natural phrasings costs nothing and removes that.
 */
export function buildPostSummary(job: {
  id: string
  jobType: string
  city?: string | null
  state?: string | null
  description?: string | null
}): string {
  const place = [job.city, job.state].filter(Boolean).join(', ')
  const type = job.jobType || 'Job'

  const openers = place
    ? [
        `${type} completed in ${place}.`,
        `Another ${type.toLowerCase()} finished in ${place}.`,
        `Just wrapped up a ${type.toLowerCase()} in ${place}.`,
        `New ${type.toLowerCase()} project in ${place}.`,
      ]
    : [`${type} completed.`, `Another ${type.toLowerCase()} finished.`, `Just wrapped up a ${type.toLowerCase()}.`]

  // Stable per job: the same job re-posted reads the same, while different jobs
  // spread across the set. A random pick would make retries look inconsistent.
  const opener = openers[hashToIndex(job.id, openers.length)]

  const detail = job.description?.trim()
  const text = detail ? `${opener}\n\n${detail}` : opener
  return truncate(text, SUMMARY_TARGET_CHARS)
}

/** Cheap deterministic index — not security-sensitive, just needs to be stable. */
function hashToIndex(seed: string, buckets: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % buckets
}

/** Trim on a word boundary so a post never ends mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`
}

/**
 * Turn a Google API error into something a customer can act on.
 *
 * 401/403 means the grant is gone (revoked in their Google account, or the
 * listing was un-shared) — that needs a reconnect, not a retry, so it is
 * reported separately from a transient failure.
 */
function classify(err: unknown, fallback: string): { error: string; needsReconnect?: boolean } {
  const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
  if (status === 401 || status === 403) {
    console.warn('GBP: authorization rejected', status)
    return { error: 'Your Google connection is no longer active. Please connect again.', needsReconnect: true }
  }
  console.error('GBP: request failed', err)
  return { error: fallback }
}
