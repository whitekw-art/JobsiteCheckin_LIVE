import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = 'ProjectCheckin <no-reply@projectcheckin.com>'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 })
  }

  try {
    // Load config from AdminConfig table
    const configs = await prisma.adminConfig.findMany({
      where: { key: { in: ['followUpEmailDays', 'followUpEmailSubject', 'followUpEmailBody'] } },
    })
    const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))

    const delayDays = parseInt(cfg.followUpEmailDays ?? '7', 10)
    const subject = cfg.followUpEmailSubject ?? 'How did {{businessName}} do? Quick favor if you have a minute'
    const bodyTemplate = cfg.followUpEmailBody ?? DEFAULT_EMAIL_BODY

    // Find eligible check-ins: published ~delayDays ago, homeowner email set, not yet emailed
    const windowEnd = new Date()
    windowEnd.setDate(windowEnd.getDate() - delayDays)
    const windowStart = new Date(windowEnd)
    windowStart.setDate(windowStart.getDate() - 1)

    const eligible = await prisma.checkIn.findMany({
      where: {
        isPublic: true,
        homeCustomerEmail: { not: null },
        followUpEmailSentAt: null,
        publishedAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        homeCustomerName: true,
        homeCustomerEmail: true,
        doorType: true,
        city: true,
        state: true,
        organizationId: true,
        organization: {
          select: { name: true, gbpReviewLink: true, slug: true },
        },
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectcheckin.com'
    let sent = 0
    let failed = 0

    for (const checkIn of eligible) {
      if (!checkIn.homeCustomerEmail || !checkIn.organization) continue

      const businessName = checkIn.organization.name
      const firstName = checkIn.homeCustomerName?.split(' ')[0] ?? 'there'
      const reviewLink = checkIn.organization.gbpReviewLink ?? null
      const jobLocation = [checkIn.city, checkIn.state].filter(Boolean).join(', ')

      const filledSubject = subject.replace('{{businessName}}', businessName)
      const filledBody = bodyTemplate
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{businessName\}\}/g, businessName)
        .replace(/\{\{jobLocation\}\}/g, jobLocation || 'your property')
        .replace(/\{\{reviewLink\}\}/g, reviewLink ?? '')
        .replace(/\{\{hasReviewLink\}\}/g, reviewLink ? 'true' : 'false')

      const html = buildEmailHtml(filledBody, businessName, reviewLink)

      try {
        await resend.emails.send({
          from: FROM_ADDRESS,
          to: checkIn.homeCustomerEmail,
          subject: filledSubject,
          text: filledBody,
          html,
        })

        await prisma.checkIn.update({
          where: { id: checkIn.id },
          data: { followUpEmailSentAt: new Date() },
        })

        sent++
      } catch (err) {
        console.error(`Failed to send follow-up for checkIn ${checkIn.id}:`, err)
        failed++
      }
    }

    return NextResponse.json({ sent, failed, eligible: eligible.length })
  } catch (error) {
    console.error('Cron follow-up-emails error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

const DEFAULT_EMAIL_BODY = `Hi {{firstName}},

We recently completed work at your property in {{jobLocation}} and wanted to follow up to make sure everything looks great.

If you have a minute, an honest Google review would mean the world to {{businessName}} — it helps other homeowners find trusted local contractors.

{{reviewLink}}

Thanks so much for your business. Don't hesitate to reach out if anything needs attention.

— {{businessName}}

---
This email was sent on behalf of {{businessName}} by ProjectCheckin. To stop receiving these emails, reply with "unsubscribe".`

function buildEmailHtml(body: string, businessName: string, reviewLink: string | null): string {
  const paragraphs = body
    .split('\n')
    .map((line) => {
      if (!line.trim()) return ''
      if (reviewLink && line.trim() === reviewLink) {
        return `<p style="text-align:center;margin:24px 0"><a href="${reviewLink}" style="display:inline-block;background:#16a34a;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none">Leave a Google Review</a></p>`
      }
      return `<p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#1e293b">${line}</p>`
    })
    .join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
        <tr><td style="background:#0f1f17;padding:20px 32px">
          <span style="font-size:16px;font-weight:700;color:#fff">ProjectCheckin</span>
          <span style="font-size:13px;color:rgba(255,255,255,0.5);margin-left:8px">on behalf of ${businessName}</span>
        </td></tr>
        <tr><td style="padding:32px">
          ${paragraphs}
        </td></tr>
        <tr><td style="padding:16px 32px;border-top:1px solid #f1f5f9;background:#f8fafc">
          <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5">
            This email was sent on behalf of ${businessName} by ProjectCheckin.<br>
            To stop receiving these emails, reply with "unsubscribe".
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
