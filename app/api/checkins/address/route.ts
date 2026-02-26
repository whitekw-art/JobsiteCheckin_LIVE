import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, street, city, state, zip, latitude, longitude } = body

    if (!id || !street || !city || !state) {
      return NextResponse.json(
        { error: 'Street, city, and state are required' },
        { status: 400 }
      )
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: {
        id,
        organizationId: currentUser.organizationId,
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const updateData: {
      street: string
      city: string
      state: string
      zip: string | null
      latitude?: number | null
      longitude?: number | null
      locationSource: 'ADDRESS'
    } = {
      street,
      city,
      state,
      zip: zip || null,
      locationSource: 'ADDRESS',
    }

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      updateData.latitude = latitude
      updateData.longitude = longitude
    } else if (typeof latitude === 'string' && typeof longitude === 'string') {
      const parsedLat = parseFloat(latitude)
      const parsedLng = parseFloat(longitude)
      if (!Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)) {
        updateData.latitude = parsedLat
        updateData.longitude = parsedLng
      }
    }
    const updated = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: updateData,
      select: {
        id: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        latitude: true,
        longitude: true,
      },
    })

    return NextResponse.json({ checkIn: updated })
  } catch (error) {
    console.error('Error updating check-in address:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}
