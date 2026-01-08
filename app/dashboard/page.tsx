'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { geocodeJobAddress } from '@/lib/geocode'

interface CheckIn {
  id: string
  timestamp: string
  installer: string
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes: string
  latitude?: number | null
  longitude?: number | null
  locationSource?: string | null
  isPublic: boolean
  photoUrls?: string[]
}

export default function Dashboard() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingRow, setDownloadingRow] = useState<number | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [publishWarnings, setPublishWarnings] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [editAddress, setEditAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  })

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[\/]+/g, '-') // replace slashes with hyphens
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumerics to hyphen
      .replace(/^-+|-+$/g, '') // trim hyphens

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/get-checkins-supabase')
      if (response.ok) {
        const data = await response.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (error) {
      console.error('Error fetching check-ins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (checkIn: CheckIn, idx: number) => {
    if (!checkIn.photoUrls || checkIn.photoUrls.length === 0) return
    setDownloadingRow(idx)
    try {
      const response = await fetch('/api/download-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoUrls: checkIn.photoUrls,
          installer: checkIn.installer,
          timestamp: checkIn.timestamp,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to download photos')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeInstaller = (checkIn.installer || 'checkin').replace(/[^a-z0-9-]/gi, '_')
      const time = new Date(checkIn.timestamp).getTime()
      link.href = url
      link.download = `${safeInstaller}-${isNaN(time) ? Date.now() : time}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      alert(error.message || 'Failed to download photos')
    } finally {
      setDownloadingRow(null)
    }
  }

  const handleDeletePhoto = async (checkIn: CheckIn, url: string) => {
    const confirmed = window.confirm('Remove this photo from the check-in?')
    if (!confirmed) return

    try {
      const response = await fetch('/api/checkins/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkIn.id, url }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete photo')
      }

      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id ? { ...c, photoUrls: data.photoUrls || [] } : c
        )
      )
    } catch (error: any) {
      alert(error.message || 'Failed to delete photo')
    }
  }

  const handleTogglePublish = async (checkIn: CheckIn) => {
    setTogglingId(checkIn.id)
    try {
      const response = await fetch('/api/checkins/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkIn.id, isPublic: !checkIn.isPublic }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update publish state')
      }

      const data = await response.json()
      const newIsPublic = data.checkIn?.isPublic as boolean | undefined
      const missingPhone = data.missingPhone as boolean | undefined
      const missingWebsite = data.missingWebsite as boolean | undefined

      if (typeof newIsPublic === 'boolean') {
        setCheckIns((prev) =>
          prev.map((c) => (c.id === checkIn.id ? { ...c, isPublic: newIsPublic } : c))
        )

        if (!checkIn.isPublic && newIsPublic) {
          let message = ''
          if (missingPhone && missingWebsite) {
            message =
              'Public page will not show company phone or website because they are not set in your business profile.'
          } else if (missingPhone) {
            message =
              'Public page will not show a company phone number because it is not set in your business profile.'
          } else if (missingWebsite) {
            message =
              'Public page will not show a business website because it is not set in your business profile.'
          }

          setPublishWarnings((prev) => {
            if (!message) {
              const { [checkIn.id]: _, ...rest } = prev
              return rest
            }
            return { ...prev, [checkIn.id]: message }
          })
        } else {
          setPublishWarnings((prev) => {
            const { [checkIn.id]: _, ...rest } = prev
            return rest
          })
        }
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update publish state')
    } finally {
      setTogglingId(null)
    }
  }

  const handleEditStart = (checkIn: CheckIn) => {
    setEditingId(checkIn.id)
    setEditAddress({
      street: checkIn.street || '',
      city: checkIn.city || '',
      state: checkIn.state || '',
      zip: checkIn.zip || '',
    })
  }

  const handleEditCancel = () => {
    setEditingId(null)
  }

  const handleEditSave = async (checkIn: CheckIn) => {
    setSavingId(checkIn.id)
    try {
      const jobAddress = `${editAddress.street}, ${editAddress.city}, ${editAddress.state} ${editAddress.zip || ''}`.trim()
      const geocoded = await geocodeJobAddress(jobAddress)
      const latitude = geocoded?.lat
      const longitude = geocoded?.lng

      const response = await fetch('/api/checkins/address', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checkIn.id,
          street: editAddress.street,
          city: editAddress.city,
          state: editAddress.state,
          zip: editAddress.zip,
          latitude,
          longitude,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update address')
      }

      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id
            ? {
                ...c,
                street: data.checkIn?.street ?? c.street,
                city: data.checkIn?.city ?? c.city,
                state: data.checkIn?.state ?? c.state,
                zip: data.checkIn?.zip ?? c.zip,
                latitude: data.checkIn?.latitude ?? c.latitude,
                longitude: data.checkIn?.longitude ?? c.longitude,
                locationSource: data.checkIn?.locationSource ?? c.locationSource,
              }
            : c
        )
      )
      setEditingId(null)
    } catch (error: any) {
      alert(error.message || 'Failed to update address')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <Link 
            href="/check-in"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            New Check-In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Total Check-Ins</h3>
            <p className="text-3xl font-bold text-blue-600">{checkIns.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Today</h3>
            <p className="text-3xl font-bold text-green-600">
              {checkIns.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Active Installers</h3>
            <p className="text-3xl font-bold text-purple-600">
              {new Set(checkIns.map(c => c.installer)).size}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-semibold">Recent Check-Ins</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">Loading...</div>
            ) : checkIns.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No check-ins yet</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Installer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Public</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checkIns.slice(0, 10).map((checkIn, index) => (
                    <tr key={checkIn.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(checkIn.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {checkIn.installer}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          {(() => {
                            const parts: string[] = []
                            if (checkIn.street) parts.push(checkIn.street)
                            if (checkIn.city) parts.push(checkIn.city)
                            const stateZip = [checkIn.state, checkIn.zip]
                              .filter(Boolean)
                              .join(' ')
                            if (stateZip) parts.push(stateZip)
                            return parts.join(', ') || '-'
                          })()}
                        </div>
                        {typeof checkIn.latitude === 'number' &&
                          typeof checkIn.longitude === 'number' && (
                            <a
                              href={`https://www.google.com/maps?q=${checkIn.latitude},${checkIn.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View on Map
                            </a>
                          )}
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={() => handleEditStart(checkIn)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit Address
                          </button>
                          {checkIn.locationSource === 'DEVICE' && (
                            <span className="text-amber-600">
                              Location based on installer device — please verify address
                            </span>
                          )}
                        </div>
                        {editingId === checkIn.id && (
                          <div className="mt-2 space-y-2">
                            <input
                              className="w-full rounded border px-2 py-1 text-sm"
                              value={editAddress.street}
                              onChange={(e) =>
                                setEditAddress((prev) => ({ ...prev, street: e.target.value }))
                              }
                              placeholder="Street"
                            />
                            <div className="flex gap-2">
                              <input
                                className="w-full rounded border px-2 py-1 text-sm"
                                value={editAddress.city}
                                onChange={(e) =>
                                  setEditAddress((prev) => ({ ...prev, city: e.target.value }))
                                }
                                placeholder="City"
                              />
                              <input
                                className="w-20 rounded border px-2 py-1 text-sm"
                                value={editAddress.state}
                                onChange={(e) =>
                                  setEditAddress((prev) => ({ ...prev, state: e.target.value }))
                                }
                                placeholder="State"
                              />
                              <input
                                className="w-24 rounded border px-2 py-1 text-sm"
                                value={editAddress.zip}
                                onChange={(e) =>
                                  setEditAddress((prev) => ({ ...prev, zip: e.target.value }))
                                }
                                placeholder="Zip"
                              />
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <button
                                type="button"
                                onClick={() => handleEditSave(checkIn)}
                                disabled={savingId === checkIn.id}
                                className="text-green-700 hover:underline disabled:text-gray-400"
                              >
                                {savingId === checkIn.id ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={handleEditCancel}
                                className="text-gray-500 hover:underline"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {checkIn.notes || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {checkIn.photoUrls && checkIn.photoUrls.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {checkIn.photoUrls.map((url, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  View{checkIn.photoUrls!.length > 1 ? ` ${idx + 1}` : ''}
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(checkIn, url)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => handleDownload(checkIn, index)}
                              disabled={downloadingRow === index}
                              className="text-sm text-green-600 hover:underline disabled:text-gray-400"
                            >
                              {downloadingRow === index ? 'Preparing...' : 'Download All'}
                            </button>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(checkIn)}
                          disabled={togglingId === checkIn.id}
                          className="text-xs text-blue-600 hover:underline disabled:text-gray-400"
                        >
                          {togglingId === checkIn.id
                            ? 'Saving...'
                            : checkIn.isPublic
                            ? 'Unpublish'
                            : 'Publish'}
                        </button>
                        {checkIn.isPublic && (
                          <div className="mt-1 text-xs">
                            {(() => {
                              const citySlug = slugify(checkIn.city || '')
                              const stateSlug = slugify(checkIn.state || '')
                              const doorTypeSlug = slugify(checkIn.doorType || 'job')
                              const base =
                                (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '') || ''
                              const path = `/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${doorTypeSlug}-${checkIn.id}`
                              const href = base ? `${base}${path}` : path
                              return (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  Public URL
                                </a>
                              )
                            })()}
                          </div>
                        )}
                        {publishWarnings[checkIn.id] && (
                          <div className="mt-1 text-xs text-amber-600">
                            {publishWarnings[checkIn.id]}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
