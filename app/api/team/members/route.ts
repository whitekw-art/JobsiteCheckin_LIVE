import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET() {
  try {
    const user = await requireRole(['OWNER', 'ADMIN'])
    
    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' }
    })

    const invitations = await prisma.$queryRaw<
      { id: string; email: string; role: string | null; organizationId: string | null; createdAt: Date | null }[]
    >(Prisma.sql`
      SELECT id, email, role, "organizationId", "createdAt"
      FROM "Invitations"
      WHERE "organizationId" = ${user.organizationId}
    `)

    const combined = [
      ...members.map((m) => ({
        ...m,
        isPending: false,
      })),
      ...invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        name: null,
        role: 'Invited',
        createdAt: inv.createdAt ? inv.createdAt.toISOString() : null,
        isPending: true,
      })),
    ]

    return NextResponse.json({ members: combined })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await requireRole(['OWNER', 'ADMIN'])
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    // Only OWNER can assign OWNER role
    if (role === 'OWNER' && currentUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can assign owner role' }, { status: 403 })
    }

    // Can't change your own role
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { 
        id: userId,
        organizationId: currentUser.organizationId 
      },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await requireRole(['OWNER', 'ADMIN'])
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Can't delete yourself
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Check if user exists and is in same org
    const userToDelete = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId: currentUser.organizationId 
      }
    })

    if (!userToDelete) {
      const inviteToDelete = await prisma.invitations.findFirst({
        where: {
          id: userId,
          organizationId: currentUser.organizationId,
        },
        select: { id: true },
      })

      if (!inviteToDelete) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      await prisma.invitations.delete({
        where: { id: inviteToDelete.id },
      })

      return NextResponse.json({ message: 'Invitation deleted successfully' })
    }

    // Only OWNER can delete other OWNERS
    if (userToDelete.role === 'OWNER' && currentUser.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can delete other owners' }, { status: 403 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}
