export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { appBaseUrl } from '@/lib/jobUrls'
import { indexXml, JOBS_PER_SITEMAP, XML_HEADERS } from '@/lib/sitemapXml'

// The sitemap index. Lists the fixed-pages file and one file per
// JOBS_PER_SITEMAP published jobs, so no file nears Google's 50,000 limit.
export async function GET() {
  const base = appBaseUrl()
  const jobCount = await prisma.checkIn.count({ where: { isPublic: true } })
  const files = Math.ceil(jobCount / JOBS_PER_SITEMAP)
  const locs = [`${base}/sitemaps/pages.xml`]
  for (let n = 1; n <= files; n++) locs.push(`${base}/sitemaps/jobs-${n}.xml`)
  return new Response(indexXml(locs), { headers: XML_HEADERS })
}
