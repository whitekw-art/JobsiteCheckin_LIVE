import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ checkIns: [] })
    }

    const rawCheckIns = await prisma.checkIn.findMany({
      where: {
        userId: currentUser.id,
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
        timestamp: true,
        isPublic: true,
        photoUrls: true,
        doorType: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    const checkIns = rawCheckIns.map((checkIn) => ({
      ...checkIn,
      photoUrls: checkIn.photoUrls
        ? checkIn.photoUrls
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean)
        : [],
    }))

    return NextResponse.json({ checkIns })
  } catch (error) {
    console.error('Error fetching user check-ins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
