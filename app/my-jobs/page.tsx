'use client'

import { useState, useEffect } from 'react'
import { geocodeJobAddress } from '@/lib/geocode'

interface CheckIn {
  id: string
  timestamp: string
  installer: string
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes?: string | null
  latitude?: number | null
  longitude?: number | null
  locationSource?: string | null
  doorType?: string | null
  isPublic: boolean
  photoUrls?: string[]
}

const EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

function isEditable(timestamp: string): boolean {
  return Date.now() - new Date(timestamp).getTime() <= EDIT_WINDOW_MS
}

function formatAddress(checkIn: CheckIn): string {
  const parts: string[] = []
  if (checkIn.street) parts.push(checkIn.street)
  if (checkIn.city) parts.push(checkIn.city)
  const stateZip = [checkIn.state, checkIn.zip].filter(Boolean).join(' ')
  if (stateZip) parts.push(stateZip)
  return parts.join(', ') || 'No address'
}

function daysRemaining(timestamp: string): number {
  const elapsed = Date.now() - new Date(timestamp).getTime()
  const remaining = EDIT_WINDOW_MS - elapsed
  return Math.max(0, Math.ceil(remaining / (24 * 60 * 60 * 1000)))
}

export default function MyJobsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Edit state
  const [editStreet, setEditStreet] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editState, setEditState] = useState('')
  const [editZip, setEditZip] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDoorType, setEditDoorType] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  useEffect(() => {
    fetchCheckIns()
  }, [])

  const fetchCheckIns = async () => {
    try {
      const response = await fetch('/api/my-checkins')
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

  const handleExpand = (checkIn: CheckIn) => {
    if (expandedId === checkIn.id) {
      setExpandedId(null)
      setMessage('')
      return
    }
    setExpandedId(checkIn.id)
    setEditStreet(checkIn.street || '')
    setEditCity(checkIn.city || '')
    setEditState(checkIn.state || '')
    setEditZip(checkIn.zip || '')
    setEditNotes(checkIn.notes || '')
    setEditDoorType(checkIn.doorType || '')
    setMessage('')
  }

  const handleSave = async (checkIn: CheckIn) => {
    setSaving(true)
    setMessage('')
    try {
      const jobAddress = `${editStreet}, ${editCity}, ${editState} ${editZip}`.trim()
      const geocoded = await geocodeJobAddress(jobAddress)

      const response = await fetch(`/api/my-checkins/${checkIn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          street: editStreet,
          city: editCity,
          state: editState,
          zip: editZip,
          notes: editNotes,
          doorType: editDoorType,
          latitude: geocoded?.lat,
          longitude: geocoded?.lng,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkIn.id ? data.checkIn : c))
      )
      setMessage('Changes saved.')
    } catch (error: any) {
      setMessage(error.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleAddPhoto = async (checkIn: CheckIn, file: File) => {
    setUploadingPhoto(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const uploadRes = await fetch('/api/upload-photo', {
        method: 'POST',
        body: formData,
      })

      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Failed to upload photo')
      }

      const response = await fetch(`/api/my-checkins/${checkIn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addPhotoUrls: [uploadData.photoUrl] }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add photo')
      }

      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkIn.id ? data.checkIn : c))
      )
      setMessage('Photo added.')
    } catch (error: any) {
      setMessage(error.message || 'Failed to add photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async (checkIn: CheckIn, url: string) => {
    if (!window.confirm('Remove this photo?')) return
    setMessage('')
    try {
      const response = await fetch(`/api/my-checkins/${checkIn.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removePhotoUrl: url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove photo')
      }

      setCheckIns((prev) =>
        prev.map((c) => (c.id === checkIn.id ? data.checkIn : c))
      )
      setMessage('Photo removed.')
    } catch (error: any) {
      setMessage(error.message || 'Failed to remove photo')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto text-center py-12 text-gray-500">
          Loading your jobs...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <span className="text-sm text-gray-500">
            {checkIns.length} check-in{checkIns.length !== 1 ? 's' : ''}
          </span>
        </div>

        {checkIns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No check-ins yet. Submit your first check-in to see it here.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {checkIns.map((checkIn) => {
              const editable = checkIn.timestamp ? isEditable(checkIn.timestamp) : false
              const isExpanded = expandedId === checkIn.id
              const days = checkIn.timestamp ? daysRemaining(checkIn.timestamp) : 0
              const firstPhoto =
                checkIn.photoUrls && checkIn.photoUrls.length > 0
                  ? checkIn.photoUrls[0]
                  : null

              return (
                <div
                  key={checkIn.id}
                  className={`bg-white rounded-lg shadow overflow-hidden ${
                    isExpanded ? 'sm:col-span-2 lg:col-span-3' : ''
                  }`}
                >
                  {/* Card header — always visible */}
                  <div
                    className={`cursor-pointer ${!isExpanded ? 'hover:bg-gray-50' : ''}`}
                    onClick={() => handleExpand(checkIn)}
                  >
                    {/* Photo thumbnail */}
                    {firstPhoto ? (
                      <div className="w-full h-48 bg-gray-100">
                        <img
                          src={firstPhoto}
                          alt={formatAddress(checkIn)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                        No photo
                      </div>
                    )}

                    {/* Card info */}
                    <div className="p-4">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {formatAddress(checkIn)}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {checkIn.timestamp
                            ? new Date(checkIn.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'No date'}
                        </span>
                        {checkIn.doorType && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                            {checkIn.doorType}
                          </span>
                        )}
                      </div>
                      {checkIn.photoUrls && checkIn.photoUrls.length > 1 && (
                        <p className="text-xs text-gray-400 mt-1">
                          {checkIn.photoUrls.length} photos
                        </p>
                      )}
                      <div className="mt-2">
                        {editable ? (
                          <span className="text-xs text-green-600">
                            {days} day{days !== 1 ? 's' : ''} left to edit
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            Editing locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded inline edit */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4">
                      {/* All photos */}
                      {checkIn.photoUrls && checkIn.photoUrls.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Photos</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {checkIn.photoUrls.map((url, idx) => (
                              <div key={idx} className="relative group">
                                <a href={url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={url}
                                    alt={`Photo ${idx + 1}`}
                                    className="w-full h-32 object-cover rounded"
                                  />
                                </a>
                                {editable && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemovePhoto(checkIn, url)
                                    }}
                                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Add photo */}
                      {editable && (
                        <div className="mt-3">
                          <label className="text-sm text-blue-600 cursor-pointer hover:underline">
                            {uploadingPhoto ? 'Uploading...' : '+ Add photo'}
                            <input
                              type="file"
                              accept="image/jpeg,image/jpg,image/png"
                              className="hidden"
                              disabled={uploadingPhoto}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleAddPhoto(checkIn, file)
                                e.target.value = ''
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {/* Edit form */}
                      {editable ? (
                        <div className="mt-4 space-y-3">
                          <p className="text-sm font-medium text-gray-700">Edit Details</p>
                          <input
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Street"
                            value={editStreet}
                            onChange={(e) => setEditStreet(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <input
                              className="flex-1 p-2 border rounded text-sm"
                              placeholder="City"
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                            />
                            <input
                              className="w-20 p-2 border rounded text-sm"
                              placeholder="State"
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                            />
                            <input
                              className="w-24 p-2 border rounded text-sm"
                              placeholder="Zip"
                              value={editZip}
                              onChange={(e) => setEditZip(e.target.value)}
                            />
                          </div>
                          <select
                            className="w-full p-2 border rounded text-sm"
                            value={editDoorType}
                            onChange={(e) => setEditDoorType(e.target.value)}
                          >
                            <option value="">Door Type</option>
                            <option value="Wood Door">Wood Door</option>
                            <option value="Iron Door">Iron Door</option>
                            <option value="Fiberglass Front Door">Fiberglass Front Door</option>
                            <option value="Fiberglass Back / Patio Door">Fiberglass Back / Patio Door</option>
                            <option value="Barn Door">Barn Door</option>
                          </select>
                          <textarea
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Notes"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            rows={3}
                          />

                          {message && expandedId === checkIn.id && (
                            <p className={`text-sm ${message.startsWith('Failed') || message.startsWith('Edit') ? 'text-red-600' : 'text-green-600'}`}>
                              {message}
                            </p>
                          )}

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleSave(checkIn)}
                              disabled={saving}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedId(null)
                                setMessage('')
                              }}
                              className="text-gray-500 px-4 py-2 rounded text-sm hover:text-gray-700"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 space-y-2 text-sm text-gray-600">
                          <p className="font-medium text-gray-700">Details</p>
                          <p><span className="text-gray-500">Address:</span> {formatAddress(checkIn)}</p>
                          {checkIn.doorType && (
                            <p><span className="text-gray-500">Door Type:</span> {checkIn.doorType}</p>
                          )}
                          {checkIn.notes && (
                            <p><span className="text-gray-500">Notes:</span> {checkIn.notes}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Editing locked. Contact your manager to make changes.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
