import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[\/]+/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

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

  return [
    {
      url: baseUrl || 'https://localhost:3000',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...jobEntries,
  ]
}
