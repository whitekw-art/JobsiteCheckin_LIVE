import crypto from 'crypto'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { escapeHtml } from '@/lib/emailValidation'

/**
 * Shared helpers for the Sign-In & Security card (Account → General).
 *
 * Scope decision, taken deliberately: backup addresses are for RECOVERY ONLY.
 * Sign-in stays primary-only, so `authorize()` in lib/auth-config.ts is
 * untouched and the credential surface does not widen. Letting any verified
 * address sign in would also multiply the login rate limit, which is keyed on
 * the submitted address — an attacker would get five attempts per address
 * rather than five in total.
 */

/** Verification links are deliberately short-lived. */
export const EMAIL_TOKEN_TTL_MS = 10 * 60 * 1000

/** How many backup addresses one account may hold. */
export const MAX_BACKUP_EMAILS = 5

export type EmailChangePurpose = 'primary' | 'backup'

export { escapeHtml, normalizeEmail } from '@/lib/emailValidation'


/**
 * True when the address is already spoken for, as a primary OR a backup, on
 * ANY account. No database constraint can span both tables, so every write path
 * has to ask this first — otherwise one address could end up able to recover
 * two different accounts.
 */
export async function emailIsTaken(email: string, exceptUserId?: string): Promise<boolean> {
  const [user, backup] = await Promise.all([
    prisma.user.findUnique({ where: { email }, select: { id: true } }),
    prisma.userEmail.findUnique({ where: { email }, select: { userId: true } }),
  ])
  if (user && user.id !== exceptUserId) return true
  if (backup && backup.userId !== exceptUserId) return true
  // Held by this same user: still a duplicate, just a harmless one.
  return Boolean(user) || Boolean(backup)
}

/** Confirms the caller knows the current password before anything changes. */
export async function verifyCurrentPassword(userId: string, password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || password.length === 0) return false
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { password: true } })
  if (!user?.password) return false
  return bcrypt.compare(password, user.password)
}

/**
 * Issues a pending change and returns the raw token for the emailed link.
 *
 * Only the SHA-256 hash is stored, so a leaked database cannot be used to
 * complete somebody's pending change. Any earlier pending row for the same
 * user and purpose is cleared first, so a second request silently invalidates
 * the first rather than leaving two live links.
 */
export async function createPendingEmailChange(
  userId: string,
  newEmail: string,
  purpose: EmailChangePurpose
): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  await prisma.pendingEmailChange.deleteMany({ where: { userId, purpose } })
  await prisma.pendingEmailChange.create({
    data: {
      userId,
      newEmail,
      purpose,
      tokenHash,
      expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
    },
  })

  return token
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function appUrl(): string {
  return (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
}

const FROM = 'ProjectCheckin <no-reply@projectcheckin.com>'

/**
 * Best-effort send. A failure here must never fail the request that triggered
 * it: the pending row is already written, and reporting an error would tell
 * the caller nothing they can act on while implying the change did not happen.
 */
async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
  } catch (err) {
    console.error('Account email send failed', subject, err)
  }
}

function shell(heading: string, body: string, footer: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">${heading}</h2>
      ${body}
      <p style="font-size: 13px; color: #888; margin-top: 24px;">${footer}</p>
    </div>
  `
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display: inline-block; background: #0EA5E9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">${label}</a>`
}

export async function sendVerificationEmail(
  to: string,
  token: string,
  purpose: EmailChangePurpose
): Promise<void> {
  const url = `${appUrl()}/auth/verify-email?token=${token}`
  const heading = purpose === 'primary' ? 'Confirm your new sign-in email' : 'Confirm your backup email'
  const lead =
    purpose === 'primary'
      ? 'Confirm this address to start using it to sign in to ProjectCheckin. Until you do, your current sign-in email keeps working and nothing changes.'
      : 'Confirm this address to add it as a backup on your ProjectCheckin account. Backup addresses can receive password reset links, so you are never locked out if you lose access to your main inbox.'

  await send(
    to,
    heading,
    shell(
      heading,
      `<p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">${lead}</p>${button(url, 'Confirm this address')}`,
      'This link expires in 10 minutes. If you did not request this, you can ignore this email and nothing will change.'
    )
  )
}

/**
 * Tells the addresses already on the account that something was requested.
 *
 * This is the control that actually stops a session-theft takeover. Proving the
 * attacker owns the inbox they just added tells the real owner nothing; a
 * message arriving at the addresses they already hold is what surfaces it.
 */
export async function notifyExistingAddresses(
  addresses: string[],
  requestedEmail: string,
  purpose: EmailChangePurpose
): Promise<void> {
  const safe = escapeHtml(requestedEmail)
  const what =
    purpose === 'primary'
      ? `a request to change the sign-in email on your ProjectCheckin account to <strong>${safe}</strong>`
      : `a request to add <strong>${safe}</strong> as a backup email on your ProjectCheckin account`

  const html = shell(
    'Security notice',
    `<p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 12px;">We received ${what}.</p>
     <p style="font-size: 15px; color: #444; line-height: 1.6;">If this was you, no action is needed — the change only takes effect once the new address is confirmed.</p>`,
    'If this was not you, change your password immediately and contact support@projectcheckin.com.'
  )

  await Promise.all(addresses.map((to) => send(to, 'Security notice for your ProjectCheckin account', html)))
}

/**
 * Sent when a backup is promoted to the sign-in address. This takes effect
 * immediately, so the notice is the only thing that makes the swap visible to
 * the addresses that were already on the account.
 */
export async function notifyPrimaryPromoted(addresses: string[], newPrimary: string): Promise<void> {
  const safe = escapeHtml(newPrimary)
  const html = shell(
    'Your sign-in email changed',
    `<p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 12px;">The sign-in email for your ProjectCheckin account is now <strong>${safe}</strong>. Use it the next time you sign in.</p>
     <p style="font-size: 15px; color: #444; line-height: 1.6;">Your previous address has been kept as a backup, so it can still be used to reset your password.</p>`,
    'If this was not you, contact support@projectcheckin.com immediately.'
  )
  await Promise.all(addresses.map((to) => send(to, 'Your ProjectCheckin sign-in email changed', html)))
}

export async function sendPasswordChangedNotice(addresses: string[]): Promise<void> {
  const html = shell(
    'Your password was changed',
    '<p style="font-size: 15px; color: #444; line-height: 1.6;">The password on your ProjectCheckin account was just changed.</p>',
    'If this was not you, contact support@projectcheckin.com immediately.'
  )
  await Promise.all(addresses.map((to) => send(to, 'Your ProjectCheckin password was changed', html)))
}

/** Every address that can currently receive notices for this user. */
export async function addressesFor(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, backupEmails: { select: { email: true } } },
  })
  if (!user) return []
  return [user.email, ...user.backupEmails.map((b) => b.email)]
}
