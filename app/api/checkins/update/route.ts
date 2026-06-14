import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      installer,
      street,
      city,
      state,
      zip,
      doorType,
      notes,
      appendPhotoUrls,
      beforePhotoUrl,
      afterPhotoUrl,
      homeCustomerName,
      homeCustomerPhone,
      homeCustomerEmail,
      aiDescriptionGeneratedAt,
    } = body as {
      id: string
      installer?: string
      street?: string
      city?: string
      state?: string
      zip?: string
      doorType?: string
      notes?: string
      appendPhotoUrls?: string[]
      beforePhotoUrl?: string | null
      afterPhotoUrl?: string | null
      homeCustomerName?: string | null
      homeCustomerPhone?: string | null
      homeCustomerEmail?: string | null
      aiDescriptionGeneratedAt?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // USER role can only edit their own check-ins
    const where: Record<string, unknown> = {
      id,
      organizationId: currentUser.organizationId,
    }
    if (currentUser.role === 'USER') {
      where.userId = currentUser.id
    }

    const checkIn = await prisma.checkIn.findFirst({
      where,
      select: { id: true, photoUrls: true },
    })
    if (!checkIn) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Append new photo URLs to existing
    const existing = checkIn.photoUrls
      ? checkIn.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []
    const combined = [...existing, ...(appendPhotoUrls ?? [])]

    const updated = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: {
        ...(installer !== undefined && { installer }),
        ...(street !== undefined && { street }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(doorType !== undefined && { doorType }),
        ...(notes !== undefined && { notes }),
        photoUrls: combined.join(','),
        ...(beforePhotoUrl !== undefined && { beforePhotoUrl }),
        ...(afterPhotoUrl !== undefined && { afterPhotoUrl }),
        ...(homeCustomerName !== undefined && { homeCustomerName: homeCustomerName?.trim() || null }),
        ...(homeCustomerPhone !== undefined && { homeCustomerPhone: homeCustomerPhone?.trim() || null }),
        ...(homeCustomerEmail !== undefined && { homeCustomerEmail: homeCustomerEmail?.trim() || null }),
        ...(aiDescriptionGeneratedAt !== undefined && {
          aiDescriptionGeneratedAt: aiDescriptionGeneratedAt ? new Date(aiDescriptionGeneratedAt) : null,
        }),
      },
    })

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('Error updating check-in:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
