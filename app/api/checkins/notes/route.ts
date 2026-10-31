import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { refreshJobAfterEdit, findHomeownerName, HOMEOWNER_NAME_ERROR } from '@/lib/jobContent'

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true, isPublic: true, homeCustomerName: true, city: true, state: true, doorType: true },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const nextNotes = typeof notes === 'string' ? notes : ''
    if (checkIn.isPublic && findHomeownerName(nextNotes, checkIn.homeCustomerName)) {
      return NextResponse.json({ error: HOMEOWNER_NAME_ERROR }, { status: 400 })
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: { notes: nextNotes },
      select: { id: true, notes: true },
    })

    // The description is public on a published job; push it to WordPress
    // (this route used to leave the WordPress post stale).
    await refreshJobAfterEdit(checkIn.id, {
      city: checkIn.city,
      state: checkIn.state,
      doorType: checkIn.doorType,
    })

    return NextResponse.json({ checkIn: updated })
  } catch (error) {
    console.error('Error updating check-in notes:', error)
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 })
  }
}
