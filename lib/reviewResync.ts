import { prisma } from '@/lib/prisma'
import { syncCheckIn } from '@/lib/wordpressSync'

/**
 * Rewrite the WordPress posts of published jobs whose linked Google review was
 * linked, unlinked, changed, deleted on Google or erased under the 30-day rule.
 * The ProjectCheckin job page reads the review on each request, so only
 * WordPress needs this. Never throws.
 */
export async function resyncJobsAfterReviewChange(checkInIds: string[]): Promise<void> {
  const ids = [...new Set(checkInIds)]
  if (ids.length === 0) return
  const jobs = await prisma.checkIn
    .findMany({ where: { id: { in: ids }, isPublic: true, wpPostId: { not: null } }, select: { id: true } })
    .catch(() => [])
  for (const job of jobs) {
    await syncCheckIn(job.id).catch((err) => console.error('Review change: WordPress resync failed', job.id, err))
  }
}
