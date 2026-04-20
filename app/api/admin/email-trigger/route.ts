import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = 'ProjectCheckin <no-reply@projectcheckin.com>'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const { checkInId } = await request.json()
  if (!checkInId) return NextResponse.json({ error: 'checkInId required' }, { status: 400 })

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      id: true,
      homeCustomerName: true,
      homeCustomerEmail: true,
      doorType: true,
      city: true,
      state: true,
      followUpEmailSentAt: true,
      organization: { select: { name: true, gbpReviewLink: true } },
    },
  })

  if (!checkIn) return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
  if (!checkIn.homeCustomerEmail) return NextResponse.json({ error: 'No customer email on this job' }, { status: 400 })

  const configs = await prisma.adminConfig.findMany({
    where: { key: { in: ['followUpEmailSubject', 'followUpEmailBody'] } },
  })
  const cfg = Object.fromEntries(configs.map((c) => [c.key, c.value]))

  const subject = cfg.followUpEmailSubject ?? 'How did {{businessName}} do? Quick favor if you have a minute'
  const bodyTemplate = cfg.followUpEmailBody ?? DEFAULT_BODY

  const businessName = checkIn.organization?.name ?? 'the contractor'
  const firstName = checkIn.homeCustomerName?.split(' ')[0] ?? 'there'
  const reviewLink = checkIn.organization?.gbpReviewLink ?? null
  const jobLocation = [checkIn.city, checkIn.state].filter(Boolean).join(', ')

  const filledSubject = subject.replace('{{businessName}}', businessName)
  const filledBody = bodyTemplate
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{businessName\}\}/g, businessName)
    .replace(/\{\{jobLocation\}\}/g, jobLocation || 'your property')
    .replace(/\{\{reviewLink\}\}/g, reviewLink ?? '')

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: checkIn.homeCustomerEmail,
    subject: filledSubject,
    text: filledBody,
    html: `<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:520px;margin:0 auto">${filledBody.replace(/\n/g, '<br/>')}</p>`,
  })

  await prisma.checkIn.update({
    where: { id: checkInId },
    data: { followUpEmailSentAt: new Date() },
  })

  return NextResponse.json({ ok: true, sentTo: checkIn.homeCustomerEmail })
}

const DEFAULT_BODY = `Hi {{firstName}},

We recently completed work at your property in {{jobLocation}} and wanted to follow up to make sure everything looks great.

If you have a minute, an honest Google review would mean the world to {{businessName}} — it helps other homeowners find trusted local contractors.

{{reviewLink}}

Thanks so much for your business. Don't hesitate to reach out if anything needs attention.

— {{businessName}}`
