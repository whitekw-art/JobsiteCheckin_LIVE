import { notFound } from 'next/navigation'
import { jobHeading, jobPath as buildJobPath } from '@/lib/jobUrls'
import { photoAlt } from '@/lib/photoAlt'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { parseStoredAddress } from '@/lib/gbpBusinessInfo'
import PortfolioClient from './PortfolioClient'

interface PortfolioPageProps {
  params: Promise<{ orgSlug: string }>
}

async function getOrgWithJobs(orgSlug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    include: {
      checkIns: {
        where: { isPublic: true },
        orderBy: { timestamp: 'desc' },
      },
    },
  })
  return org
}

export async function generateMetadata({ params }: PortfolioPageProps): Promise<Metadata> {
  const { orgSlug } = await params
  const org = await getOrgWithJobs(orgSlug)

  if (!org) {
    return { title: 'Portfolio Not Found' }
  }

  const cities = [...new Set(org.checkIns.map((c) => c.city).filter(Boolean))]
  const doorTypes = [...new Set(org.checkIns.map((c) => c.doorType).filter(Boolean))]

  const jobCount = org.checkIns.length
  const jobWord = jobCount === 1 ? 'job' : 'jobs'

  const title = `${org.name} — Completed Jobs Portfolio`
  const description =
    doorTypes.length > 0 && cities.length > 0
      ? `${org.name} has completed ${jobCount} ${jobWord} including ${doorTypes.slice(0, 3).join(', ')} in ${cities.slice(0, 3).join(', ')}. View photos, project details, and request a free estimate.`
      : `View ${org.name}'s portfolio of ${jobCount} completed ${jobWord}. Browse project photos, service details, and get a free estimate.`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  // Prefer the first job's chosen cover photo (if set) over its first uploaded photo.
  const firstJobWithPhotos = org.checkIns.find((c) => c.photoUrls)
  const firstJobPhotos = firstJobWithPhotos?.photoUrls?.split(',').map((u) => u.trim()).filter(Boolean) || []
  const firstPhoto =
    (firstJobWithPhotos?.featuredPhotoUrl && firstJobPhotos.includes(firstJobWithPhotos.featuredPhotoUrl)
      ? firstJobWithPhotos.featuredPhotoUrl
      : firstJobPhotos[0]) || undefined

  const canonicalUrl = `${baseUrl}/portfolio/${orgSlug}`

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      ...(firstPhoto && { images: [{ url: firstPhoto, alt: `${org.name} completed work` }] }),
    },
    twitter: {
      card: firstPhoto ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(firstPhoto && { images: [firstPhoto] }),
    },
  }
}

export default async function PortfolioPage({ params }: PortfolioPageProps) {
  const { orgSlug } = await params
  const org = await getOrgWithJobs(orgSlug)

  if (!org) {
    notFound()
  }

  const jobs = org.checkIns
  const doorTypes = [...new Set(jobs.map((c) => c.doorType).filter((v): v is string => Boolean(v)))]
  // Trimmed before de-duplicating: "Huntsville " and "Huntsville" are one city.
  const cities = [...new Set(jobs.map((c) => c.city?.trim()).filter((v): v is string => Boolean(v)))]

  const normalizedWebsite =
    org.website && org.website.startsWith('http')
      ? org.website
      : org.website
        ? `https://${org.website}`
        : ''

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  // Build region description from cities
  const regionDescription =
    cities.length > 3
      ? `${cities.slice(0, 2).join(', ')} & surrounding areas`
      : cities.length > 0
        ? `${cities.join(', ')}`
        : ''

  // The owner's chosen cover photo leads if set and still part of the job; otherwise
  // fall back to the first uploaded photo. Same rule used on the individual job page.
  const coverOf = (photos: string[], featuredPhotoUrl: string | null) =>
    (featuredPhotoUrl && photos.includes(featuredPhotoUrl) ? featuredPhotoUrl : photos[0]) || null

  // Collect hero photos: one per job, up to 6, prioritizing jobs with more photos
  const jobsWithPhotos = jobs
    .map((job) => ({
      job,
      photos: job.photoUrls ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean) : [],
    }))
    .filter((j) => j.photos.length > 0)
    .sort((a, b) => b.photos.length - a.photos.length)

  const heroPhotos: string[] = []
  for (const { job, photos } of jobsWithPhotos) {
    if (heroPhotos.length >= 6) break
    const cover = coverOf(photos, job.featuredPhotoUrl)
    if (cover && !heroPhotos.includes(cover)) {
      heroPhotos.push(cover)
    }
  }

  // Account creation year
  const accountYear = org.createdAt ? new Date(org.createdAt).getFullYear() : new Date().getFullYear()
  const currentYear = new Date().getFullYear()
  const yearsInBusiness = currentYear - accountYear || 1

  // Prepare serializable job data with notes and timestamp
  const jobsData = jobs.map((job) => {
    const photos = job.photoUrls
      ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []
    const jobPath = buildJobPath(job, orgSlug)

    return {
      id: job.id,
      doorType: job.doorType || 'Job',
      city: job.city || '',
      state: job.state || '',
      photos,
      thumbnail: coverOf(photos, job.featuredPhotoUrl),
      thumbnailAlt: (() => {
        const cover = coverOf(photos, job.featuredPhotoUrl)
        return cover ? photoAlt(job, cover, Math.max(0, photos.indexOf(cover)), photos.length) : ''
      })(),
      title: jobHeading(job),
      jobPath,
      notes: job.notes || null,
      timestamp: job.timestamp ? job.timestamp.toISOString() : null,
    }
  })

  // Filter tabs: [{label, type, count}]
  const filterTabs = [
    { label: 'All', type: 'all', count: jobsData.length },
    ...doorTypes.map((dt) => ({
      label: dt,
      type: dt,
      count: jobsData.filter((j) => j.doorType === dt).length,
    })),
  ]

  // Same @id as the business node on every job page, so all pages describe
  // one business. Its address is the storefront address from the Google
  // Business Profile, or none for a service-area business that hides it.
  const storefront = parseStoredAddress(org.gbpBusinessAddress)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${baseUrl}/portfolio/${orgSlug}#business`,
    name: org.name,
    ...(org.phone && { telephone: org.phone }),
    ...(storefront && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: storefront.addressLines.join(', '),
        ...(storefront.locality && { addressLocality: storefront.locality }),
        ...(storefront.administrativeArea && { addressRegion: storefront.administrativeArea }),
        ...(storefront.postalCode && { postalCode: storefront.postalCode }),
        ...(storefront.regionCode && { addressCountry: storefront.regionCode }),
      },
    }),
    ...(normalizedWebsite && { url: normalizedWebsite }),
    ...(cities.length > 0 && {
      areaServed: cities.map((city) => ({
        '@type': 'Place',
        name: city,
      })),
    }),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: doorTypes.map((dt) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: dt,
        },
      })),
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${baseUrl}/` },
      { '@type': 'ListItem', position: 2, name: `${org.name} Portfolio`, item: `${baseUrl}/portfolio/${orgSlug}` },
    ],
  }

  return (
    <main className="min-h-screen bg-surface-50">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* All visual content rendered in the client component */}
      <PortfolioClient
        orgName={org.name}
        orgSlug={orgSlug}
        orgPhone={org.phone}
        normalizedWebsite={normalizedWebsite}
        regionDescription={regionDescription}
        heroPhotos={heroPhotos}
        jobCount={jobsData.length}
        yearsInBusiness={yearsInBusiness}
        jobs={jobsData}
        filterTabs={filterTabs}
        baseUrl={baseUrl}
      />
    </main>
  )
}
