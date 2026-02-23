import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { CheckInPageViewTracker } from '@/components/CheckInPageViewTracker'
import JobDetailClient from './JobDetailClient'

export async function generateMetadata(
  { params }: { params: Promise<{ location: string; slug: string }> }
): Promise<Metadata> {
  const { slug, location } = await params

  const uuidMatch = slug.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
  const checkInId = uuidMatch ? uuidMatch[0] : ''

  if (!checkInId) {
    return { title: 'Job Not Found' }
  }

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: { organization: true },
  })

  if (!checkIn || !checkIn.isPublic) {
    return { title: 'Job Not Found' }
  }

  const { doorType, city, state, seoTitle, seoDescription, photoUrls, organization } = checkIn

  const title = seoTitle ||
    (doorType && city && state ? `${doorType} in ${city}, ${state}` : 'Job Details')

  const description = seoDescription ||
    (doorType && city && state
      ? `Installed a ${doorType} in ${city}, ${state}.`
      : 'Job description is not available.')

  const photos = photoUrls
    ? photoUrls.split(',').map((url) => url.trim()).filter(Boolean)
    : []

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const pageUrl = appUrl ? `${appUrl}/jobs/${location}/${slug}` : undefined

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      ...(pageUrl && { url: pageUrl }),
      ...(organization?.name && { siteName: organization.name }),
      ...(photos.length > 0 && {
        images: photos.map((url) => ({
          url,
          alt: [doorType, city && state ? `${city}, ${state}` : city || state]
            .filter(Boolean)
            .join(' in ') || 'Job photo',
        })),
      }),
    },
    twitter: {
      card: photos.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(photos.length > 0 && { images: [photos[0]] }),
    },
  }
}

export default async function JobPage(
  { params }: { params: Promise<{ location: string; slug: string }> }
) {
  const { slug } = await params

  const uuidMatch = slug.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)
  const checkInId = uuidMatch ? uuidMatch[0] : ''

  if (!checkInId) {
    notFound()
  }

  const checkIn = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    include: {
      organization: true,
    },
  })

  if (!checkIn || !checkIn.isPublic) {
    notFound()
  }

  const {
    doorType,
    city,
    state,
    zip,
    seoTitle,
    seoDescription,
    photoUrls,
    organization,
  } = checkIn

  const effectiveTitle =
    seoTitle ||
    (doorType && city && state
      ? `${doorType} in ${city}, ${state}`
      : 'Job Details')

  const effectiveDescription =
    seoDescription ||
    (doorType && city && state
      ? `Installed a ${doorType} in ${city}, ${state}.`
      : 'Job description is not available.')

  const photos = photoUrls
    ? photoUrls
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)
    : []

  const businessName = organization?.name || 'Business name unavailable'
  const businessPhone = organization?.phone || ''
  const businessWebsite = organization?.website || ''
  const normalizedWebsiteHref =
    businessWebsite && businessWebsite.startsWith('http')
      ? businessWebsite
      : businessWebsite
      ? `https://${businessWebsite}`
      : ''

  // Compute orgSlug for portfolio link
  const orgSlug = organization?.slug || null

  // Fetch related jobs from same organization
  const relatedCheckIns = organization
    ? await prisma.checkIn.findMany({
        where: {
          organizationId: organization.id,
          isPublic: true,
          id: { not: checkInId },
        },
        orderBy: { timestamp: 'desc' },
        take: 4,
      })
    : []

  const relatedJobs = relatedCheckIns.map((job) => {
    const jobPhotos = job.photoUrls
      ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []
    const citySlug = slugify(job.city || '')
    const stateSlug = slugify(job.state || '')
    const doorTypeSlug = slugify(job.doorType || 'job')
    const jobPath = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${job.id}`

    return {
      id: job.id,
      doorType: job.doorType || 'Job',
      city: job.city || '',
      state: job.state || '',
      thumbnail: jobPhotos[0] || null,
      jobPath,
      timestamp: job.timestamp ? job.timestamp.toISOString() : null,
    }
  })

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  // Build JSON-LD structured data
  const localBusiness: Record<string, any> = {
    '@type': 'LocalBusiness',
    name: organization?.name || undefined,
  }
  if (businessPhone) localBusiness.telephone = businessPhone
  if (normalizedWebsiteHref) localBusiness.url = normalizedWebsiteHref
  if (city || state || zip) {
    localBusiness.address = {
      '@type': 'PostalAddress',
      ...(city && { addressLocality: city }),
      ...(state && { addressRegion: state }),
      ...(zip && { postalCode: zip }),
    }
  }
  if (
    typeof checkIn.latitude === 'number' &&
    typeof checkIn.longitude === 'number'
  ) {
    localBusiness.geo = {
      '@type': 'GeoCoordinates',
      latitude: checkIn.latitude,
      longitude: checkIn.longitude,
    }
  }

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: effectiveTitle,
    description: effectiveDescription,
    provider: localBusiness,
  }
  if (doorType) jsonLd.serviceType = doorType
  if (city || state) {
    jsonLd.areaServed = {
      '@type': 'Place',
      name: [city, state].filter(Boolean).join(', '),
    }
  }
  if (photos.length > 0) {
    jsonLd.image = photos.map((url, i) => ({
      '@type': 'ImageObject',
      url,
      name: [doorType, city, state].filter(Boolean).join(' - ') || `Job photo ${i + 1}`,
    }))
  }

  return (
    <main className="min-h-screen bg-surface-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CheckInPageViewTracker checkInId={checkInId} />
      <JobDetailClient
        checkInId={checkInId}
        title={effectiveTitle}
        description={effectiveDescription}
        doorType={doorType || ''}
        city={city || ''}
        state={state || ''}
        zip={zip || ''}
        notes={checkIn.notes || null}
        timestamp={checkIn.timestamp ? checkIn.timestamp.toISOString() : null}
        photos={photos}
        businessName={businessName}
        businessPhone={businessPhone}
        normalizedWebsite={normalizedWebsiteHref}
        orgSlug={orgSlug}
        relatedJobs={relatedJobs}
        baseUrl={baseUrl}
      />
    </main>
  )
}
