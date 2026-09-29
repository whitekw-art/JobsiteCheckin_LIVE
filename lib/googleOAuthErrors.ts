/**
 * Shared error recognition for the two integrations that sit on our single
 * Google OAuth client (Search Console and Business Profile).
 *
 * Both modules keep their own `classify()` because their fallback copy and
 * their log prefixes differ. The one judgement they must never disagree on is
 * whether a failure means the customer's grant is dead, because that answer is
 * persisted to `gscConnectionStatus` / `gbpConnectionStatus` and drives what
 * the Connections card tells the customer. This module holds that judgement.
 */

/**
 * True when Google rejected the refresh token itself.
 *
 * WHY THIS IS NOT COVERED BY AN HTTP STATUS CHECK — the bug this was written
 * for, found 2026-09-26. A refresh happens against `oauth2.googleapis.com`,
 * which is a different endpoint from the API being called, and it answers a
 * dead refresh token with **400 `invalid_grant`** rather than a 401. Worse,
 * `GaxiosError` only populates `.code` from a transport-level error, so an
 * HTTP failure arrives with `.code` undefined and `.status` 400 — meaning the
 * `code ?? status` check in both `classify()` functions saw neither 401 nor
 * 403 and fell through to the generic retryable path.
 *
 * The visible result was a connection that read green on Account → Connections
 * while every Search Console read on the Reporting tab silently failed, with
 * nothing ever writing `needs_reconnect` to correct the card. Reconnecting
 * fixed it, but only once the customer worked out that they needed to.
 *
 * Scope is deliberately narrow. `invalid_client` and `unauthorized_client`
 * describe OUR client credentials rather than the customer's grant, so they
 * stay on the generic path — a customer cannot fix those by reconnecting, and
 * telling them to try would send them in a circle. This matches the reasoning
 * that narrowed `classify()` to 401 on 2026-08-27.
 */
export function isInvalidGrant(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false

  const data = (err as { response?: { data?: unknown } }).response?.data
  if (data && typeof data === 'object' && (data as { error?: unknown }).error === 'invalid_grant') {
    return true
  }

  // google-auth-library rewrites the message to the JSON body when Google asks
  // for re-authentication (see `refreshTokenNoCache`), so the plain equality
  // check alone would miss that case.
  const message = (err as { message?: unknown }).message
  if (typeof message === 'string') {
    return message === 'invalid_grant' || message.includes('"invalid_grant"')
  }

  return false
}
