import { NextRequest, NextResponse } from 'next/server'
import { expireStaleBusinessInfo, orgsDueForBusinessInfoRefresh, refreshGbpBusinessInfo } from '@/lib/gbpBusinessInfo'

export const runtime = 'nodejs'
export const maxDuration = 60

// Daily: refresh stored Google storefront addresses that are older than 25
// days, then delete any that could not be refreshed within 29 days, to stay
// inside the Business Profile API's 30-day storage limit. Each run handles a
// bounded batch so it finishes well inside the 60-second limit; a large
// customer base is spread over several days, which the 25-day threshold allows.
const BATCH = 40

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 })
  }

  try {
    const ids = await orgsDueForBusinessInfoRefresh(BATCH)
    const outcomes: Record<string, number> = {}
    for (const id of ids) {
      const outcome = await refreshGbpBusinessInfo(id).catch(() => 'failed' as const)
      outcomes[outcome] = (outcomes[outcome] ?? 0) + 1
    }
    const expired = await expireStaleBusinessInfo()
    return NextResponse.json({ checked: ids.length, outcomes, expired })
  } catch (error) {
    console.error('GBP business info refresh failed:', error)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
