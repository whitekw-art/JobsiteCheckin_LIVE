import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

// CORS-open public read-only endpoint. Fetched by browsers on customer
// websites via widget.v1.js — no authentication, no cookies, no PII.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const PAGE_SIZE = 20

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

    const rawOffset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10)
    const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0

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
        { status: 404, headers: CORS_HEADERS }
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

      return {
        id: job.id,
        slug: jobSlug,
        jobType: (job.doorType || 'Job').trim(),
        city: job.city?.trim() || null,
        state: job.state?.trim() || null,
        zipCode: job.zip,
        latitude: job.latitude,
        longitude: job.longitude,
        description: job.seoDescription || job.notes || null,
        photoUrls: job.photoUrls
          ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
          : [],
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
          'Cache-Control': 'public, max-age=300',
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
