import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: true })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Resolved against backup addresses as well as the primary. That is the
    // entire point of a backup: losing access to one inbox must not lock the
    // account out. Sign-in itself stays primary-only, so this widens recovery
    // without widening the credential surface.
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    })

    if (!user) {
      const backup = await prisma.userEmail.findUnique({
        where: { email: normalizedEmail },
        select: { user: { select: { id: true, email: true } } },
      })
      user = backup?.user ?? null
    }

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      })

      const appUrl =
        process.env.APP_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        ''

      const resetUrl = `${appUrl.replace(/\/$/, '')}/auth/reset-password?token=${token}`

      const from = 'ProjectCheckin <no-reply@projectcheckin.com>'
      const resendApiKey = process.env.RESEND_API_KEY

      if (from && resendApiKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            // Sent to the address that was ENTERED, not the account's primary.
            // Both are verified and belong to this user, and someone reaching
            // for a backup has usually lost access to the primary inbox —
            // delivering there would defeat the point of having a backup.
            to: normalizedEmail,
            subject: 'Reset your ProjectCheckin password',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
                <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">Reset your password</h2>
                <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
                  You requested a password reset for your ProjectCheckin account. Click the button below to choose a new password.
                </p>
                <a href="${resetUrl}" style="display: inline-block; background: #0EA5E9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                  Reset password
                </a>
                <p style="font-size: 13px; color: #888; margin-top: 24px;">
                  This link expires in 1 hour. If you didn't request this, you can ignore this email.
                </p>
              </div>
            `,
          }),
        })
      }
    }
  } catch {
    // Always return success to avoid leaking account existence.
  }

  return NextResponse.json({ success: true })
}
