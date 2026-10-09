import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { wpJobDisplayState } from '@/lib/wpStatus'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ checkIns: [] })
    }

    const rawCheckIns = await prisma.checkIn.findMany({
      where: {
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        installer: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        notes: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        doorType: true,
        timestamp: true,
        isPublic: true,
        photoUrls: true,
        featuredPhotoUrl: true,
        homeCustomerName: true,
        homeCustomerPhone: true,
        homeCustomerEmail: true,
        gbpPostUrl: true,
        gbpPostedAt: true,
        gbpPostStatus: true,
        wpSyncStatus: true,
        wpSyncedAt: true,
        wpPostId: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    // WordPress failure indicators apply ONLY to a Titan organization with a
    // stored WordPress connection. Every other organization gets null here and
    // null on every job, so no badge can ever appear for them. Read here, not
    // from the owner-only WordPress route, because ADMIN users see the Job
    // Dashboard too.
    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { planTier: true, wpConnectionStatus: true, wpSiteUrl: true },
    })
    const wpApplies =
      !!org &&
      !!org.wpSiteUrl &&
      tierHasFeature(org.planTier, 'website_integration') &&
      ['connected', 'blocked', 'needs_reconnect'].includes(org.wpConnectionStatus ?? '')
    const wordpress = wpApplies ? { status: org!.wpConnectionStatus } : null
    const now = Date.now()

    const checkIns = rawCheckIns.map(({ wpSyncStatus, wpSyncedAt, wpPostId, ...checkIn }) => ({
      ...checkIn,
      photoUrls: checkIn.photoUrls
        ? checkIn.photoUrls
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean)
        : [],
      // 'failed' | 'syncing' | null. hasWpPost tells the card whether a failed
      // job is a first post ("Not posted") or an edit ("Latest changes not posted").
      wpState: wpApplies ? wpJobDisplayState({ isPublic: checkIn.isPublic, wpSyncStatus, wpSyncedAt }, now) : null,
      hasWpPost: wpPostId != null,
    }))

    return NextResponse.json({ checkIns, wordpress })
  } catch (error) {
    console.error('Error fetching Supabase check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
