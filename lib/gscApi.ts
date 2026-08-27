import { google } from 'googleapis'
import { encryptCredential, decryptCredential, encryptionConfigured } from '@/lib/wpCredentials'

// Google Search Console client for the Reporting tab (Elite + Titan).
//
// Design: docs/plans/2026-07-31-gsc-integration-design.md
//
// Per-customer OAuth: ProjectCheckin owns one OAuth client / consent screen;
// each customer authorizes access to their OWN verified Search Console
// property. We store their refresh token and read search performance on demand
// — there is no cron and no cached copy of their data (see design §2, Option A).
//
// Credential encryption is shared with the WordPress integration
// (lib/wpCredentials.ts). That module is named for its first caller but its
// logic is generic AES-256-GCM, so GSC tokens reuse it rather than introducing
// a second crypto scheme and a second key to manage.
//
// Required env (both staging and production):
//   GOOGLE_OAUTH_CLIENT_ID
//   GOOGLE_OAUTH_CLIENT_SECRET
//   WP_CREDENTIAL_ENCRYPTION_KEY  (shared — already set for WordPress)

/** Read-only Search Console access. Google classifies this as non-sensitive. */
export const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'

/**
 * httpOnly cookie holding `<orgId>:<state>` for the duration of the handshake.
 * Both halves are checked on callback: the state defeats CSRF, and the orgId
 * ensures the code is applied to the same organization that started the flow.
 */
export const GSC_STATE_COOKIE = 'pck_gsc_oauth_state'

/** Default reporting window. Search Console data lags ~2-3 days regardless. */
const DEFAULT_WINDOW_DAYS = 28

/** How many rows to show in the Top Queries / Top Pages tables. */
const TOP_ROW_LIMIT = 5

/**
 * Hard ceiling on any one Google call. The Reporting page renders on the
 * server, so an unbounded request would hold the whole page open behind
 * Google's latency. Failing fast and showing the not-connected state beats
 * making every customer wait on a bad day at Google.
 */
const REQUEST_TIMEOUT_MS = 8000

export interface GscTotals {
  clicks: number
  impressions: number
  /** Average position across the window. Lower is better; 0 when no data. */
  position: number
}

export interface GscRow {
  key: string
  clicks: number
  impressions: number
}

export interface GscPerformance {
  totals: GscTotals
  topQueries: GscRow[]
  topPages: GscRow[]
  /** ISO dates describing the window actually requested. */
  startDate: string
  endDate: string
}

export interface GscResult<T> {
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

/** True when the app is configured to do GSC OAuth at all. */
export function gscConfigured(): boolean {
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
 * Derived from NEXT_PUBLIC_APP_URL (the app's existing convention for absolute
 * URLs, already set per-environment) rather than from the incoming request, so
 * the consent step and the token exchange are guaranteed to send byte-identical
 * values. Deriving it from a request origin would break the moment a customer
 * reached the app over a Vercel alias instead of the canonical domain.
 */
export function gscRedirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
  return `${base}/api/organization/gsc/callback`
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
  return oauthClient(gscRedirectUri()).generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [GSC_SCOPE],
    state,
    include_granted_scopes: true,
  })
}

export interface GscTokens {
  /** Encrypted, ready to store. */
  accessToken: string | null
  /** Encrypted, ready to store. */
  refreshToken: string | null
}

