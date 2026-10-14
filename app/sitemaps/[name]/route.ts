export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { BLOG_POSTS } from '@/lib/blogPosts'
import { appBaseUrl, CITY_PAGE_INDEX_MIN_JOBS, cityUrl, citySlug, jobUrl } from '@/lib/jobUrls'
import { JOBS_PER_SITEMAP, urlsetXml, XML_HEADERS, type SitemapUrl } from '@/lib/sitemapXml'

// /sitemaps/pages.xml    fixed pages, blog posts, portfolios, city pages
// /sitemaps/jobs-{n}.xml published job addresses, JOBS_PER_SITEMAP per file
const STATIC: Array<[string, SitemapUrl['changeFrequency'], number]> = [
  ['/', 'weekly', 1.0],
  ['/pricing', 'monthly', 0.9],
  ['/features/local-job-pages', 'monthly', 0.8],
  ['/features/review-requests', 'monthly', 0.8],
  ['/features/gbp-post-generator', 'monthly', 0.8],
  ['/features/portfolio', 'monthly', 0.8],
  ['/features/before-after', 'monthly', 0.8],
  ['/features/ai-copywriter', 'monthly', 0.7],
  ['/features/ai-review-request', 'monthly', 0.7],
  ['/blog', 'weekly', 0.8],
  ['/privacy', 'yearly', 0.3],
  ['/terms', 'yearly', 0.3],
]

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const base = appBaseUrl()

  if (name === 'pages.xml') {
    const urls: SitemapUrl[] = STATIC.map(([path, changeFrequency, priority]) => ({ url: `${base}${path}`, changeFrequency, priority }))
    for (const post of BLOG_POSTS) {
      urls.push({ url: `${base}/blog/${post.slug}`, lastModified: new Date(post.modifiedISO), changeFrequency: 'monthly', priority: 0.8 })
    }

    const orgs = await prisma.organization.findMany({
      where: { slug: { not: null }, checkIns: { some: { isPublic: true } } },
      select: { slug: true, createdAt: true },
    })
    for (const org of orgs) {
      urls.push({ url: `${base}/portfolio/${org.slug}`, lastModified: org.createdAt, changeFrequency: 'weekly', priority: 0.7 })
    }

    // City pages (page 1 only) once a city has enough published jobs to be indexable.
    const jobs = await prisma.checkIn.findMany({
      where: { isPublic: true, organizationId: { not: null } },
      select: { organizationId: true, city: true, state: true, timestamp: true, organization: { select: { slug: true } } },
    })
    const cities = new Map<string, { slug: string | null; city: string | null; state: string | null; n: number; latest: Date | null }>()
    for (const j of jobs) {
      const key = `${j.organizationId}|${citySlug(j.city, j.state)}`
      const entry = cities.get(key) ?? { slug: j.organization?.slug ?? null, city: j.city, state: j.state, n: 0, latest: null }
      entry.n += 1
      if (j.timestamp && (!entry.latest || j.timestamp > entry.latest)) entry.latest = j.timestamp
      cities.set(key, entry)
    }
    for (const c of cities.values()) {
      if (c.n < CITY_PAGE_INDEX_MIN_JOBS) continue
      urls.push({ url: cityUrl(c.slug, c.city, c.state, base), lastModified: c.latest, changeFrequency: 'weekly', priority: 0.6 })
    }
    return new Response(urlsetXml(urls), { headers: XML_HEADERS })
  }

  const m = name.match(/^jobs-(\d{1,4})\.xml$/)
  if (!m || parseInt(m[1], 10) < 1) return new Response('Not found', { status: 404 })
  const n = parseInt(m[1], 10)
  const jobs = await prisma.checkIn.findMany({
    where: { isPublic: true },
    select: { id: true, doorType: true, street: true, city: true, state: true, timestamp: true, organization: { select: { slug: true } } },
    orderBy: [{ timestamp: 'desc' }, { id: 'asc' }],
    skip: (n - 1) * JOBS_PER_SITEMAP,
    take: JOBS_PER_SITEMAP,
  })
  if (jobs.length === 0) return new Response('Not found', { status: 404 })
  const urls: SitemapUrl[] = jobs.map((j) => ({
    url: jobUrl(j, j.organization?.slug, base),
    lastModified: j.timestamp,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))
  return new Response(urlsetXml(urls), { headers: XML_HEADERS })
}
