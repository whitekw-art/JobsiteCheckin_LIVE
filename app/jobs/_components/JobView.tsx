import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { parseStoredAddress } from '@/lib/gbpBusinessInfo'
import { publicReviewForJob } from '@/lib/googleReviews'
import { appBaseUrl, cityPath, jobHeading, jobPath, jobTabTitle, jobUrl, streetName } from '@/lib/jobUrls'
import { photoAlt } from '@/lib/photoAlt'
import { CheckInPageViewTracker } from '@/components/CheckInPageViewTracker'
import JobDetailClient from './JobDetailClient'
import type { JobWithOrg } from './resolve'

// The job page (phase 3). Rendered by app/jobs/[business]/[[...rest]]/page.tsx
// once the address has been confirmed current; see resolve.ts.

const photoList = (value: string | null | undefined) =>
  value ? value.split(',').map((u) => u.trim()).filter(Boolean) : []

/** The owner's chosen cover photo leads the carousel and the link previews. */
function orderedPhotos(job: JobWithOrg): string[] {
  const all = photoList(job.photoUrls)
  return job.featuredPhotoUrl && all.includes(job.featuredPhotoUrl)
    ? [job.featuredPhotoUrl, ...all.filter((u) => u !== job.featuredPhotoUrl)]
    : all
}

