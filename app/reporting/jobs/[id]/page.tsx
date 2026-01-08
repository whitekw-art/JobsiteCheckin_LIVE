import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

type EventCounts = {
  PAGE_VIEW: number
  WEBSITE_CLICK: number
  PHONE_CLICK: number
  PHOTO_CLICK: number
}

const emptyCounts: EventCounts = {
  PAGE_VIEW: 0,
  WEBSITE_CLICK: 0,
  PHONE_CLICK: 0,
  PHOTO_CLICK: 0,
}

type PhotoMetric = {
  url: string
  clicks: number
}

export default async function ReportingJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = await params
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.organizationId) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Job Analytics</h1>
          <p className="text-gray-600">No organization is linked to this account.</p>
        </div>
      </main>
    )
  }

  const checkIn = await prisma.checkIn.findFirst({
    where: {
      id: resolvedParams.id,
      organizationId: currentUser.organizationId,
    },
    select: {
      id: true,
      doorType: true,
      city: true,
      state: true,
      timestamp: true,
      photoUrls: true,
    },
  })

  if (!checkIn) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Job Analytics</h1>
          <p className="text-gray-600">Job not found.</p>
        </div>
      </main>
    )
  }

  const grouped = await prisma.checkInEvent.groupBy({
    by: ['eventType'],
    where: {
      checkInId: checkIn.id,
      eventType: {
        in: ['PAGE_VIEW', 'PHOTO_CLICK', 'WEBSITE_CLICK', 'PHONE_CLICK'],
      },
    },
    _count: {
      _all: true,
    },
  })

  const counts = grouped.reduce<EventCounts>((acc, row) => {
    const type = row.eventType as keyof EventCounts
    if (type in acc) {
      acc[type] = row._count._all
    }
    return acc
  }, { ...emptyCounts })

  const photoClickEvents = await prisma.checkInEvent.findMany({
    where: {
      checkInId: checkIn.id,
      eventType: 'PHOTO_CLICK',
    },
  })

  const photoUrls = checkIn.photoUrls
    ? checkIn.photoUrls.split(',').map((value) => value.trim()).filter(Boolean)
    : []

  const photoClickCounts = new Map<number, number>()
  for (const event of photoClickEvents) {
    if (!event.metadata) continue
    try {
      const parsed = JSON.parse(event.metadata) as { photoIndex?: number }
      if (typeof parsed.photoIndex === 'number') {
        photoClickCounts.set(
          parsed.photoIndex,
          (photoClickCounts.get(parsed.photoIndex) || 0) + 1
        )
      }
    } catch {
      // ignore bad metadata
    }
  }

  const photoMetrics: PhotoMetric[] = photoUrls.map((url, index) => ({
    url,
    clicks: photoClickCounts.get(index) || 0,
  }))

  const jobTitleParts = [
    checkIn.doorType || 'Job',
    [checkIn.city, checkIn.state].filter(Boolean).join(', '),
  ].filter(Boolean)
  const jobTitle = jobTitleParts.join(' • ')
  const createdDate = checkIn.timestamp
    ? new Date(checkIn.timestamp).toLocaleDateString()
    : ''

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Job Analytics</h1>
              <p className="text-gray-600 mt-1">{jobTitle}</p>
              {createdDate && <p className="text-xs text-gray-500 mt-1">{createdDate}</p>}
            </div>
            <Link href="/reporting" className="text-sm text-blue-600 hover:underline">
              Back to Reporting
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Page Views</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PAGE_VIEW}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Photo Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PHOTO_CLICK}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Website Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.WEBSITE_CLICK}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Phone Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PHONE_CLICK}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Photo Clicks by Image</h2>
          {photoMetrics.length === 0 ? (
            <p className="text-gray-600">No photos available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photoMetrics.map((photo) => (
                <div key={photo.url} className="border rounded-lg p-3">
                  <img
                    src={photo.url}
                    alt="Job photo"
                    className="w-full h-auto rounded"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Clicks: <span className="font-semibold">{photo.clicks}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
