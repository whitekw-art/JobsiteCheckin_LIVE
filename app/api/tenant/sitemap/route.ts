import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// sitemap.xml for customer-hosted subdomains. The middleware rewrites
// {subdomain}/sitemap.xml here; the original Host header survives the
// rewrite, so it identifies the tenant. (?host= fallback for direct testing.)
export async function GET(request: NextRequest) {
  const host = (
    request.nextUrl.searchParams.get('host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase().split(':')[0]
  if (!host) return new NextResponse('Not found', { status: 404 })

  const org = await prisma.organization.findUnique({
    where: { customSubdomain: host },
    select: {
      checkIns: {
        where: { isPublic: true },
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { timestamp: true },
      },
    },
  })
  if (!org) return new NextResponse('Not found', { status: 404 })

  const lastmod = org.checkIns[0]?.timestamp
    ? org.checkIns[0].timestamp.toISOString()
    : new Date().toISOString()

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${host}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
  </url>
</urlset>
`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
