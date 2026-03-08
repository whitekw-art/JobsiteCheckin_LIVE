import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const source = typeof body.source === 'string' ? body.source.trim() : null

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Upsert — silently succeed if already exists
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {},
      create: { email, source },
    })

    // Send confirmation email (fire and forget — don't fail the request if email fails)
    try {
      await resend.emails.send({
        from: 'ProjectCheckin <onboarding@resend.dev>',
        to: email,
        subject: "You're on the list.",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #ffffff;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #ffffff;">You're on the list.</h1>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              We're putting the finishing touches on ProjectCheckin — the tool that turns every job your crew completes into a permanent, Google-ranking web page. Automatically.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              We'll reach out personally when your access is ready.
            </p>
            <a href="https://projectcheckin.com" style="display: inline-block; background: #4f7f62; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Learn more
            </a>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Waitlist confirmation email failed:', emailError)
      // Don't fail the request — email is best-effort
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
