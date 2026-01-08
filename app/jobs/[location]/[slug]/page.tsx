import { notFound } from 'next/navigation'
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

export default async function JobPage({ params }: JobPageProps) {
  const { slug } = params

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

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
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
                      alt={`Job photo ${index + 1}`}
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
