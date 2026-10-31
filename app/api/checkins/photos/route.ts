import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { applyPhotoChanges, deleteStoredPhotos, splitPhotoUrls, LAST_PHOTO_ERROR } from '@/lib/jobPhotos'
import { refreshJobAfterEdit } from '@/lib/jobContent'
import { Prisma } from '@prisma/client'
import { parseAltMap } from '@/lib/photoAlt'

// Removes one photo from a job (the Job Dashboard's photo X button). Uses the
// same rules as Edit Check-In: the photo's BEFORE/AFTER tag and cover choice
// are cleared, a published job keeps at least one photo, the WordPress post is
// resynced, and the file is deleted from storage.
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id, url } = (await request.json()) as {
      id?: string
      url?: string
    }

    if (!id || !url) {
      return NextResponse.json(
        { error: 'id and url are required' },
        { status: 400 }
      )
    }

    const checkIn = await prisma.checkIn.findUnique({
      where: { id },
      select: {
        photoUrls: true,
        organizationId: true,
        featuredPhotoUrl: true,
        beforePhotoUrl: true,
        afterPhotoUrl: true,
        isPublic: true,
        city: true,
        state: true,
        doorType: true,
        photoAltText: true,
      },
    })

    if (!checkIn || checkIn.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const change = applyPhotoChanges(
      {
        photoUrls: splitPhotoUrls(checkIn.photoUrls),
        beforePhotoUrl: checkIn.beforePhotoUrl,
        afterPhotoUrl: checkIn.afterPhotoUrl,
        featuredPhotoUrl: checkIn.featuredPhotoUrl,
      },
      { remove: [url] }
    )
    if (!change.ok) {
      return NextResponse.json({ error: change.error }, { status: 400 })
    }
    if (checkIn.isPublic && change.next.photoUrls.length === 0) {
      return NextResponse.json({ error: LAST_PHOTO_ERROR }, { status: 400 })
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: {
        photoUrls: change.next.photoUrls.length ? change.next.photoUrls.join(',') : null,
        beforePhotoUrl: change.next.beforePhotoUrl,
        afterPhotoUrl: change.next.afterPhotoUrl,
        featuredPhotoUrl: change.next.featuredPhotoUrl,
        // The removed photo's description goes with it.
        ...(checkIn.photoAltText && {
          photoAltText: (() => {
            const kept = new Set(change.next.photoUrls)
            const next = Object.fromEntries(Object.entries(parseAltMap(checkIn.photoAltText)).filter(([url]) => kept.has(url)))
            return Object.keys(next).length ? next : Prisma.DbNull
          })(),
        }),
      },
      select: { id: true, photoUrls: true, featuredPhotoUrl: true, beforePhotoUrl: true, afterPhotoUrl: true },
    })

    // Resync the WordPress post (its media reconcile deletes the removed photo
    // from the customer's Media Library), then delete the stored file.
    await refreshJobAfterEdit(id, { city: checkIn.city, state: checkIn.state, doorType: checkIn.doorType })
    after(async () => {
      await deleteStoredPhotos(change.removed, currentUser.organizationId!)
    })

    return NextResponse.json({
      success: true,
      photoUrls: splitPhotoUrls(updated.photoUrls),
      featuredPhotoUrl: updated.featuredPhotoUrl,
      beforePhotoUrl: updated.beforePhotoUrl,
      afterPhotoUrl: updated.afterPhotoUrl,
    })
  } catch (error: any) {
    console.error('Error deleting check-in photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}