/** Exchange the one-time code from Google's callback for stored-ready tokens. */
export async function exchangeCode(code: string): Promise<GscResult<GscTokens>> {
  try {
    const { tokens } = await oauthClient(gscRedirectUri()).getToken(code)
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
    console.error('GSC: code exchange failed', err)
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
 * Every Search Console property this account has VERIFIED ownership of.
 *
 * OAuth alone grants nothing here: a customer who has never verified a site in
 * Search Console authorizes successfully and gets an empty list. That is the
 * expected "no verified property" path, not an error (design §2 step 5).
 *
 * Only fully-verified properties are returned — Google reports unverified ones
 * with a permission level of 'siteUnverifiedUser', and those carry no data.
 */
export async function listProperties(
  encryptedRefresh: string,
  encryptedAccess: string | null
): Promise<GscResult<string[]>> {
  const auth = authorizedClient(encryptedRefresh, encryptedAccess)
  if (!auth) return { ok: false, needsReconnect: true, error: 'Your Google connection needs to be set up again.' }

  try {
    const res = await google.searchconsole({ version: 'v1', auth }).sites.list({}, { timeout: REQUEST_TIMEOUT_MS })
    const properties = (res.data.siteEntry ?? [])
      .filter((s) => s.permissionLevel && s.permissionLevel !== 'siteUnverifiedUser')
      .map((s) => s.siteUrl)
      .filter((u): u is string => Boolean(u))
    return { ok: true, data: properties }
  } catch (err) {
    return { ok: false, ...classify(err, 'We could not read your Search Console websites.') }
  }
}

/**
 * Totals, top queries, and top pages for one property.
 *
 * The three calls are issued in PARALLEL — they are independent, and running
 * them in sequence would stack three round trips onto a page load that a
 * customer is waiting on.
 */
export async function fetchPerformance(
  encryptedRefresh: string,
  encryptedAccess: string | null,
  propertyUrl: string,
  windowDays: number = DEFAULT_WINDOW_DAYS
): Promise<GscResult<GscPerformance>> {
  const auth = authorizedClient(encryptedRefresh, encryptedAccess)
  if (!auth) return { ok: false, needsReconnect: true, error: 'Your Google connection needs to be set up again.' }

  const { startDate, endDate } = windowFor(windowDays)
  const api = google.searchconsole({ version: 'v1', auth })

  const query = (dimensions: string[], rowLimit: number) =>
    api.searchanalytics.query(
      {
        siteUrl: propertyUrl,
        requestBody: { startDate, endDate, dimensions, rowLimit },
      },
      { timeout: REQUEST_TIMEOUT_MS }
    )

  try {
    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      query([], 1),
      query(['query'], TOP_ROW_LIMIT),
      query(['page'], TOP_ROW_LIMIT),
    ])

    const totalsRow = totalsRes.data.rows?.[0]
    return {
      ok: true,
      data: {
        totals: {
          clicks: Math.round(totalsRow?.clicks ?? 0),
          impressions: Math.round(totalsRow?.impressions ?? 0),
          position: round1(totalsRow?.position ?? 0),
        },
        topQueries: toRows(queriesRes.data.rows),
        topPages: toRows(pagesRes.data.rows),
        startDate,
        endDate,
      },
    }
  } catch (err) {
    return { ok: false, ...classify(err, 'We could not load your Search Console data.') }
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
    console.warn('GSC: token revoke failed (continuing with local disconnect)', err)
  }
}

function toRows(rows: Array<{ keys?: string[] | null; clicks?: number | null; impressions?: number | null }> | undefined | null): GscRow[] {
  return (rows ?? []).map((r) => ({
    key: r.keys?.[0] ?? '',
    clicks: Math.round(r.clicks ?? 0),
    impressions: Math.round(r.impressions ?? 0),
  }))
}

/**
 * Search Console expects plain YYYY-MM-DD and holds roughly 16 months of data.
 * The window ends today: Google simply returns nothing for the most recent
 * couple of days rather than erroring, so there is no need to offset it.
 */
function windowFor(days: number): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  return { startDate: iso(start), endDate: iso(end) }
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Turn a Google API error into something a customer can act on.
 *
 * 401 means the grant is gone — revoked from the customer's own Google
 * account, expired, or invalidated because a sibling integration sharing this
 * OAuth client was disconnected. That needs a reconnect, not a retry.
 *
 * NARROWED to 401 only, 2026-08-27. This previously also treated 403 as
 * "reconnect". Google returns 403 both for quota exhaustion and for a property
 * the account can no longer read, neither of which is the grant itself being
 * gone. Since `needsReconnect` now persists to the database and flips the
 * customer's connection card, a false positive is worse than a retryable
 * error, so 403 falls through to the generic path.
 */
function classify(err: unknown, fallback: string): { error: string; needsReconnect?: boolean } {
  const status = (err as { code?: number; status?: number })?.code ?? (err as { status?: number })?.status
  if (status === 401) {
    console.warn('GSC: authorization rejected', status)
    return { error: 'Your Google connection is no longer active. Please connect again.', needsReconnect: true }
  }
  if (status === 403) {
    console.warn('GSC: request forbidden (quota, or a property this account can no longer read)', status)
    return { error: fallback }
  }
  console.error('GSC: request failed', err)
  return { error: fallback }
}
