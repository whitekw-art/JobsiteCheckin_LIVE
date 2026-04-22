import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ checkIns: [] })
    }

    const where =
      currentUser.role === 'USER'
        ? { organizationId: currentUser.organizationId, userId: currentUser.id }
        : { organizationId: currentUser.organizationId }

    const rows = await prisma.checkIn.findMany({
      where,
      select: {
        id: true,
        installer: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        doorType: true,
        notes: true,
        timestamp: true,
        isPublic: true,
        photoUrls: true,
        beforePhotoUrl: true,
        afterPhotoUrl: true,
        homeCustomerName: true,
        homeCustomerPhone: true,
        homeCustomerEmail: true,
        locationSource: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { timestamp: 'desc' },
    })

    const checkIns = rows.map((c) => ({
      ...c,
      photoUrls: c.photoUrls
        ? c.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
        : [],
    }))

    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('my-jobs fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
