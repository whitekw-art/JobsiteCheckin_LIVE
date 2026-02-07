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

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    })

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

      const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL
      const resetUrl = `${appUrl}/auth/reset-password?token=${token}`

      const from = 'Jobsite Check-In (Staging) <no-reply@resend.dev>'
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
            to: user.email,
            subject: 'Reset your Jobsite Check-In password',
            html: `
              <p>You requested a password reset for Jobsite Check-In.</p>
              <p><a href="${resetUrl}">Reset your password</a></p>
              <p>This link expires in 1 hour.</p>
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
