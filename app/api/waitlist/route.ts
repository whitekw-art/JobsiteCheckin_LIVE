import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = 'ProjectCheckin <no-reply@projectcheckin.com>'

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const name = typeof body.name === 'string' ? body.name.trim() : null
    const businessName = typeof body.businessName === 'string' ? body.businessName.trim() : null
    const trade = typeof body.trade === 'string' ? body.trade.trim() : null
    const planInterest = typeof body.planInterest === 'string' ? body.planInterest.trim() : null
    const source = typeof body.source === 'string' ? body.source.trim() : null

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Upsert — silently succeed if already exists (don't reveal whether email was on list)
    await prisma.waitlistEntry.upsert({
      where: { email },
      update: {
        // Update optional fields if provided on re-submission
        ...(name && { name }),
        ...(businessName && { businessName }),
        ...(trade && { trade }),
        ...(planInterest && { planInterest }),
      },
      create: { email, name, businessName, trade, planInterest, source },
    })

    // Add to Resend Audience for broadcast emails
    // Audience ID: set RESEND_WAITLIST_AUDIENCE_ID env var after creating audience in Resend dashboard
    if (process.env.RESEND_WAITLIST_AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          audienceId: process.env.RESEND_WAITLIST_AUDIENCE_ID,
          email,
          firstName: name ?? undefined,
          unsubscribed: false,
        })
      } catch (audienceError) {
        console.error('Resend audience add failed:', audienceError)
      }
    }

    // Send confirmation email (fire and forget — don't fail the request if email fails)
    try {
      const firstName = name ? name.split(' ')[0] : null
      const greeting = firstName ? `Hi ${firstName},` : 'Hi there,'

      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: "You're on the list.",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #ffffff;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px; color: #ffffff;">You're on the list.</h1>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">${greeting}</p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              We're putting the finishing touches on ProjectCheckin — the tool that turns every job your crew completes into a permanent, Google-ranking web page. Automatically.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              When we launch, you'll have <strong style="color: #ffffff;">72 hours</strong> to claim your founding member spot and lock in 50% off forever. We'll email you the moment we go live.
            </p>
            <a href="https://projectcheckin.com" style="display: inline-block; background: #0EA5E9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Learn more
            </a>
            <p style="font-size: 13px; color: #52525b; margin-top: 32px; line-height: 1.5;">
              You're receiving this because you joined the ProjectCheckin waitlist.<br>
              <a href="mailto:support@projectcheckin.com?subject=Unsubscribe&body=Please%20remove%20me%20from%20the%20ProjectCheckin%20waitlist." style="color: #52525b;">Unsubscribe</a>
            </p>
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
