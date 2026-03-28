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

      const unsubscribeFooter = `
        <p style="font-size: 13px; color: #52525b; margin-top: 32px; line-height: 1.5;">
          You're receiving this because you joined the ProjectCheckin waitlist.<br>
          <a href="mailto:support@projectcheckin.com?subject=Unsubscribe&body=Please%20remove%20me%20from%20the%20ProjectCheckin%20waitlist." style="color: #52525b;">Unsubscribe</a>
        </p>
      `

      // Email 1 — immediate confirmation
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
            ${unsubscribeFooter}
          </div>
        `,
      })

      // Email 2 — Day 3: Data Drop (88% local search stat — Think with Google)
      const day3 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: '88% of local searches end in a call. Here\'s who gets them.',
        scheduledAt: day3,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #ffffff;">
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              Think with Google published research on local search behavior. 88% of people who search for a local service on their smartphone engage with a business within 24 hours.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              That's not traffic. That's a phone ringing.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              The contractors who get those calls have something the ones who don't get them are missing: content for Google to match to the search. Job pages with real location data, photos of completed work, and service details. Pages Google can actually read and rank.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              A website with a contact form and five stock photos isn't enough. Neither is a Google Business Profile with no posts and one photo from three years ago.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              If you want to see where you stand: search "[your trade] [your city]" in an incognito window. Look at the businesses on the first page. Click into their profiles. Count how many job photos they have. That gap between them and you is the gap ProjectCheckin closes automatically.
            </p>
            <p style="font-size: 13px; color: #52525b; line-height: 1.5; margin-bottom: 24px;">
              — Keith<br>
              <em>Source: <a href="https://www.thinkwithgoogle.com/consumer-insights/consumer-trends/local-search-conversion-statistics/" style="color: #52525b;">Think with Google — Local Search Behavior</a></em>
            </p>
            ${unsubscribeFooter}
          </div>
        `,
      })

      // Email 3 — Day 7: Quick Win (GBP 15-minute fix)
      const day7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: 'Fix your Google Business Profile in 15 minutes',
        scheduledAt: day7,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0a0a0a; color: #ffffff;">
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              Your Google Business Profile is the first thing most homeowners see before they call you. Most contractor profiles are missing at least three things that directly affect how often they show up.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 8px;">
              Here's what to check and fix in under 15 minutes:
            </p>
            <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin-bottom: 4px;"><strong>1. Add your service area correctly</strong></p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              Go to your GBP → Edit profile → Service area. Add every city and zip code where you actually work. If this is blank or only shows your business address, you're invisible in every surrounding area.
            </p>
            <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin-bottom: 4px;"><strong>2. Add photos from real completed jobs</strong></p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              At least 10. Google's own data shows businesses with photos receive 42% more requests for directions and 35% more website clicks than those without. Use actual job photos — before/after, finished installs, crew on site. Not stock.
            </p>
            <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin-bottom: 4px;"><strong>3. Fill in every service you offer</strong></p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 16px;">
              Go to Edit profile → Services. List every specific service. Not just "door installation" — "iron door installation," "fiberglass door replacement," "barn door install." These map directly to what people search.
            </p>
            <p style="font-size: 16px; color: #ffffff; line-height: 1.6; margin-bottom: 4px;"><strong>4. Check your business description</strong></p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              It should name your trade, your city, and one thing that makes you worth calling. 750 characters. Most contractors either leave this blank or copy their homepage tagline.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              Do these four things and your profile will outperform 80% of the contractor listings in your area — most of whom have never touched these settings.
            </p>
            <p style="font-size: 13px; color: #52525b; line-height: 1.5; margin-bottom: 24px;">— Keith</p>
            ${unsubscribeFooter}
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Waitlist email sequence failed:', emailError)
      // Don't fail the request — email is best-effort
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
