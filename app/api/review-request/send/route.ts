import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getCurrentUser } from '@/lib/auth'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = 'ProjectCheckin <no-reply@projectcheckin.com>'

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, name, message } = await req.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Format HTML body — convert "LINK to Google Business Reviews: https://..." line into an anchor
    const htmlBody = message
      .replace(/\n/g, '<br/>')
      .replace(
        /LINK to Google Business Reviews: (https?:\/\/\S+)/,
        '<a href="$1" style="color:#16a34a;font-weight:600">Leave us a Google review</a>'
      )

    await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: 'Would you mind leaving us a quick Google review?',
      text: message,
      html: `<p style="font-family:sans-serif;font-size:15px;line-height:1.6;color:#1e293b;max-width:480px;margin:0 auto">${htmlBody}</p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error sending review request email:', error)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }
}
