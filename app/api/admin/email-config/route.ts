import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CONFIG_KEYS = ['followUpEmailDays', 'followUpEmailSubject', 'followUpEmailBody']

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const rows = await prisma.adminConfig.findMany({ where: { key: { in: CONFIG_KEYS } } })
  const config = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  return NextResponse.json({
    followUpEmailDays: config.followUpEmailDays ?? '7',
    followUpEmailSubject: config.followUpEmailSubject ?? 'How did {{businessName}} do? Quick favor if you have a minute',
    followUpEmailBody: config.followUpEmailBody ?? DEFAULT_BODY,
  })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const updates = await request.json()

  for (const key of CONFIG_KEYS) {
    if (key in updates) {
      await prisma.adminConfig.upsert({
        where: { key },
        update: { value: String(updates[key]) },
        create: { key, value: String(updates[key]) },
      })
    }
  }

  return NextResponse.json({ ok: true })
}

const DEFAULT_BODY = `Hi {{firstName}},

We recently completed work at your property in {{jobLocation}} and wanted to follow up to make sure everything looks great.

If you have a minute, an honest Google review would mean the world to {{businessName}} — it helps other homeowners find trusted local contractors.

{{reviewLink}}

Thanks so much for your business. Don't hesitate to reach out if anything needs attention.

— {{businessName}}

---
This email was sent on behalf of {{businessName}} by ProjectCheckin. To stop receiving these emails, reply with "unsubscribe".`
