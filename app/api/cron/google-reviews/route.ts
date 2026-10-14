import { NextRequest, NextResponse } from 'next/server'
import { eraseStaleReviewContent, orgsDueForReviewRefresh, refreshOrgReviews } from '@/lib/googleReviews'
import { resyncJobsAfterReviewChange } from '@/lib/reviewResync'

export const runtime = 'nodejs'
export const maxDuration = 60

// Daily: re-read the Google reviews of every Titan organization with a
// connected Business Profile (oldest-checked first, in batches that finish
// inside the 60-second limit), then erase review content not confirmed with
// Google for 29 days (Google's 30-day storage limit), then rewrite the
// WordPress posts of jobs whose linked review changed.
const BATCH = 25
const TIME_BUDGET_MS = 40_000

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse(null, { status: 401 })
  }

  const started = Date.now()
  try {
    const ids = await orgsDueForReviewRefresh(BATCH)
    const outcomes: Record<string, number> = {}
    const changed: string[] = []
    for (const id of ids) {
      if (Date.now() - started > TIME_BUDGET_MS) break
      const result = await refreshOrgReviews(id).catch((err) => {
        console.error('Google review refresh failed:', id, err)
        return { outcome: 'failed' as const, changedCheckInIds: [] as string[] }
      })
      outcomes[result.outcome] = (outcomes[result.outcome] ?? 0) + 1
      changed.push(...result.changedCheckInIds)
    }
    const erased = await eraseStaleReviewContent()
    changed.push(...erased)
    await resyncJobsAfterReviewChange(changed)
    return NextResponse.json({ checked: ids.length, outcomes, erased: erased.length, resynced: new Set(changed).size })
  } catch (error) {
    console.error('Google review refresh run failed:', error)
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 })
  }
}
