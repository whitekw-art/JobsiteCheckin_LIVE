import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { checkInId, eventType, metadata } = (await request.json()) as {
      checkInId?: string
      eventType?: string
      metadata?: string
    }

    if (!checkInId) {
      return NextResponse.json(
        { error: 'checkInId is required' },
        { status: 400 }
      )
    }

    await prisma.checkInEvent.create({
      data: {
        checkInId,
        eventType: eventType || 'PAGE_VIEW',
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error recording check-in event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record event' },
      { status: 500 }
    )
  }
}
