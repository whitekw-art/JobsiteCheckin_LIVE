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
