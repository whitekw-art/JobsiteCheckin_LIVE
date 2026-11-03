// Sign-in session limits, shared by the NextAuth config (lib/auth-config.ts),
// middleware.ts and the post-checkout restore route. Kept free of prisma and
// Node-only imports so middleware (Edge runtime) can import it.

/**
 * Idle limit. The session cookie expires this long after it was last
 * re-issued. NextAuth re-issues it on every /api/auth/session request, and
 * components/SessionActivity.tsx makes that request while the person is
 * tapping, typing or scrolling, so the limit counts from their last activity.
 */
export const SESSION_IDLE_SECONDS = 30 * 60

/** Absolute limit: signed out this long after signing in, whatever the activity. */
export const SESSION_ABSOLUTE_MS = 12 * 60 * 60 * 1000

/**
 * Activity refreshes the session at most this often. The idle limit is
 * therefore between 28 and 30 minutes after the last activity.
 */
export const SESSION_REFRESH_THROTTLE_MS = 2 * 60 * 1000

/** True when a token's sign-in time (milliseconds) is past the absolute limit. */
export function sessionPastAbsoluteLimit(loginAt: unknown, now: number = Date.now()): boolean {
  return typeof loginAt === 'number' && now - loginAt > SESSION_ABSOLUTE_MS
}
