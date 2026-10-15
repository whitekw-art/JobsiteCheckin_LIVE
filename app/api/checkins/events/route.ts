import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Stored lowercase. The photo trackers send 'PHOTO_CLICK', so the type is
// lowercased before this check; Reporting reads either case.
const VALID_EVENT_TYPES = new Set(['page_view', 'phone_click', 'website_click', 'photo_click'])

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

    const resolvedEventType = (eventType || 'page_view').toLowerCase()
    if (!VALID_EVENT_TYPES.has(resolvedEventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      )
    }

    await prisma.checkInEvent.create({
      data: {
        checkInId,
        eventType: resolvedEventType,
        metadata: metadata || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error recording check-in event:', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    )
  }
}
