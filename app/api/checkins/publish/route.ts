import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isPublic } = body as { id?: string; isPublic?: boolean }

    if (!id || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'id and isPublic are required' },
        { status: 400 }
      )
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: { isPublic },
    })

    return NextResponse.json({
      success: true,
      checkIn: {
        id: updated.id,
        isPublic: updated.isPublic,
      },
    })
  } catch (error: any) {
    console.error('Error updating check-in publish state:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update publish state' },
      { status: 500 }
    )
  }
}
