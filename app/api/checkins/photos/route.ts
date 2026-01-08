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
      select: { photoUrls: true, organizationId: true },
    })

    if (!checkIn || checkIn.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const currentUrls = checkIn.photoUrls
      ? checkIn.photoUrls.split(',').map((value) => value.trim()).filter(Boolean)
      : []
    const updatedUrls = currentUrls.filter((value) => value !== url)

    const updated = await prisma.checkIn.update({
      where: { id },
      data: {
        photoUrls: updatedUrls.length ? updatedUrls.join(', ') : null,
      },
      select: { id: true, photoUrls: true },
    })

    const responseUrls = updated.photoUrls
      ? updated.photoUrls.split(',').map((value) => value.trim()).filter(Boolean)
      : []

    return NextResponse.json({ success: true, photoUrls: responseUrls })
  } catch (error: any) {
    console.error('Error deleting check-in photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete photo' },
      { status: 500 }
    )
  }
}

