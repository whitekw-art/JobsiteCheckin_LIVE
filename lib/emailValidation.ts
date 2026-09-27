/**
 * Email address validation and HTML escaping.
 *
 * Kept dependency-free and separate from the account-email sender so the auth
 * layer can validate a signup address without importing Resend calls, Prisma
 * helpers, or anything else it has no business loading.
 */

/**
 * Escapes a value for interpolation into email HTML.
 *
 * Needed even though `normalizeEmail` now rejects markup characters: these
 * templates are the last point before the message leaves, and they must not
 * depend on every future caller having validated its input first.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Validates and canonicalizes an address.
 *
 * THE CHARACTER RULES ARE A SECURITY CONTROL, not tidiness. The earlier
 * pattern excluded only whitespace and `@`, which let markup through: a
 * submitted "address" of `</p><a/href=https://evil.example>Click</a>x@b.co`
 * satisfied it, and that string was then interpolated into the security notice
 * sent to the victim's existing addresses. The result was an attacker-chosen
 * link inside a genuine, SPF-passing ProjectCheckin email — a credible
 * phishing vector rather than a cosmetic bug. Found by automated review
 * 2026-09-27, before this shipped.
 *
 * RFC 5322 does permit quoted local parts containing some of these characters.
 * No real mail provider issues such addresses, and accepting them here would
 * mean trusting escaping alone in every template forever, so they are refused.
 */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().toLowerCase()
  if (trimmed.length > 254) return null
  // Reject markup, quoting characters, and control characters outright.
  if (/[<>"'&`\\]/.test(trimmed)) return null
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001F\u007F]/.test(trimmed)) return null
  // Non-ASCII is refused for the same reason: it cannot reach these templates
  // without widening what the escaping has to survive.
  if (/[^\x20-\x7E]/.test(trimmed)) return null
  // Structure. The verification link is what actually proves the address
  // works, so this only has to reject nonsense rather than adjudicate RFC 5322.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return null
  return trimmed
}
