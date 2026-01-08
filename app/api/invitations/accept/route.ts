import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const { token, password, firstName, lastName } = await request.json()

    if (!token || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Token, password, first name, and last name are required' },
        { status: 400 }
      )
    }

    const rows = await prisma.$queryRaw<
      { id: string; email: string; organizationId: string | null; role: string | null }[]
    >(Prisma.sql`
      SELECT id, email, "organizationId", role
      FROM "Invitations"
      WHERE id = ${token}
      LIMIT 1
    `)

    const invitation = rows[0]

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        email: invitation.email.toLowerCase(),
        name: `${firstName} ${lastName}`,
        password: hashedPassword,
        role: (invitation.role as any) || 'USER',
        organizationId: invitation.organizationId,
      },
    })

    await prisma.$executeRaw(
      Prisma.sql`
        DELETE FROM "Invitations"
        WHERE id = ${token}
      `
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'User Already Exists' }, { status: 409 })
    }
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    )
  }
}
