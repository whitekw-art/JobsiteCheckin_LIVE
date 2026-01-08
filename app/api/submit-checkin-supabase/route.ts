import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with an organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log('CHECKIN_RAW_BODY', body)
    const {
      installer,
      notes,
      latitude,
      longitude,
      locationSource,
      doorType,
      street,
      city,
      state,
      zip,
      photoUrls = [],
    } = body

    if (!installer || !street || !city || !state) {
      return NextResponse.json(
        { error: 'Installer, street, city, and state are required' },
        { status: 400 }
      )
    }

    const timestamp = new Date().toISOString()

    const photoUrlField = Array.isArray(photoUrls)
      ? photoUrls.map((url: string) => (typeof url === 'string' ? url.trim() : '')).filter(Boolean).join(', ')
      : ''

    const lat = latitude ? parseFloat(latitude) : null
    const lng = longitude ? parseFloat(longitude) : null
    const normalizedLocationSource =
      locationSource === 'EXIF' || locationSource === 'ADDRESS' || locationSource === 'DEVICE'
        ? locationSource
        : null

    const seoTitle =
      doorType && city && state ? `${doorType} in ${city}, ${state}` : null

    const seoDescription =
      doorType && street && city && state
        ? `Installed a ${doorType} at ${street}, ${city}, ${state}.`
        : null

    const dataToCreate = {
      timestamp,
      installer,
      street,
      city,
      state,
      zip,
      photoUrls: photoUrlField || null,
      notes: notes || '',
      latitude: lat,
      longitude: lng,
      locationSource: normalizedLocationSource,
      doorType,
      seoTitle,
      seoDescription,
      organizationId: currentUser.organizationId,
      userId: currentUser.id,
    }
    console.log('CHECKIN_CREATE_DATA', dataToCreate)

    await prisma.checkIn.create({
      data: dataToCreate,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Supabase check-in save failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save check-in' },
      { status: 500 }
    )
  }
}
