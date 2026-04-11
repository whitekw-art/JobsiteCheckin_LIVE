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

    const body = await request.json()
    const { id, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: { id, organizationId: currentUser.organizationId },
      select: { id: true },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: { notes: typeof notes === 'string' ? notes : '' },
      select: { id: true, notes: true },
    })

    return NextResponse.json({ checkIn: updated })
  } catch (error) {
    console.error('Error updating check-in notes:', error)
    return NextResponse.json({ error: 'Failed to update notes' }, { status: 500 })
  }
}
