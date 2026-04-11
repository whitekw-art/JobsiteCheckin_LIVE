'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { geocodeJobAddress } from '@/lib/geocode'
import imageCompression from 'browser-image-compression'
import DashboardShell from '@/components/DashboardShell'
import '@/styles/checkin.css'

export default function CheckInPage() {
  const { data: session } = useSession()
  const [installer, setInstaller] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [doorType, setDoorType] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [photoLocation, setPhotoLocation] = useState<{ lat: number; lng: number } | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const userRole = session?.user?.role
  const isUserRole = userRole === 'USER'

  useEffect(() => {
    if (isUserRole) setInstaller(session?.user?.name || '')
  }, [isUserRole, session?.user?.name])

  // ── EXIF GPS extraction (unchanged from original) ─────────────────────────
  const extractExifLocation = (file: File): Promise<{ lat: number; lng: number } | null> => {
    const readGpsFromBuffer = (arrayBuffer: ArrayBuffer): { lat: number; lng: number } | null => {
      const view = new DataView(arrayBuffer)
      if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null
      const typeSizes: Record<number, number> = { 1:1, 2:1, 3:2, 4:4, 5:8, 7:1, 9:4, 10:8 }
      const getString = (start: number, length: number) => {
        let str = ''
        for (let i = 0; i < length; i++) {
          const c = view.getUint8(start + i)
          if (c === 0) break
          str += String.fromCharCode(c)
        }
        return str
      }
      const readRationalArray = (start: number, count: number, le: boolean) => {
        const vals: number[] = []
        for (let i = 0; i < count; i++) {
          const n = view.getUint32(start + i * 8, le)
          const d = view.getUint32(start + i * 8 + 4, le)
          vals.push(d ? n / d : 0)
        }
        return vals
      }
      const dmsToDecimal = (dms: number[], ref: string) => {
        if (dms.length !== 3) return null
        const [deg, min, sec] = dms
        let dec = deg + min / 60 + sec / 3600
        if (ref === 'S' || ref === 'W') dec = -dec
        return dec
      }
      let offset = 2
      while (offset < view.byteLength - 1) {
        const marker = view.getUint16(offset); offset += 2
        if (marker === 0xffda || marker === 0xffd9) break
        const length = view.getUint16(offset); offset += 2
        if (marker === 0xffe1 && getString(offset, 4) === 'Exif') {
          const tiffStart = offset + 6
          const le = view.getUint16(tiffStart) === 0x4949
          const ifd0 = tiffStart + view.getUint32(tiffStart + 4, le)
          const entries = view.getUint16(ifd0, le)
          let gpsOffset = 0
          for (let i = 0; i < entries; i++) {
            const e = ifd0 + 2 + i * 12
            if (view.getUint16(e, le) === 0x8825) { gpsOffset = view.getUint32(e + 8, le); break }
          }
          if (!gpsOffset) return null
          const gpsIFD = tiffStart + gpsOffset
          const gpsEntries = view.getUint16(gpsIFD, le)
          let latRef = '', lonRef = '', latVals: number[] | null = null, lonVals: number[] | null = null
          for (let i = 0; i < gpsEntries; i++) {
            const e = gpsIFD + 2 + i * 12
            const tag = view.getUint16(e, le)
            const type = view.getUint16(e + 2, le)
            const count = view.getUint32(e + 4, le)
            const vOff = e + 8
            const byteLen = (typeSizes[type] || 0) * count
            const actual = byteLen > 4 ? tiffStart + view.getUint32(vOff, le) : vOff
            if (tag === 0x0001) latRef = getString(actual, count).trim()
            else if (tag === 0x0003) lonRef = getString(actual, count).trim()
            else if (tag === 0x0002 && type === 5) latVals = readRationalArray(actual, count, le)
            else if (tag === 0x0004 && type === 5) lonVals = readRationalArray(actual, count, le)
          }
          if (latRef && lonRef && latVals && lonVals) {
            const lat = dmsToDecimal(latVals, latRef)
            const lng = dmsToDecimal(lonVals, lonRef)
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng))
              return { lat, lng }
          }
          return null
        } else { offset += length - 2 }
      }
      return null
    }
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try { resolve(readGpsFromBuffer(e.target?.result as ArrayBuffer)) }
        catch { resolve(null) }
      }
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    })
  }

  // ── Photo handling ────────────────────────────────────────────────────────

  const addFiles = async (files: File[], append: boolean) => {
    const supported = files.filter((f) =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(f.type.toLowerCase()) ||
      f.name.toLowerCase().match(/\.(jpe?g|png)$/)
    )
    if (supported.length === 0) return

    const nextPhotos = append ? [...photos, ...supported] : supported
    const newPreviews = supported.map((f) => URL.createObjectURL(f))
    const nextPreviews = append ? [...photoPreviews, ...newPreviews] : newPreviews

    setPhotos(nextPhotos)
    setPhotoPreviews(nextPreviews)

    // Extract EXIF from the first new photo
    const exif = await extractExifLocation(supported[0])
    if (exif?.lat != null && exif?.lng != null) {
      setPhotoLocation(exif)
    } else if (!append) {
      setPhotoLocation(null)
    }
  }

  // Camera: appends one photo at a time
  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) addFiles(files, true)
    e.target.value = '' // reset so same shot can be retaken
  }

  // Library: replaces (existing behavior)
  const handleLibraryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    addFiles(files, false)
    e.target.value = ''
  }

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviews[idx])
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  // ── Submit (logic unchanged) ──────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('HANDLE_SUBMIT_RUNNING')
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const gpsPromise = navigator.geolocation
      ? new Promise<{ lat: number; lng: number } | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
          )
        })
      : Promise.resolve(null)

    try {
      const jobAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}`.trim()

      const resolveLocation = async () => {
        console.log('RESOLVE_LOCATION_RUNNING', new Date().toISOString())
        if (photoLocation && Number.isFinite(photoLocation.lat) && Number.isFinite(photoLocation.lng)) {
          return { latitude: photoLocation.lat, longitude: photoLocation.lng, locationSource: 'EXIF' as const }
        }
        let geocoded = null
        try {
          geocoded = await Promise.race([
            geocodeJobAddress(jobAddress),
            new Promise<null>((r) => setTimeout(() => r(null), 2000)),
          ])
        } catch { geocoded = null }
        if (geocoded && Number.isFinite(geocoded.lat) && Number.isFinite(geocoded.lng)) {
          return { latitude: geocoded.lat, longitude: geocoded.lng, locationSource: 'ADDRESS' as const }
        }
        console.log('RESOLVE_LOCATION_BEFORE_GPS')
        const gps = await gpsPromise
        if (gps && Number.isFinite(gps.lat) && Number.isFinite(gps.lng)) {
          console.log('GPS_SUCCESS_RAW', gps)
          return { latitude: gps.lat, longitude: gps.lng, locationSource: 'DEVICE' as const }
        }
        console.log('RESOLVE_LOCATION_RETURN_NULL')
        return { latitude: null, longitude: null, locationSource: 'DEVICE' as const }
      }

      console.log('PHOTO_LOCATION_AT_SUBMIT', photoLocation)
      const resolved = await resolveLocation()
      console.log('RESOLVE_LOCATION_RESULT', resolved)

      const uploadedUrls: string[] = []
      for (const file of photos) {
        const compressed = await imageCompression(file, {
          maxSizeMB: 3,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        })
        const formData = new FormData()
        formData.append('photo', compressed)
        const uploadRes = await fetch('/api/upload-photo', { method: 'POST', body: formData })
        const uploadData = await uploadRes.json()
        uploadedUrls.push(uploadData.photoUrl)
      }

      const res = await fetch('/api/submit-checkin-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installer,
          street,
          city,
          state,
          zip,
          doorType,
          notes,
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          locationSource: resolved.locationSource,
          photoUrls: uploadedUrls,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to submit check-in')
      }

      setMessageType('success')
      setMessage('Check-in submitted successfully!')
      setInstaller(isUserRole ? session?.user?.name || '' : '')
      setStreet(''); setCity(''); setState(''); setZip('')
      setDoorType(''); setNotes('')
      setPhotos([]); setPhotoPreviews([]); setPhotoLocation(null)

    } catch (err: any) {
      setMessageType('error')
      setMessage(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const states = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY',
  ]

  return (
    <DashboardShell title="New Check-In">
      <div className="ci-card">
        <div className="ci-body">
          <form className="ci-form" onSubmit={handleSubmit}>

            {/* Installer */}
            <div className="ci-field">
              <label className="ci-label" htmlFor="installer">Employee Name</label>
              <input
                id="installer"
                className="ci-input"
                placeholder="Enter Name"
                value={installer}
                onChange={(e) => setInstaller(e.target.value)}
                readOnly={isUserRole}
              />
            </div>

            {/* Street */}
            <div className="ci-field">
              <label className="ci-label" htmlFor="street">Street</label>
              <input
                id="street"
                className="ci-input"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </div>

            {/* City */}
            <div className="ci-field">
              <label className="ci-label" htmlFor="city">City</label>
              <input
                id="city"
                className="ci-input"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            {/* State + ZIP */}
            <div className="ci-row">
              <div className="ci-field">
                <label className="ci-label" htmlFor="state">State</label>
                <select
                  id="state"
                  className="ci-select"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="">State</option>
                  {states.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="ci-field">
                <label className="ci-label" htmlFor="zip">ZIP</label>
                <input
                  id="zip"
                  className="ci-input"
                  placeholder="Zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Door type */}
            <div className="ci-field">
              <label className="ci-label" htmlFor="doorType">Product</label>
              <select
                id="doorType"
                className="ci-select"
                value={doorType}
                onChange={(e) => setDoorType(e.target.value)}
              >
                <option value="">Select Product</option>
                <option value="Wood Door">Wood Door</option>
                <option value="Iron Door">Iron Door</option>
                <option value="Fiberglass Front Door">Fiberglass Front Door</option>
                <option value="Fiberglass Back / Patio Door">Fiberglass Back / Patio Door</option>
                <option value="Barn Door">Barn Door</option>
              </select>
            </div>

            {/* Notes */}
            <div className="ci-field">
              <label className="ci-label" htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                className="ci-textarea"
                placeholder="Be as specific and detailed as possible — materials used, colors, special requests, job conditions. Detailed notes rank higher in search results."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="ci-divider" />

            {/* Photos */}
            <div className="ci-photo-section">
              <span className="ci-label">Photos</span>

              <div className="ci-photo-buttons">
                {/* Take Photo — opens live camera, appends */}
                <button
                  type="button"
                  className="ci-btn-camera"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M1 5.5A1.5 1.5 0 0 1 2.5 4h1.382a1.5 1.5 0 0 0 1.342-.83L6 2h6l.776 1.17A1.5 1.5 0 0 0 14.118 4H15.5A1.5 1.5 0 0 1 17 5.5v9A1.5 1.5 0 0 1 15.5 16h-13A1.5 1.5 0 0 1 1 14.5v-9z"/>
                    <circle cx="9" cy="10" r="2.5"/>
                  </svg>
                  Take Photo
                </button>

                {/* From Library — opens file picker, replaces */}
                <button
                  type="button"
                  className="ci-btn-library"
                  onClick={() => libraryInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="1" y="3" width="14" height="11" rx="1.5"/>
                    <circle cx="10.5" cy="7.5" r="1.5"/>
                    <path d="M1 11l3.5-3.5 3 3 2-2 4 4"/>
                  </svg>
                  From Library
                </button>
              </div>

              {/* Hidden inputs */}
              <input
                ref={cameraInputRef}
                className="ci-file-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraChange}
              />
              <input
                ref={libraryInputRef}
                className="ci-file-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={handleLibraryChange}
              />

              {/* Count badge */}
              {photos.length > 0 && (
                <span className="ci-photo-count">
                  {photos.length} photo{photos.length !== 1 ? 's' : ''} attached
                </span>
              )}

              {/* Previews with remove buttons */}
              {photoPreviews.length > 0 && (
                <div className="ci-preview-grid">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="ci-preview-item">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={`Photo ${i + 1}`} />
                      <button
                        type="button"
                        className="ci-preview-remove"
                        onClick={() => removePhoto(i)}
                        aria-label={`Remove photo ${i + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ci-divider" />

            {/* Submit */}
            <button type="submit" className="ci-btn-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting\u2026' : 'Submit Check-In'}
            </button>

          </form>

          {message && (
            <p className={`ci-message ${messageType}`}>{message}</p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
