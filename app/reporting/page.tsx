import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { ReportingJobTableBody } from '@/components/ReportingJobTableBody'
import { ReportingPhotoTableBody } from '@/components/ReportingPhotoTableBody'

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

export default async function ReportingPage({
  searchParams,
}: {
  searchParams?: Promise<{
    page?: string
    sort?: string
    dir?: string
    photoSort?: string
    photoDir?: string
  }>
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams)
  const currentUser = await getCurrentUser()

  if (!currentUser || !currentUser.organizationId) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Reporting &amp; Key Metrics</h1>
          <p className="text-gray-600">No organization is linked to this account.</p>
        </div>
      </main>
    )
  }

  const grouped = await prisma.checkInEvent.groupBy({
    by: ['eventType'],
    where: {
      checkIn: {
        organizationId: currentUser.organizationId,
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

  const checkIns = await prisma.checkIn.findMany({
    where: {
      organizationId: currentUser.organizationId,
    },
    select: {
      id: true,
      doorType: true,
      city: true,
      state: true,
      timestamp: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
  })

  const eventRows = await prisma.checkInEvent.groupBy({
    by: ['checkInId', 'eventType'],
    where: {
      checkIn: {
        organizationId: currentUser.organizationId,
      },
      eventType: {
        in: ['PAGE_VIEW', 'page_view', 'PHOTO_CLICK', 'photo_click', 'WEBSITE_CLICK', 'website_click', 'PHONE_CLICK', 'phone_click'],
      },
    },
    _count: {
      _all: true,
    },
  })

  const eventMap = new Map<
    string,
    { pageViews: number; photoClicks: number; websiteClicks: number; phoneClicks: number }
  >()

  for (const row of eventRows) {
    const existing = eventMap.get(row.checkInId) || {
      pageViews: 0,
      photoClicks: 0,
      websiteClicks: 0,
      phoneClicks: 0,
    }

    const et = row.eventType.toUpperCase()
    if (et === 'PAGE_VIEW') existing.pageViews += row._count._all
    if (et === 'PHOTO_CLICK') existing.photoClicks += row._count._all
    if (et === 'WEBSITE_CLICK') existing.websiteClicks += row._count._all
    if (et === 'PHONE_CLICK') existing.phoneClicks += row._count._all

    eventMap.set(row.checkInId, existing)
  }

  const rows = checkIns.map((checkIn) => {
    const metrics = eventMap.get(checkIn.id) || {
      pageViews: 0,
      photoClicks: 0,
      websiteClicks: 0,
      phoneClicks: 0,
    }

    let status = 'Underperforming'
    if (metrics.websiteClicks > 0 || metrics.phoneClicks > 0) {
      status = 'High Intent'
    } else if (metrics.photoClicks > 0) {
      status = 'High Interest'
    } else if (metrics.pageViews > 0) {
      status = 'Underperforming'
    }

    return {
      ...checkIn,
      ...metrics,
      status,
    }
  })

  const sortField = resolvedSearchParams?.sort || 'pageViews'
  const sortDir = resolvedSearchParams?.dir === 'asc' ? 'asc' : 'desc'

  const sortableFields = new Set([
    'pageViews',
    'photoClicks',
    'websiteClicks',
    'phoneClicks',
  ])

  if (sortableFields.has(sortField)) {
    rows.sort((a, b) => {
      const left = a[sortField as keyof typeof a] as number
      const right = b[sortField as keyof typeof a] as number
      return sortDir === 'asc' ? left - right : right - left
    })
  }

  const pageSize = 25
  const currentPage = Math.max(1, Number.parseInt(resolvedSearchParams?.page || '1', 10) || 1)
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const buildPageLink = (page: number, sort: string, dir: string) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (sort) params.set('sort', sort)
    if (dir) params.set('dir', dir)
    return `/reporting?${params.toString()}`
  }

  const toggleDir = (field: string) => {
    if (sortField !== field) return 'desc'
    return sortDir === 'asc' ? 'desc' : 'asc'
  }

  const photoEvents = await prisma.checkInEvent.findMany({
    where: {
      eventType: { in: ['PHOTO_CLICK', 'photo_click'] },
      metadata: {
        not: null,
      },
      checkIn: {
        organizationId: currentUser.organizationId,
      },
    },
    select: {
      checkInId: true,
      metadata: true,
      checkIn: {
        select: {
          doorType: true,
          city: true,
          state: true,
        },
      },
    },
  })

  const photoMap = new Map<
    string,
    {
      checkInId: string
      photoUrl: string
      photoIndex: number
      doorType: string
      location: string
      totalClicks: number
    }
  >()

  for (const event of photoEvents) {
    if (!event.metadata) continue
    try {
      const parsed = JSON.parse(event.metadata) as {
        photoIndex?: number
        photoUrl?: string
      }

      if (typeof parsed.photoIndex !== 'number' || !parsed.photoUrl) continue

      const doorType = event.checkIn?.doorType || 'Job'
      const locationParts = [event.checkIn?.city, event.checkIn?.state].filter(Boolean)
      const location = locationParts.join(', ')
      const key = `${event.checkInId}:${parsed.photoIndex}`

      const existing = photoMap.get(key)
      if (existing) {
        existing.totalClicks += 1
      } else {
        photoMap.set(key, {
          checkInId: event.checkInId,
          photoUrl: parsed.photoUrl,
          photoIndex: parsed.photoIndex,
          doorType,
          location: location || 'Unknown',
          totalClicks: 1,
        })
      }
    } catch {
      // ignore bad metadata
    }
  }

  const photoRows = Array.from(photoMap.values()).map((row) => ({
    checkInId: row.checkInId,
    photoUrl: row.photoUrl,
    doorType: row.doorType,
    location: row.location,
    shortId: row.checkInId.slice(0, 8),
    totalClicks: row.totalClicks,
  }))

  const photoSortField = resolvedSearchParams?.photoSort || 'totalClicks'
  const photoSortDir = resolvedSearchParams?.photoDir === 'asc' ? 'asc' : 'desc'

  const photoSortableFields = new Set(['totalClicks', 'doorType', 'location'])

  if (photoSortableFields.has(photoSortField)) {
    photoRows.sort((a, b) => {
      if (photoSortField === 'totalClicks') {
        return photoSortDir === 'asc'
          ? a.totalClicks - b.totalClicks
          : b.totalClicks - a.totalClicks
      }
      const left = (a[photoSortField as keyof typeof a] as string).toLowerCase()
      const right = (b[photoSortField as keyof typeof b] as string).toLowerCase()
      if (left === right) return 0
      const order = left < right ? -1 : 1
      return photoSortDir === 'asc' ? order : -order
    })
  }

  const buildPhotoLink = (sort: string, dir: string) => {
    const params = new URLSearchParams()
    params.set('page', String(safePage))
    params.set('sort', sortField)
    params.set('dir', sortDir)
    params.set('photoSort', sort)
    params.set('photoDir', dir)
    return `/reporting?${params.toString()}`
  }

  const tableRows = pageRows.map((row) => {
    const jobTitleParts = [
      row.doorType || 'Job',
      [row.city, row.state].filter(Boolean).join(', '),
    ].filter(Boolean)
    const jobTitle = jobTitleParts.join(' • ')
    const createdDate = row.timestamp
      ? new Date(row.timestamp).toLocaleDateString()
      : ''

    const statusStyles =
      row.status === 'High Intent'
        ? 'bg-emerald-100 text-emerald-700'
        : row.status === 'High Interest'
        ? 'bg-blue-100 text-blue-700'
        : 'bg-gray-100 text-gray-600'

    return {
      id: row.id,
      jobTitle,
      createdDate,
      pageViews: row.pageViews,
      photoClicks: row.photoClicks,
      websiteClicks: row.websiteClicks,
      phoneClicks: row.phoneClicks,
      status: row.status,
      statusStyles,
    }
  })

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold">Reporting &amp; Key Metrics</h1>
          <p className="text-gray-600 mt-1">Engagement metrics for your published job pages.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Total Job Page Views</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PAGE_VIEW}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Website Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.WEBSITE_CLICK}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Phone Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PHONE_CLICK}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <p className="text-sm text-gray-500">Photo Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{counts.PHOTO_CLICK}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Per-Job Performance</h2>
          </div>
          <div className="overflow-x-auto">
            {pageRows.length === 0 ? (
              <div className="p-6 text-gray-600">No job performance data yet.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPageLink(1, 'pageViews', toggleDir('pageViews'))}
                        className="hover:underline"
                      >
                        Page Views
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPageLink(1, 'photoClicks', toggleDir('photoClicks'))}
                        className="hover:underline"
                      >
                        Photo Clicks
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPageLink(1, 'websiteClicks', toggleDir('websiteClicks'))}
                        className="hover:underline"
                      >
                        Website Clicks
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPageLink(1, 'phoneClicks', toggleDir('phoneClicks'))}
                        className="hover:underline"
                      >
                        Phone Clicks
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <ReportingJobTableBody rows={tableRows} />
              </table>
            )}
          </div>
          {pageRows.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t text-sm text-gray-600">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={buildPageLink(Math.max(1, safePage - 1), sortField, sortDir)}
                  className={`px-3 py-1 rounded border ${
                    safePage === 1 ? 'text-gray-400 border-gray-200 pointer-events-none' : 'hover:bg-gray-50'
                  }`}
                >
                  Prev
                </Link>
                <Link
                  href={buildPageLink(Math.min(totalPages, safePage + 1), sortField, sortDir)}
                  className={`px-3 py-1 rounded border ${
                    safePage === totalPages ? 'text-gray-400 border-gray-200 pointer-events-none' : 'hover:bg-gray-50'
                  }`}
                >
                  Next
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Top Performing Photos</h2>
          </div>
          <div className="overflow-x-auto">
            {photoRows.length === 0 ? (
              <div className="p-6 text-gray-600">No photo click data yet.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPhotoLink('doorType', photoSortField === 'doorType' && photoSortDir === 'asc' ? 'desc' : 'asc')}
                        className="hover:underline"
                      >
                        Door Type
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPhotoLink('location', photoSortField === 'location' && photoSortDir === 'asc' ? 'desc' : 'asc')}
                        className="hover:underline"
                      >
                        Location
                      </Link>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Link
                        href={buildPhotoLink('totalClicks', photoSortField === 'totalClicks' && photoSortDir === 'asc' ? 'desc' : 'asc')}
                        className="hover:underline"
                      >
                        Total Clicks
                      </Link>
                    </th>
                  </tr>
                </thead>
                <ReportingPhotoTableBody rows={photoRows} />
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
