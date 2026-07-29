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
      showEngagementMetrics: true,
      showPortfolioViewsMetric: true,
      _count: { select: { checkIns: true } },
    },
  })

  return NextResponse.json(orgs)
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const { id, planTier, showEngagementMetrics, showPortfolioViewsMetric } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const data: { planTier?: string; showEngagementMetrics?: boolean; showPortfolioViewsMetric?: boolean } = {}

  if (planTier !== undefined) {
    const validTiers = ['free', 'pro', 'elite', 'titan']
    if (!validTiers.includes(planTier)) return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 })
    data.planTier = planTier
  }
  if (showEngagementMetrics !== undefined) data.showEngagementMetrics = Boolean(showEngagementMetrics)
  if (showPortfolioViewsMetric !== undefined) data.showPortfolioViewsMetric = Boolean(showPortfolioViewsMetric)

  if (Object.keys(data).length === 0) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })

  const updated = await prisma.organization.update({
    where: { id },
    data,
    select: { id: true, name: true, planTier: true, showEngagementMetrics: true, showPortfolioViewsMetric: true },
  })

  return NextResponse.json(updated)
}
