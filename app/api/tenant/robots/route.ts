import { NextRequest, NextResponse } from 'next/server'

// robots.txt for customer-hosted subdomains. The middleware rewrites
// {subdomain}/robots.txt here; the original Host header survives the
// rewrite, so it identifies the tenant. (?host= fallback for direct testing.)
export async function GET(request: NextRequest) {
  const host = (
    request.nextUrl.searchParams.get('host') ||
    request.headers.get('host') ||
    ''
  ).toLowerCase().split(':')[0]
  if (!host) return new NextResponse('Not found', { status: 404 })

  const body = `User-agent: *\nAllow: /\n\nSitemap: https://${host}/sitemap.xml\n`
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
