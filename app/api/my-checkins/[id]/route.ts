import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Find the check-in and verify ownership
    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        userId: currentUser.id,
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        timestamp: true,
        photoUrls: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    // Enforce 7-day edit window
    if (checkIn.timestamp) {
      const elapsed = Date.now() - new Date(checkIn.timestamp).getTime()
      if (elapsed > EDIT_WINDOW_MS) {
        return NextResponse.json(
          { error: 'Edit window has expired. Contact your manager to make changes.' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { street, city, state, zip, notes, doorType, latitude, longitude, addPhotoUrls, removePhotoUrl } = body

    const updateData: Record<string, any> = {}

    // Address fields
    if (street !== undefined) updateData.street = street
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zip !== undefined) updateData.zip = zip || null

    // Notes and door type
    if (notes !== undefined) updateData.notes = notes
    if (doorType !== undefined) updateData.doorType = doorType

    // Geocoded coordinates (sent from client after geocoding)
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      updateData.latitude = latitude
      updateData.longitude = longitude
      updateData.locationSource = 'ADDRESS'
    }

    // Photo operations
    const currentUrls = checkIn.photoUrls
      ? checkIn.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []

    let updatedUrls = [...currentUrls]

    if (removePhotoUrl && typeof removePhotoUrl === 'string') {
      updatedUrls = updatedUrls.filter((u) => u !== removePhotoUrl)
    }

    if (Array.isArray(addPhotoUrls) && addPhotoUrls.length > 0) {
      const newUrls = addPhotoUrls.filter(
        (u: unknown) => typeof u === 'string' && u.trim() && !updatedUrls.includes(u as string)
      ) as string[]
      updatedUrls = [...updatedUrls, ...newUrls]
    }

    if (removePhotoUrl || (Array.isArray(addPhotoUrls) && addPhotoUrls.length > 0)) {
      updateData.photoUrls = updatedUrls.length ? updatedUrls.join(', ') : null
    }

    const updated = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: updateData,
      select: {
        id: true,
        installer: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        notes: true,
        doorType: true,
        latitude: true,
        longitude: true,
        locationSource: true,
        timestamp: true,
        isPublic: true,
        photoUrls: true,
      },
    })

    return NextResponse.json({
      checkIn: {
        ...updated,
        photoUrls: updated.photoUrls
          ? updated.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
          : [],
      },
    })
  } catch (error: any) {
    console.error('Error updating check-in:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update check-in' },
      { status: 500 }
    )
  }
}
