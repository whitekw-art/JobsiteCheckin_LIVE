import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, role } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    if (!currentUser.organizationId) {
      return NextResponse.json({ error: 'Current user is not linked to an organization' }, { status: 400 })
    }

    const invitationId = randomUUID()
    const invitationRole = 'USER'

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "Invitations" (id, email, "organizationId", role, "createdAt")
        VALUES (${invitationId}, ${email}, ${currentUser.organizationId}, ${invitationRole}, NOW())
      `,
    )

    const baseUrl = process.env.NEXTAUTH_URL || ''
    const inviteUrl = `${baseUrl}/auth/invite?token=${invitationId}`

    return NextResponse.json({ success: true, inviteUrl })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