export function jobMetadata(job: JobWithOrg): Metadata {
  const { doorType, city, state, seoDescription, organization } = job
  const orgName = organization?.name || ''
  const title = jobTabTitle(job, orgName)

  const article = doorType && /^[aeiou]/i.test(doorType) ? 'an' : 'a'
  const description =
    seoDescription ||
    (doorType && city && state
      ? `View ${article} ${doorType} installation completed in ${city}, ${state}${orgName ? ` by ${orgName}` : ''}. See photos, details, and get a free estimate.`
      : 'View completed job details, photos, and request a free estimate.')

  const photos = orderedPhotos(job)
  const pageUrl = jobUrl(job, organization?.slug)

  // When this job is also live on the customer's own WordPress site, that copy
  // is canonical: search authority should accrue to their domain, not ours
  // (design spec 5). Falls back to this page whenever it isn't synced.
  const canonicalUrl = job.wpSyncStatus === 'synced' && job.wpPostUrl ? job.wpPostUrl : pageUrl

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      ...(orgName && { siteName: orgName }),
      ...(photos.length > 0 && {
        images: photos.map((url, i) => ({ url, alt: photoAlt(job, url, i, photos.length) })),
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

export async function JobView({ job }: { job: JobWithOrg }) {
  const { doorType, city, state, zip, seoDescription, organization, beforePhotoUrl, afterPhotoUrl } = job
  const checkInId = job.id

  // The customer's Google review, when the owner has linked one (Titan).
  const review = await publicReviewForJob(job.id)

  const heading = jobHeading(job)
  const effectiveArticle = doorType && /^[aeiou]/i.test(doorType) ? 'an' : 'a'
  const effectiveDescription =
    seoDescription ||
    (doorType && city && state
      ? `View ${effectiveArticle} ${doorType} installation completed in ${city}, ${state}${organization?.name ? ` by ${organization.name}` : ''}. See photos, details, and get a free estimate.`
      : 'View completed job details, photos, and request a free estimate.')

  const photos = orderedPhotos(job)
  const photoAlts = photos.map((url, i) => photoAlt(job, url, i, photos.length))
  const beforeAlt = beforePhotoUrl ? photoAlt(job, beforePhotoUrl, 0, 1) : ''
  const afterAlt = afterPhotoUrl ? photoAlt(job, afterPhotoUrl, 0, 1) : ''

  const businessName = organization?.name || 'Business name unavailable'
  const businessPhone = organization?.phone || ''
  const businessWebsite = organization?.website || ''
  const normalizedWebsiteHref =
    businessWebsite && businessWebsite.startsWith('http')
      ? businessWebsite
      : businessWebsite
      ? `https://${businessWebsite}`
      : ''
  const orgSlug = organization?.slug || null

  // Visible location line: street name, city, state and zip, without the house
  // number (decision 13.2). The house number stays only in the meta description.
  const street = streetName(job.street)
  const locationLine = [street, city?.trim(), [state?.trim(), zip?.trim()].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ')

  const relatedCheckIns = organization
    ? await prisma.checkIn.findMany({
        where: { organizationId: organization.id, isPublic: true, id: { not: checkInId } },
        orderBy: { timestamp: 'desc' },
        take: 4,
      })
    : []

  const relatedJobs = relatedCheckIns.map((related) => {
    const relatedPhotos = photoList(related.photoUrls)
    return {
      id: related.id,
      title: jobHeading(related),
      doorType: related.doorType || 'Job',
      city: related.city || '',
      state: related.state || '',
      thumbnail: relatedPhotos[0] || null,
      thumbnailAlt: relatedPhotos[0] ? photoAlt(related, relatedPhotos[0], 0, relatedPhotos.length) : '',
      jobPath: jobPath(related, orgSlug),
      timestamp: related.timestamp ? related.timestamp.toISOString() : null,
    }
  })

  const baseUrl = appBaseUrl()
  const pageUrl = jobUrl(job, orgSlug, baseUrl)
  const cityLabel = [city?.trim(), state?.trim()].filter(Boolean).join(', ')

  // Breadcrumb: business > city > job. The visible trail and the hidden markup
  // list the same steps. The business step opens the portfolio and the city
  // step opens the city page.
  const crumbs: Array<{ name: string; href: string | null }> = []
  if (orgSlug) crumbs.push({ name: organization?.name || 'Portfolio', href: `/portfolio/${orgSlug}` })
  if (cityLabel) crumbs.push({ name: cityLabel, href: cityPath(orgSlug, city, state) })
  crumbs.push({ name: heading, href: null })

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href ? `${baseUrl}${c.href}` : pageUrl,
    })),
  }

  // Structured data. The business and the job are separate entities: the
  // business keeps one stable identity and address on every page (its address
  // copied from its Google Business Profile, or none for a service-area
  // business that hides it), and the job site's location and coordinates
  // describe the page's own content.
  const businessId = orgSlug ? `${baseUrl}/portfolio/${orgSlug}#business` : `${pageUrl}#business`
  const storefront = parseStoredAddress(organization?.gbpBusinessAddress)

  const business: Record<string, unknown> = {
    '@type': 'LocalBusiness',
    '@id': businessId,
    name: organization?.name || undefined,
  }
  if (businessPhone) business.telephone = businessPhone
  if (normalizedWebsiteHref) business.url = normalizedWebsiteHref
  if (storefront) {
    business.address = {
      '@type': 'PostalAddress',
      streetAddress: storefront.addressLines.join(', '),
      ...(storefront.locality && { addressLocality: storefront.locality }),
      ...(storefront.administrativeArea && { addressRegion: storefront.administrativeArea }),
      ...(storefront.postalCode && { postalCode: storefront.postalCode }),
      ...(storefront.regionCode && { addressCountry: storefront.regionCode }),
    }
  }

  const service: Record<string, unknown> = {
    '@type': 'Service',
    '@id': `${pageUrl}#service`,
    name: heading,
    description: effectiveDescription,
    provider: { '@id': businessId },
  }
  if (doorType) service.serviceType = doorType
  if (city || state) {
    service.areaServed = { '@type': 'Place', name: cityLabel }
  }

  const jobPlace: Record<string, unknown> = { '@type': 'Place' }
  if (city || state || zip || street) {
    jobPlace.address = {
      '@type': 'PostalAddress',
      ...(street && { streetAddress: street }),
      ...(city && { addressLocality: city.trim() }),
      ...(state && { addressRegion: state.trim() }),
      ...(zip && { postalCode: zip.trim() }),
    }
  }
  if (typeof job.latitude === 'number' && typeof job.longitude === 'number') {
    jobPlace.geo = { '@type': 'GeoCoordinates', latitude: job.latitude, longitude: job.longitude }
  }

  const webPage: Record<string, unknown> = {
    '@type': 'WebPage',
    '@id': pageUrl,
    url: pageUrl,
    name: heading,
    description: effectiveDescription,
    about: { '@id': `${pageUrl}#service` },
    ...(jobPlace.address || jobPlace.geo ? { contentLocation: jobPlace } : {}),
  }
  if (job.timestamp) webPage.datePublished = job.timestamp.toISOString()
  if (photos.length > 0) {
    webPage.image = photos.map((url, i) => ({
      '@type': 'ImageObject',
      url: url.startsWith('http') ? url : `${baseUrl}${url}`,
      name: photoAlts[i],
    }))
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': [webPage, service, business] }

  return (
    <main className="min-h-screen bg-surface-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      <CheckInPageViewTracker checkInId={checkInId} />
      <JobDetailClient
        checkInId={checkInId}
        title={heading}
        description={effectiveDescription}
        doorType={doorType || ''}
        city={city || ''}
        state={state || ''}
        zip={zip || ''}
        locationLine={locationLine}
        notes={job.notes || null}
        timestamp={job.timestamp ? job.timestamp.toISOString() : null}
        photos={photos}
        photoAlts={photoAlts}
        beforePhotoUrl={beforePhotoUrl || null}
        afterPhotoUrl={afterPhotoUrl || null}
        beforeAlt={beforeAlt}
        afterAlt={afterAlt}
        businessName={businessName}
        businessPhone={businessPhone}
        normalizedWebsite={normalizedWebsiteHref}
        orgSlug={orgSlug}
        orgPlanTier={organization?.planTier ?? null}
        relatedJobs={relatedJobs}
        baseUrl={baseUrl}
        review={review}
        breadcrumb={crumbs}
      />
    </main>
  )
}
