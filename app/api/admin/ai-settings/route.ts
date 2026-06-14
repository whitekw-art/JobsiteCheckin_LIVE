import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAiConfig, AI_CONFIG_DEFAULTS } from '@/lib/aiConfig'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const config = await getAiConfig()
  return NextResponse.json({ config, defaults: AI_CONFIG_DEFAULTS })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const body = await request.json()

  const updates: Record<string, string> = {}

  if (typeof body.jobDescriptionEnabled === 'boolean') {
    updates['ai_job_description_enabled'] = body.jobDescriptionEnabled ? 'true' : 'false'
  }
  if (typeof body.jobDescriptionPerJobCap === 'number' && body.jobDescriptionPerJobCap > 0) {
    updates['ai_job_description_per_job_cap'] = String(body.jobDescriptionPerJobCap)
  }
  if (typeof body.jobDescriptionDailyOrgCap === 'number' && body.jobDescriptionDailyOrgCap > 0) {
    updates['ai_job_description_daily_org_cap'] = String(body.jobDescriptionDailyOrgCap)
  }
  if (typeof body.websiteScanEnabled === 'boolean') {
    updates['ai_website_scan_enabled'] = body.websiteScanEnabled ? 'true' : 'false'
  }
  if (typeof body.websiteScanCap === 'number' && body.websiteScanCap > 0) {
    updates['ai_website_scan_cap'] = String(body.websiteScanCap)
  }
  if (typeof body.websiteScanWindowDays === 'number' && body.websiteScanWindowDays > 0) {
    updates['ai_website_scan_window_days'] = String(body.websiteScanWindowDays)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
  }

  await Promise.all(
    Object.entries(updates).map(([key, value]) =>
      prisma.adminConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
