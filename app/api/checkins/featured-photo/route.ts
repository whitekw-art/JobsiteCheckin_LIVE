import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { syncCheckIn } from '@/lib/wordpressSync'

// Sets (or clears) which photo is a job's cover photo. Used as the WordPress
// post's featured image and the preview image when the job is shared.
// Send url: null to clear and fall back to automatic selection.
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, url } = (await request.json()) as { id?: string; url?: string | null }
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      select: {
        organizationId: true,
        photoUrls: true,
        beforePhotoUrl: true,
        afterPhotoUrl: true,
        isPublic: true,
      },
    })
    if (!checkIn || checkIn.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only a photo that actually belongs to this job can be its cover.
    if (url) {
      const owned = [
        ...(checkIn.photoUrls ? checkIn.photoUrls.split(',').map((u) => u.trim()) : []),
        checkIn.beforePhotoUrl,
        checkIn.afterPhotoUrl,
      ].filter(Boolean)
      if (!owned.includes(url)) {
        return NextResponse.json({ error: 'That photo is not part of this job' }, { status: 400 })
      }
    }

    await prisma.checkIn.update({
      where: { id },
      data: { featuredPhotoUrl: url || null },
    })

    // Push the new cover image to the customer's WordPress post if it's live.
    if (checkIn.isPublic) {
      after(async () => {
        try {
          await syncCheckIn(id)
        } catch (err) {
          console.error('WordPress resync failed after cover photo change:', err)
        }
      })
    }

    return NextResponse.json({ success: true, featuredPhotoUrl: url || null })
  } catch (error: any) {
    console.error('Error setting featured photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to set cover photo' },
      { status: 500 }
    )
  }
}
