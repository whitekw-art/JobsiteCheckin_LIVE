export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  const checkIns = await prisma.checkIn.findMany({
    where: {
      isPublic: true,
      photoUrls: { not: null },
    },
    select: {
      id: true,
      city: true,
      state: true,
      doorType: true,
      photoUrls: true,
      organization: { select: { slug: true } },
    },
    orderBy: { timestamp: 'desc' },
  })

  const urlBlocks: string[] = []

  for (const checkIn of checkIns) {
    const photos = (checkIn.photoUrls || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)

    if (photos.length === 0) continue

    const citySlug = slugify(checkIn.city || '') || 'city'
    const stateSlug = slugify(checkIn.state || '') || 'state'
    const doorTypeSlug = slugify(checkIn.doorType || 'job')
    const orgSlug = checkIn.organization?.slug || ''
    const location = `${citySlug}-${stateSlug}`
    const slug = orgSlug
      ? `${doorTypeSlug}-${orgSlug}-${checkIn.id}`
      : `${doorTypeSlug}-${checkIn.id}`

    const pageUrl = `${baseUrl}/jobs/${location}/${slug}`
    const doorLabel = checkIn.doorType || 'Contractor job'
    const locationLabel = [checkIn.city, checkIn.state].filter(Boolean).join(', ')
    const altBase = locationLabel
      ? `${doorLabel} in ${locationLabel}`
      : doorLabel

    const imageNodes = photos
      .map(
        (photoUrl, i) => `
      <image:image>
        <image:loc>${escapeXml(photoUrl)}</image:loc>
        <image:title>${escapeXml(`${altBase} — photo ${i + 1}`)}</image:title>
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
