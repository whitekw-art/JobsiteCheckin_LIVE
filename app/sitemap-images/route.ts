export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { jobUrl } from '@/lib/jobUrls'
import { photoAlt } from '@/lib/photoAlt'
import { escapeXml } from '@/lib/sitemapXml'

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  const checkIns = await prisma.checkIn.findMany({
    where: {
      isPublic: true,
      photoUrls: { not: null },
    },
    select: {
      id: true,
      street: true,
      city: true,
      state: true,
      doorType: true,
      photoUrls: true,
      photoAltText: true,
      beforePhotoUrl: true,
      afterPhotoUrl: true,
      organization: { select: { slug: true } },
    },
    orderBy: { timestamp: 'desc' },
    // Google's limit is 50,000 addresses per sitemap file.
    take: 50000,
  })

  const urlBlocks: string[] = []

  for (const checkIn of checkIns) {
    const photos = [
      ...(checkIn.photoUrls || '').split(',').map((u) => u.trim()).filter(Boolean),
      ...(checkIn.beforePhotoUrl ? [checkIn.beforePhotoUrl] : []),
      ...(checkIn.afterPhotoUrl ? [checkIn.afterPhotoUrl] : []),
    ].filter((url, i, arr) => arr.indexOf(url) === i) // dedupe

    if (photos.length === 0) continue

    const pageUrl = jobUrl(checkIn, checkIn.organization?.slug, baseUrl)

    const imageNodes = photos
      .map(
        (photoUrl, i) => `
      <image:image>
        <image:loc>${escapeXml(photoUrl)}</image:loc>
        <image:title>${escapeXml(photoAlt(checkIn, photoUrl, i, photos.length))}</image:title>
      </image:image>`
      )
      .join('')

    urlBlocks.push(`
  <url>
    <loc>${escapeXml(pageUrl)}</loc>${imageNodes}
  </url>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlBlocks.join('\n')}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
