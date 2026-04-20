import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const [totalOrgs, activeSubs, totalPublishedJobs, totalPortfolioViews, pendingFollowUps] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { subscriptionStatus: 'active' } }),
    prisma.checkIn.count({ where: { isPublic: true } }),
    prisma.portfolioView.count(),
    prisma.checkIn.count({
      where: {
        isPublic: true,
        homeCustomerEmail: { not: null },
        followUpEmailSentAt: null,
        publishedAt: { not: null },
      },
    }),
  ])

  return NextResponse.json({ totalOrgs, activeSubs, totalPublishedJobs, totalPortfolioViews, pendingFollowUps })
}
