import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasFeature } from '@/lib/planVersions'
import { syncCheckIn, unsyncCheckIn } from '@/lib/wordpressSync'

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

    // Free tier: max 5 published pages
    if (isPublic) {
      const org = await prisma.organization.findUnique({
        where: { id: currentUser.organizationId },
        select: { planTier: true, planVersion: true },
      })

      if (!hasFeature(org?.planTier, org?.planVersion, 'job_pages_unlimited')) {
        const publishedCount = await prisma.checkIn.count({
          where: { organizationId: currentUser.organizationId, isPublic: true },
        })
        if (publishedCount >= 5) {
          return NextResponse.json(
            { error: 'Free plan limit reached. Upgrade to publish more than 5 job pages.' },
            { status: 403 }
          )
        }
      }
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
