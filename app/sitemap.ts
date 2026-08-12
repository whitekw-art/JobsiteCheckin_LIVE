export const dynamic = 'force-dynamic'

import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { BLOG_POSTS } from '@/lib/blogPosts'

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
      organization: { select: { slug: true } },
    },
    orderBy: { timestamp: 'desc' },
  })

  const jobEntries: MetadataRoute.Sitemap = publicCheckIns.map((checkIn) => {
    const citySlug = slugify(checkIn.city || '') || 'city'
    const stateSlug = slugify(checkIn.state || '') || 'state'
    const doorTypeSlug = slugify(checkIn.doorType || 'job')
    const orgSlug = checkIn.organization?.slug || ''
    const location = `${citySlug}-${stateSlug}`
    const slug = orgSlug
      ? `${doorTypeSlug}-${orgSlug}-${checkIn.id}`
      : `${doorTypeSlug}-${checkIn.id}`

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

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features/local-job-pages`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/review-requests`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/gbp-post-generator`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/portfolio`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/before-after`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/ai-copywriter`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/features/ai-review-request`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.modifiedISO),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    ...staticEntries,
    ...blogEntries,
    ...jobEntries,
    ...portfolioEntries,
  ]
}
