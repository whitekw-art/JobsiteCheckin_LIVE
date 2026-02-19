import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

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

  const title = `${org.name} — Completed Jobs Portfolio`
  const description =
    doorTypes.length > 0 && cities.length > 0
      ? `${org.name} has completed ${org.checkIns.length} jobs including ${doorTypes.slice(0, 3).join(', ')} in ${cities.slice(0, 3).join(', ')}.`
      : `View ${org.name}'s portfolio of ${org.checkIns.length} completed jobs.`

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/portfolio/${orgSlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
  const cities = [...new Set(jobs.map((c) => c.city).filter(Boolean))]
  const doorTypes = [...new Set(jobs.map((c) => c.doorType).filter(Boolean))]

  const normalizedWebsite =
    org.website && org.website.startsWith('http')
      ? org.website
      : org.website
        ? `https://${org.website}`
        : ''

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: org.name,
    ...(org.phone && { telephone: org.phone }),
    ...(normalizedWebsite && { url: normalizedWebsite }),
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
    <main className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="max-w-6xl mx-auto">
        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Header */}
        <header className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{org.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm">
            {org.phone && (
              <a
                href={`tel:${org.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline min-h-[44px] min-w-[44px]"
              >
                {org.phone}
              </a>
            )}
            {normalizedWebsite && (
              <a
                href={normalizedWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:underline min-h-[44px] min-w-[44px]"
              >
                {org.website}
              </a>
            )}
          </div>
        </header>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{jobs.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">
              {jobs.length === 1 ? 'Job' : 'Jobs'} Completed
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-600">{cities.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">
              {cities.length === 1 ? 'City' : 'Cities'} Served
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{doorTypes.length}</p>
            <p className="text-xs sm:text-sm text-gray-600">
              {doorTypes.length === 1 ? 'Door Type' : 'Door Types'}
            </p>
          </div>
        </div>

        {/* Job Cards Grid */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No published jobs yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {jobs.map((job) => {
              const photos = job.photoUrls
                ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
                : []
              const thumbnail = photos[0] || null
              const citySlug = slugify(job.city || '')
              const stateSlug = slugify(job.state || '')
              const doorTypeSlug = slugify(job.doorType || 'job')
              const jobPath = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${job.id}`

              return (
                <Link
                  key={job.id}
                  href={jobPath}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow min-h-[44px]"
                >
                  {thumbnail ? (
                    <div className="aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={thumbnail}
                        alt={`${job.doorType || 'Job'}${job.street ? ` at ${job.street}` : ''} in ${job.city || 'Unknown'}, ${job.state || ''}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
                      No photo
                    </div>
                  )}
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {job.doorType || 'Job'}
                    </h3>
                    {job.street && (
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {job.street}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {[job.city, job.state, job.zip].filter(Boolean).join(', ') || 'Location unavailable'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
