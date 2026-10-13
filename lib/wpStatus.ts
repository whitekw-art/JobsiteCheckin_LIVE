// Shared WordPress connection and job-sync status rules. Kept free of prisma
// and of lib/wordpressSync.ts so the dashboard data route, the GBP link picker
// and the sync code can all read the same definitions without import cycles.
//
// Organization.wpConnectionStatus:
//   'connected'        — working connection
//   'blocked'          — connected, but the site answered 403 (security plugin,
//                        firewall, or a user without publishing rights). Syncing
//                        continues; the next successful sync sets 'connected'.
//   'needs_reconnect'  — the saved Application Password was rejected (401,
//                        confirmed by a second check). Syncing is paused until
//                        the customer reconnects.
//   'failed'           — the last connect attempt failed (connect form only)
//   null               — never connected, or disconnected
//
// CheckIn.wpSyncStatus adds 'syncing' — an in-flight claim so the same job can
// never be posted twice at once. A claim older than WP_SYNC_CLAIM_STALE_MS was
// left behind by a crash or timeout and is treated as failed.

export const WP_SYNC_CLAIM_STALE_MS = 5 * 60 * 1000

/** True when syncing is allowed for this connection status. */
export function wpConnectionActive(status: string | null | undefined): boolean {
  return status === 'connected' || status === 'blocked'
}

/**
 * The state the Job Dashboard shows for one job. Only published jobs can be
 * 'failed' — an unpublished job is never flagged, whatever its stored status.
 */
export function wpJobDisplayState(
  job: { isPublic: boolean; wpSyncStatus: string | null; wpSyncedAt: Date | string | null },
  now: number = Date.now()
): 'failed' | 'syncing' | null {
  if (!job.isPublic) return null
  if (job.wpSyncStatus === 'failed') return 'failed'
  if (job.wpSyncStatus === 'syncing') {
    const claimedAt = job.wpSyncedAt ? new Date(job.wpSyncedAt).getTime() : 0
    return now - claimedAt > WP_SYNC_CLAIM_STALE_MS ? 'failed' : 'syncing'
  }
  return null
}

// ── WordPress error codes ────────────────────────────────────────────────────
// Each code is shown to the customer only when its cause is confirmed by what
// WordPress actually answered, and each links to its entry in the WordPress
// guide (/help/guides/wordpress-publish#wp-101 and so on).
//   WP-101 login rejected (a 401, confirmed by a second login check)
//   WP-102 request refused (403)
//   WP-103 host busy or briefly down (429, 5xx, timeout, network failure)
//   WP-104 WordPress answered but did not save, for another reason
//   WP-105 connected account is below Administrator (scripts and maps stripped)
//   WP-106 site address redirects, or WordPress could not be found there
//   WP-201 mapped page built with a page builder (derived from builderBlocked)
export type WpErrorCode = 'WP-101' | 'WP-102' | 'WP-103' | 'WP-104' | 'WP-105' | 'WP-106' | 'WP-201'

export function wpErrorCodeForKind(
  kind: string | undefined,
  opts: { loginConfirmedRejected?: boolean } = {}
): WpErrorCode {
  switch (kind) {
    case 'auth':
      // A single 401 that a second login check does not confirm is not proof
      // the password is dead (a security plugin can briefly lock out logins).
      return opts.loginConfirmedRejected ? 'WP-101' : 'WP-104'
    case 'forbidden':
      return 'WP-102'
    case 'rate_limited':
    case 'server':
    case 'network':
      return 'WP-103'
    case 'unreachable':
    case 'not_found':
      return 'WP-106'
    default:
      return 'WP-104'
  }
}

export function wpErrorGuideHref(code: string): string {
  return `/help/guides/wordpress-publish#${code.toLowerCase()}`
}
