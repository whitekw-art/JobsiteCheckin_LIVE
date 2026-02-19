import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  const publicCheckIns = await prisma.checkIn.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      city: true,
      state: true,
      doorType: true,
      timestamp: true,
    },
    orderBy: { timestamp: 'desc' },
  })

  const jobEntries: MetadataRoute.Sitemap = publicCheckIns.map((checkIn) => {
    const citySlug = slugify(checkIn.city || '') || 'city'
    const stateSlug = slugify(checkIn.state || '') || 'state'
    const doorTypeSlug = slugify(checkIn.doorType || 'job')
    const location = `${citySlug}-${stateSlug}`
    const slug = `${doorTypeSlug}-${checkIn.id}`

    return {
      url: `${baseUrl}/jobs/${location}/${slug}`,
      lastModified: checkIn.timestamp || undefined,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  })

  // Portfolio pages for orgs with at least one public check-in
  const orgsWithPublicJobs = await prisma.organization.findMany({
    where: {
      slug: { not: null },
      checkIns: { some: { isPublic: true } },
    },
    select: {
      slug: true,
      createdAt: true,
    },
  })

  const portfolioEntries: MetadataRoute.Sitemap = orgsWithPublicJobs
    .filter((org) => org.slug)
    .map((org) => ({
      url: `${baseUrl}/portfolio/${org.slug}`,
      lastModified: org.createdAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

  return [
    {
      url: baseUrl || 'https://localhost:3000',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...jobEntries,
    ...portfolioEntries,
  ]
}
