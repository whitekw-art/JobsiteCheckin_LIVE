import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { syncCheckIn, unsyncCheckIn } from '@/lib/wordpressSync'
import { retractCheckInFromGbp } from '@/lib/gbpSync'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, isPublic } = body as { id?: string; isPublic?: boolean }

    if (!id || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'id and isPublic are required' },
        { status: 400 }
      )
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
      },
      select: { id: true },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: {
        isPublic,
        publishedAt: isPublic ? new Date() : null,
      },
    })

    // Mirror the publish state onto the customer's WordPress site, if they have
    // an active connection. Runs after the response so photo uploads never make
    // the dashboard feel slow; failures are recorded on the job, not thrown.
    after(async () => {
      try {
        if (isPublic) {
          await syncCheckIn(checkIn.id)
        } else {
          await unsyncCheckIn(checkIn.id, 'unpublished')
        }
      } catch (err) {
        console.error('WordPress sync failed after publish toggle:', err)
      }
    })

    // Unpublishing a job also retracts it from Google, if it was posted there —
    // an orphaned Google post pointing at a job page that is no longer public
    // is worse than no post at all. retractCheckInFromGbp is a cheap no-op for
    // the common case of a job that was never posted, so this is safe to call
    // unconditionally on every unpublish rather than checking status first.
    if (!isPublic) {
      after(async () => {
        try {
          const result = await retractCheckInFromGbp(checkIn.id)
          if (!result.ok) {
            // Deliberately left as a live post with our record intact rather
            // than silently forgotten: the job card keeps showing "Posted to
            // Google" with its Remove button, which stays reachable on an
            // unpublished job precisely for this case.
            console.error('GBP retract failed after unpublish, post is still live:', checkIn.id, result.error)
          }
        } catch (err) {
          console.error('GBP retract threw after unpublish:', err)
        }
      })
    }

    return NextResponse.json({
      success: true,
      checkIn: {
        id: updated.id,
        isPublic: updated.isPublic,
      },
    })
  } catch (error) {
    console.error('Error updating check-in publish state:', error)
    return NextResponse.json(
      { error: 'Failed to update publish state' },
      { status: 500 }
    )
  }
}
