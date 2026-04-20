import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      planTier: true,
      subscriptionStatus: true,
      createdAt: true,
      _count: { select: { checkIns: true } },
    },
  })

  return NextResponse.json(orgs)
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const { id, planTier } = await request.json()
  if (!id || !planTier) return NextResponse.json({ error: 'id and planTier required' }, { status: 400 })

  const validTiers = ['free', 'pro', 'elite', 'titan']
  if (!validTiers.includes(planTier)) return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })

  const updated = await prisma.organization.update({
    where: { id },
    data: { planTier },
    select: { id: true, name: true, planTier: true },
  })

  return NextResponse.json(updated)
}
