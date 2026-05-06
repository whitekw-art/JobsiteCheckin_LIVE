'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { geocodeJobAddress } from '@/lib/geocode'
import imageCompression from 'browser-image-compression'
import DashboardShell from '@/components/DashboardShell'
import BeforeAfterCamera from '@/components/BeforeAfterCamera'
import { tierHasFeature } from '@/lib/planVersions'
import '@/styles/checkin.css'

function CheckInContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')
  const [installer, setInstaller] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [doorType, setDoorType] = useState('')
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [photoTags, setPhotoTags] = useState<(null | 'before' | 'after')[]>([])
  const [showBeforeAfterCamera, setShowBeforeAfterCamera] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [photoLocation, setPhotoLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [homeCustomerName, setHomeCustomerName] = useState('')
  const [homeCustomerPhone, setHomeCustomerPhone] = useState('')
  const [homeCustomerEmail, setHomeCustomerEmail] = useState('')
  const [contactsSupported, setContactsSupported] = useState(false)
  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([])
  const [existingBeforePhotoUrl, setExistingBeforePhotoUrl] = useState<string | null>(null)
  const [existingAfterPhotoUrl, setExistingAfterPhotoUrl] = useState<string | null>(null)

  const cameraInputRef = useRef<HTMLInputElement>(null)
  const libraryInputRef = useRef<HTMLInputElement>(null)

  const userRole = session?.user?.role
  const isUserRole = userRole === 'USER'
  const planTier = (session?.user as any)?.planTier as string | undefined
  const canBeforeAfter = tierHasFeature(planTier, 'before_after_tagging')

  useEffect(() => {
    if (isUserRole) setInstaller(session?.user?.name || '')
  }, [isUserRole, session?.user?.name])

  // Detect Web Contacts API support (Android Chrome + iOS Safari 14.5+)
  useEffect(() => {
    setContactsSupported(typeof navigator !== 'undefined' && 'contacts' in navigator)
  }, [])

  const handlePickContact = async () => {
    try {
      const contacts = await (navigator as any).contacts.select(['name', 'tel', 'email'], { multiple: false })
      if (contacts && contacts.length > 0) {
        const c = contacts[0]
        if (c.name?.[0]) setHomeCustomerName(c.name[0])
        if (c.tel?.[0]) setHomeCustomerPhone(c.tel[0])
        if (c.email?.[0]) setHomeCustomerEmail(c.email[0])
      }
    } catch { /* user dismissed picker */ }
  }

  // Load check-in data when in edit mode
  useEffect(() => {
    if (!editId) return
    fetch('/api/my-jobs')
      .then((r) => r.json())
      .then((data) => {
        const c = (data.checkIns || []).find((ci: any) => ci.id === editId)
        if (!c) return
        setInstaller(c.installer || '')
        setStreet(c.street || '')
        setCity(c.city || '')
        setState(c.state || '')
        setZip(c.zip || '')
        setDoorType(c.doorType || '')
        setNotes(c.notes || '')
        setHomeCustomerName(c.homeCustomerName || '')
        setHomeCustomerPhone(c.homeCustomerPhone || '')
        setHomeCustomerEmail(c.homeCustomerEmail || '')
        setExistingPhotoUrls(c.photoUrls || [])
        setExistingBeforePhotoUrl(c.beforePhotoUrl || null)
        setExistingAfterPhotoUrl(c.afterPhotoUrl || null)
      })
      .catch(() => {})
  }, [editId])

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
    const newTags: null[] = supported.map(() => null)
    const nextTags = append ? [...photoTags, ...newTags] : newTags

    setPhotos(nextPhotos)
    setPhotoPreviews(nextPreviews)
    setPhotoTags(nextTags)

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
    setPhotoTags((prev) => prev.filter((_, i) => i !== idx))
  }

  const setTag = (idx: number, tag: null | 'before' | 'after') => {
    setPhotoTags((prev) => prev.map((t, i) => i === idx ? tag : t))
  }

  const handleAfterCameraCapture = (file: File) => {
    const preview = URL.createObjectURL(file)
    setPhotos((prev) => [...prev, file])
    setPhotoPreviews((prev) => [...prev, preview])
    setPhotoTags((prev) => [...prev, 'after'])
    setShowBeforeAfterCamera(false)
  }

  const beforeIndex = photoTags.indexOf('before')

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
      const resolved = editId
        ? { latitude: null, longitude: null, locationSource: 'DEVICE' as const }
        : await resolveLocation()
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

      const newBeforePhotoUrl = (() => {
        const i = photoTags.indexOf('before')
        return i !== -1 ? (uploadedUrls[i] ?? null) : null
      })()
      const newAfterPhotoUrl = (() => {
        const i = photoTags.indexOf('after')
        return i !== -1 ? (uploadedUrls[i] ?? null) : null
      })()

      const res = editId
        ? await fetch('/api/checkins/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: editId,
              installer,
              street,
              city,
              state,
              zip,
              doorType,
              notes,
              appendPhotoUrls: uploadedUrls,
              beforePhotoUrl: newBeforePhotoUrl ?? existingBeforePhotoUrl,
              afterPhotoUrl: newAfterPhotoUrl ?? existingAfterPhotoUrl,
              homeCustomerName: homeCustomerName.trim() || null,
              homeCustomerPhone: homeCustomerPhone.trim() || null,
              homeCustomerEmail: homeCustomerEmail.trim() || null,
            }),
          })
        : await fetch('/api/submit-checkin-supabase', {
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
              beforePhotoUrl: newBeforePhotoUrl,
              afterPhotoUrl: newAfterPhotoUrl,
              homeCustomerName: homeCustomerName.trim() || null,
              homeCustomerPhone: homeCustomerPhone.trim() || null,
              homeCustomerEmail: homeCustomerEmail.trim() || null,
            }),
          })

      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.error || 'Failed to submit check-in')
      }

      setMessageType('success')
      setMessage(editId ? 'Job updated successfully!' : 'Check-in submitted successfully!')
      if (!editId) {
        setInstaller(isUserRole ? session?.user?.name || '' : '')
        setStreet(''); setCity(''); setState(''); setZip('')
        setDoorType(''); setNotes('')
        setHomeCustomerName(''); setHomeCustomerPhone(''); setHomeCustomerEmail('')
        setPhotos([]); setPhotoPreviews([]); setPhotoTags([]); setPhotoLocation(null)
      } else {
        setPhotos([]); setPhotoPreviews([]); setPhotoTags([])
      }

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
    <>
    {canBeforeAfter && showBeforeAfterCamera && beforeIndex !== -1 && (
      <BeforeAfterCamera
        beforePhotoUrl={photoPreviews[beforeIndex]}
        onCapture={handleAfterCameraCapture}
        onClose={() => setShowBeforeAfterCamera(false)}
      />
    )}
    <DashboardShell title={editId ? 'Edit Check-In' : 'New Check-In'}>
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

            {/* Customer Info */}
            <div className="ci-field">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="ci-label" style={{ marginBottom: 0 }}>Customer Info <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.78rem' }}>(optional)</span></label>
                {contactsSupported && (
                  <button
                    type="button"
                    onClick={handlePickContact}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid var(--border)', background: 'var(--card)',
                      color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Pick from Contacts
                  </button>
                )}
              </div>
              <input
                className="ci-input"
                placeholder="Customer name"
                value={homeCustomerName}
                onChange={(e) => setHomeCustomerName(e.target.value)}
                style={{ marginBottom: 6 }}
              />
              <input
                className="ci-input"
                placeholder="Customer phone"
                type="tel"
                value={homeCustomerPhone}
                onChange={(e) => setHomeCustomerPhone(e.target.value)}
                style={{ marginBottom: 6 }}
              />
              <input
                className="ci-input"
                placeholder="Customer email"
                type="email"
                value={homeCustomerEmail}
                onChange={(e) => setHomeCustomerEmail(e.target.value)}
              />
            </div>

            <div className="ci-divider" />

            {/* Photos */}
            <div className="ci-photo-section">
              <span className="ci-label">Photos</span>

              {/* Existing photos in edit mode */}
              {existingPhotoUrls.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: 6 }}>
                    Current photos ({existingPhotoUrls.length})
                  </span>
                  <div className="ci-preview-grid">
                    {existingPhotoUrls.map((url, i) => (
                      <div key={i} className="ci-preview-item">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Photo ${i + 1}`} />
                        {url === existingBeforePhotoUrl && (
                          <div style={{
                            position: 'absolute', bottom: 4, left: 4,
                            background: '#2563eb', color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700, padding: '2px 5px',
                            borderRadius: 3, letterSpacing: '0.03em',
                          }}>BEFORE</div>
                        )}
                        {url === existingAfterPhotoUrl && (
                          <div style={{
                            position: 'absolute', bottom: 4, left: 4,
                            background: '#16a34a', color: '#fff',
                            fontSize: '0.6rem', fontWeight: 700, padding: '2px 5px',
                            borderRadius: 3, letterSpacing: '0.03em',
                          }}>AFTER</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginTop: 6 }}>
                    Add new photos below:
                  </span>
                </div>
              )}

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

                {/* Take After Photo with ghost overlay — only when a "before" photo is tagged */}
                {canBeforeAfter && beforeIndex !== -1 && (
                  <button
                    type="button"
                    className="ci-btn-camera"
                    style={{ background: '#e8a83a', color: '#111', borderColor: '#e8a83a' }}
                    onClick={() => setShowBeforeAfterCamera(true)}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 5.5A1.5 1.5 0 0 1 2.5 4h1.382a1.5 1.5 0 0 0 1.342-.83L6 2h6l.776 1.17A1.5 1.5 0 0 0 14.118 4H15.5A1.5 1.5 0 0 1 17 5.5v9A1.5 1.5 0 0 1 15.5 16h-13A1.5 1.5 0 0 1 1 14.5v-9z"/>
                      <circle cx="9" cy="10" r="2.5"/>
                    </svg>
                    Take After Photo
                  </button>
                )}
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
                      {/* Before/After tag buttons — Elite/Titan only */}
                      {canBeforeAfter && <div style={{
                        position: 'absolute', bottom: 4, left: 4, right: 4,
                        display: 'flex', gap: 3,
                      }}>
                        <button
                          type="button"
                          onClick={() => setTag(i, photoTags[i] === 'before' ? null : 'before')}
                          style={{
                            flex: 1, fontSize: '0.6rem', fontWeight: 700, padding: '2px 0',
                            border: 'none', borderRadius: 3, cursor: 'pointer',
                            background: photoTags[i] === 'before' ? '#2563eb' : 'rgba(0,0,0,0.55)',
                            color: '#fff', letterSpacing: '0.03em',
                          }}
                        >
                          BEFORE
                        </button>
                        <button
                          type="button"
                          onClick={() => setTag(i, photoTags[i] === 'after' ? null : 'after')}
                          style={{
                            flex: 1, fontSize: '0.6rem', fontWeight: 700, padding: '2px 0',
                            border: 'none', borderRadius: 3, cursor: 'pointer',
                            background: photoTags[i] === 'after' ? '#16a34a' : 'rgba(0,0,0,0.55)',
                            color: '#fff', letterSpacing: '0.03em',
                          }}
                        >
                          AFTER
                        </button>
                      </div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="ci-divider" />

            {/* Submit */}
            <button type="submit" className="ci-btn-submit" disabled={isSubmitting}>
              {isSubmitting
                ? (editId ? 'Saving\u2026' : 'Submitting\u2026')
                : (editId ? 'Save Changes' : 'Submit Check-In')}
            </button>

          </form>

          {message && (
            <p className={`ci-message ${messageType}`}>{message}</p>
          )}
        </div>
      </div>
    </DashboardShell>
    </>
  )
}

export default function CheckInPage() {
  return (
    <Suspense>
      <CheckInContent />
    </Suspense>
  )
}
