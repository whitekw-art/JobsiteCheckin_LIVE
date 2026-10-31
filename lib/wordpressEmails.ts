import { prisma } from '@/lib/prisma'

// Customer notices about the WordPress connection. The wording lives in a
// Resend template so Keith can edit it in Resend's Templates page without a
// code change; this file only chooses who receives it and fills in the
// variables.
//
// Template: "WordPress Reconnect Needed". If it is renamed, unpublished, or a
// variable is added without being passed here, Resend rejects the send — the
// rejection is logged below, never thrown.
const RECONNECT_TEMPLATE = 'wordpress-reconnect-needed-1'
const FROM = 'ProjectCheckin <no-reply@projectcheckin.com>'

/** The site address as customers recognise it, with the https:// prefix and any trailing slash removed. */
function displaySiteAddress(siteUrl: string | null | undefined): string {
  const clean = (siteUrl || '').trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
  return clean || 'your website'
}

/**
 * Tell the organization's owner that ProjectCheckin can no longer log into
 * their WordPress site. Called once, by the sync code, at the moment the
 * connection changes from working to 'needs_reconnect'. Best-effort: a failed
 * send must never fail the sync that triggered it.
 */
export async function sendWordPressReconnectEmail(orgId: string, siteUrl: string | null): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return

  try {
    const owners = await prisma.user.findMany({
      where: { organizationId: orgId, role: 'OWNER' },
      select: { email: true },
    })
    if (owners.length === 0) return

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: owners.map((o) => o.email),
        template: {
          id: RECONNECT_TEMPLATE,
          variables: { SITE_ADDRESS: displaySiteAddress(siteUrl) },
        },
      }),
    })
    if (!res.ok) {
      console.error('WordPress reconnect email rejected by Resend', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.error('WordPress reconnect email failed', err)
  }
}
