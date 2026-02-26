import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN'].includes(currentUser.role)) {
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
      data: { isPublic },
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
