'use client'

import { useRouter } from 'next/navigation'

type ReportingRow = {
  id: string
  jobTitle: string
  createdDate: string
  pageViews: number
  photoClicks: number
  websiteClicks: number
  phoneClicks: number
  status: string
  statusStyles: string
}

export function ReportingJobTableBody({ rows }: { rows: ReportingRow[] }) {
  const router = useRouter()

  return (
    <tbody className="divide-y divide-gray-200">
      {rows.map((row) => (
        <tr
          key={row.id}
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => router.push(`/reporting/jobs/${row.id}`)}
        >
          <td className="px-6 py-4 text-sm text-gray-900">
            <div className="font-medium">{row.jobTitle}</div>
            {row.createdDate && (
              <div className="text-xs text-gray-500">{row.createdDate}</div>
            )}
          </td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.pageViews}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.photoClicks}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.websiteClicks}</td>
          <td className="px-6 py-4 text-sm text-gray-900">{row.phoneClicks}</td>
          <td className="px-6 py-4 text-sm">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${row.statusStyles}`}>
              {row.status}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  )
}

