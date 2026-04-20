import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      trade: true,
      planInterest: true,
      createdAt: true,
    },
  })

  return NextResponse.json(entries)
}
