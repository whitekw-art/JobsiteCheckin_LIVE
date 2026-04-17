import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function PATCH(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, homeCustomerName, homeCustomerPhone, homeCustomerEmail } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing check-in id' }, { status: 400 })
    }

    // Verify the check-in belongs to this org
    const existing = await prisma.checkIn.findUnique({ where: { id }, select: { organizationId: true } })
    if (!existing || existing.organizationId !== currentUser.organizationId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const updated = await prisma.checkIn.update({
      where: { id },
      data: {
        homeCustomerName: homeCustomerName || null,
        homeCustomerPhone: homeCustomerPhone || null,
        homeCustomerEmail: homeCustomerEmail || null,
      },
      select: {
        id: true,
        homeCustomerName: true,
        homeCustomerPhone: true,
        homeCustomerEmail: true,
      },
    })

    return NextResponse.json({ checkIn: updated })
  } catch (error) {
    console.error('Error saving customer info:', error)
    return NextResponse.json({ error: 'Failed to save customer info' }, { status: 500 })
  }
}
