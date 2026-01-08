'use client'

import { useRouter } from 'next/navigation'

type PhotoRow = {
  checkInId: string
  photoUrl: string
  doorType: string
  location: string
  shortId: string
  totalClicks: number
}

export function ReportingPhotoTableBody({ rows }: { rows: PhotoRow[] }) {
  const router = useRouter()

  return (
    <tbody className="divide-y divide-gray-200">
      {rows.map((row) => (
        <tr
          key={`${row.checkInId}-${row.photoUrl}`}
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => router.push(`/reporting/jobs/${row.checkInId}`)}
        >
          <td className="px-6 py-4 text-sm text-gray-900">
            <img
              src={row.photoUrl}
              alt="Job photo"
              className="h-16 w-24 object-cover rounded"
            />
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.doorType}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.location}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.shortId}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.totalClicks}</td>
        </tr>
      ))}
    </tbody>
  )
}

