import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
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
  const firstPhoto = org.checkIns.find((c) => c.photoUrls)?.photoUrls?.split(',')[0]?.trim()

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
  const cities = [...new Set(jobs.map((c) => c.city).filter((v): v is string => Boolean(v)))]

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

  // Collect hero photos: one per job, up to 6, prioritizing jobs with more photos
  const jobsWithPhotos = jobs
    .map((job) => ({
      job,
      photos: job.photoUrls ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean) : [],
    }))
    .filter((j) => j.photos.length > 0)
    .sort((a, b) => b.photos.length - a.photos.length)

  const heroPhotos: string[] = []
  for (const { photos } of jobsWithPhotos) {
    if (heroPhotos.length >= 6) break
    if (photos[0] && !heroPhotos.includes(photos[0])) {
      heroPhotos.push(photos[0])
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
    const citySlug = slugify(job.city || '')
    const stateSlug = slugify(job.state || '')
    const doorTypeSlug = slugify(job.doorType || 'job')
    const jobPath = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${job.id}`

    return {
      id: job.id,
      doorType: job.doorType || 'Job',
      city: job.city || '',
      state: job.state || '',
      photos,
      thumbnail: photos[0] || null,
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: org.name,
    ...(org.phone && { telephone: org.phone }),
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

  return (
    <main className="min-h-screen bg-surface-50">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* All visual content rendered in the client component */}
      <PortfolioClient
        orgName={org.name}
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
