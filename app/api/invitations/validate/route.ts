import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 })
    }

    const rows = await prisma.$queryRaw<
      { id: string; email: string; role: string | null }[]
    >(Prisma.sql`
      SELECT id, email, role
      FROM "Invitations"
      WHERE id = ${token}
      LIMIT 1
    `)

    const invitation = rows[0]

    if (!invitation) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
    })
  } catch (error) {
    console.error('Error validating invitation:', error)
    return NextResponse.json({ valid: false }, { status: 500 })
  }
}

