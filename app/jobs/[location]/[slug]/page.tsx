import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { CheckInPageViewTracker } from '@/components/CheckInPageViewTracker'
import { JobWebsiteLink } from '@/components/JobWebsiteLink'
import { JobPhoneLink } from '@/components/JobPhoneLink'
import { JobPhotoLink } from '@/components/JobPhotoLink'

interface JobPageProps {
  params: {
    location: string
    slug: string
  }
}

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
    <main className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-4 sm:p-6">
        <CheckInPageViewTracker checkInId={checkInId} />
        <h1 className="text-2xl font-bold mb-2">{effectiveTitle}</h1>
        <p className="text-gray-700 mb-4">{effectiveDescription}</p>

        <section className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Location</h2>
          <p className="text-gray-800">
            {[city, state, zip].filter(Boolean).join(', ') || 'Location unavailable'}
          </p>
        </section>

        <section className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Door Type</h2>
          <p className="text-gray-800">{doorType || 'Not specified'}</p>
        </section>

        <section className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Business</h2>
          <p className="text-gray-800">{businessName}</p>
        </section>

        <section className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Contact</h2>
          <div className="space-y-1 text-gray-800">
            <p>
              <span className="font-medium">Phone: </span>
              {businessPhone ? (
                <JobPhoneLink
                  checkInId={checkInId}
                  href={`tel:${businessPhone.replace(/[^0-9+]/g, '')}`}
                  label={businessPhone}
                />
              ) : (
                <span className="text-gray-500">Phone not provided</span>
              )}
            </p>
            <p>
              <span className="font-medium">Website: </span>
              {businessWebsite ? (
                <JobWebsiteLink
                  checkInId={checkInId}
                  href={normalizedWebsiteHref}
                  label={businessWebsite}
                />
              ) : (
                <span className="text-gray-500">Website not provided</span>
              )}
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Photos</h2>
          {photos.length === 0 ? (
            <p className="text-gray-500">No photos available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((url, index) => (
                <JobPhotoLink
                  key={index}
                  checkInId={checkInId}
                  href={url}
                  metadata={JSON.stringify({ photoIndex: index, photoUrl: url })}
                  label={
                    <img
                      src={url}
                      alt={
                        [doorType, city && state ? `${city}, ${state}` : city || state]
                          .filter(Boolean)
                          .join(' in ') || `Job photo ${index + 1}`
                      }
                      className="w-full h-auto rounded cursor-pointer"
                    />
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
