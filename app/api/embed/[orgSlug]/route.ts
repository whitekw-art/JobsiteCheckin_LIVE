import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

// CORS-open public read-only endpoint. Fetched by browsers on customer
// websites via widget.v1.js. It requires no login, sets no cookies, and
// returns no personal information.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const PAGE_SIZE = 20

// widget.v1.js only ever asks for offsets that are multiples of PAGE_SIZE
// ("Load more" sends jobs.length, and the button hides on the last page).
// Far above any real customer's job count.
const MAX_OFFSET = 5000

// Vercel's CDN only stores a function response when told to by s-maxage or a
// CDN-specific header — a plain max-age is honored by browsers alone, which
// left every new visitor's request reaching the database. Vercel keeps one
// copy per URL for 4 minutes and each browser keeps it 1 more, so a publish,
// unpublish or edit reaches customer websites within 5 minutes at most.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60',
  'Vercel-CDN-Cache-Control': 'max-age=240',
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

// Unique values ordered by how often they appear, most frequent first
function byFrequency(values: string[]): string[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}

function buildIntroDefault(
  orgName: string,
  jobs: Array<{ doorType: string | null; city: string | null; state: string | null }>
): string | null {
  const types = byFrequency(jobs.map((j) => (j.doorType || '').trim()).filter(Boolean))
    .slice(0, 3)
    .map((t) => t.toLowerCase())
  if (types.length === 0) return null

  const states = [...new Set(jobs.map((j) => (j.state || '').trim()).filter(Boolean))]
  let cityPart = ''
  if (states.length === 1) {
    const cities = byFrequency(jobs.map((j) => (j.city || '').trim()).filter(Boolean)).slice(0, 3)
    if (cities.length > 0) cityPart = `${joinList(cities)}, ${states[0]}`
  } else {
    const cityLabels = byFrequency(
      jobs
        .filter((j) => (j.city || '').trim())
        .map((j) => [j.city!.trim(), (j.state || '').trim()].filter(Boolean).join(', '))
    ).slice(0, 3)
    if (cityLabels.length > 0) cityPart = joinList(cityLabels)
  }

  return cityPart
    ? `${orgName} specializes in ${joinList(types)} across ${cityPart}.`
    : `${orgName} specializes in ${joinList(types)}.`
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    // The CDN cache key includes the full query string, so any variation the
    // widget never sends (an unknown parameter, an odd or huge offset) would
    // skip the cache and reach the database. Reject those before any query.
    const query = request.nextUrl.searchParams
    const rawOffset = query.get('offset')
    const offset = rawOffset === null ? 0 : Number(rawOffset)
    const unexpectedParam = [...query.keys()].some((k) => k !== 'offset')
    if (
      unexpectedParam ||
      query.getAll('offset').length > 1 ||
      // Canonical digits only: "020" or "0020" would each be a fresh cache key.
      (rawOffset !== null && String(offset) !== rawOffset) ||
      !Number.isInteger(offset) ||
      offset < 0 ||
      offset % PAGE_SIZE !== 0 ||
      offset > MAX_OFFSET
    ) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400, headers: CORS_HEADERS }
      )
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        portfolioIntro: true,
        portfolioPageUrl: true,
        phone: true,
        website: true,
        email: true,
        gbpReviewLink: true,
      },
    })

    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404, headers: { ...CORS_HEADERS, ...CACHE_HEADERS } }
      )
    }

    const [checkIns, total] = await Promise.all([
      prisma.checkIn.findMany({
        where: { organizationId: org.id, isPublic: true },
        orderBy: { timestamp: 'desc' },
        skip: offset,
        take: PAGE_SIZE,
        select: {
          id: true,
          doorType: true,
          city: true,
          state: true,
          zip: true,
          latitude: true,
          longitude: true,
          seoDescription: true,
          notes: true,
          photoUrls: true,
          beforePhotoUrl: true,
          afterPhotoUrl: true,
          featuredPhotoUrl: true,
          timestamp: true,
        },
      }),
      prisma.checkIn.count({
        where: { organizationId: org.id, isPublic: true },
      }),
    ])

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')

    const jobs = checkIns.map((job) => {
      const citySlug = slugify(job.city || '')
      const stateSlug = slugify(job.state || '')
      const doorTypeSlug = slugify(job.doorType || 'job')
      const jobSlug = org.slug ? `${doorTypeSlug}-${org.slug}-${job.id}` : `${doorTypeSlug}-${job.id}`

      const allPhotoUrls = job.photoUrls
        ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
        : []
      // The owner's chosen cover photo leads, so widgets/embeds that just take
      // photoUrls[0] as the thumbnail show the right image without extra logic.
      const photoUrls =
        job.featuredPhotoUrl && allPhotoUrls.includes(job.featuredPhotoUrl)
          ? [job.featuredPhotoUrl, ...allPhotoUrls.filter((u) => u !== job.featuredPhotoUrl)]
          : allPhotoUrls

      return {
        id: job.id,
        slug: jobSlug,
        jobType: (job.doorType || 'Job').trim(),
        city: job.city?.trim() || null,
        state: job.state?.trim() || null,
        zipCode: job.zip,
        latitude: job.latitude,
        longitude: job.longitude,
        // notes is the real, human-written (or AI-generated) job narrative — the same
        // content shown as "About This Project" on the real job page. seoDescription is
        // just an auto-templated fallback ("Installed a Wood Door at 123 Main St...")
        // meant only for the invisible <meta name="description"> tag, never for visible
        // body content. Preferring it here was backwards and produced thin, duplicate
        // text across every job on a customer's site.
        description: job.notes || job.seoDescription || null,
        photoUrls,
        beforePhotoUrl: job.beforePhotoUrl,
        afterPhotoUrl: job.afterPhotoUrl,
        createdAt: job.timestamp ? job.timestamp.toISOString() : null,
        pckUrl: `${baseUrl}/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${jobSlug}`,
      }
    })

    return NextResponse.json(
      {
        org: {
          name: org.name,
          slug: org.slug,
          portfolioIntro: org.portfolioIntro,
          portfolioPageUrl: org.portfolioPageUrl,
          introDefault: buildIntroDefault(org.name, checkIns),
          ...(org.phone ? { phone: org.phone } : {}),
          ...(org.website ? { website: org.website } : {}),
          ...(org.email ? { email: org.email } : {}),
          ...(org.gbpReviewLink ? { gbpReviewLink: org.gbpReviewLink } : {}),
        },
        jobs,
        total,
      },
      {
        headers: {
          ...CORS_HEADERS,
          ...CACHE_HEADERS,
        },
      }
    )
  } catch (error) {
    console.error('Embed API error:', error)
    return NextResponse.json(
      { error: 'Failed to load jobs' },
      { status: 500, headers: CORS_HEADERS }
    )
  }
}
