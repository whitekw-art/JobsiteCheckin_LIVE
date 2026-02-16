'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { geocodeJobAddress } from '@/lib/geocode'

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
  const [photoLocation, setPhotoLocation] = useState<{ lat: number; lng: number } | null>(null)

  const userRole = session?.user?.role
  const isUserRole = userRole === 'USER'

  useEffect(() => {
    if (isUserRole) {
      setInstaller(session?.user?.name || '')
    }
  }, [isUserRole, session?.user?.name])

  const extractExifLocation = (file: File): Promise<{ lat: number; lng: number } | null> => {
    const readGpsFromBuffer = (arrayBuffer: ArrayBuffer): { lat: number; lng: number } | null => {
      const view = new DataView(arrayBuffer)
      if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

      const typeSizes: Record<number, number> = {
        1: 1,
        2: 1,
        3: 2,
        4: 4,
        5: 8,
        7: 1,
        9: 4,
        10: 8,
      }

      const getString = (start: number, length: number) => {
        let str = ''
        for (let i = 0; i < length; i++) {
          const charCode = view.getUint8(start + i)
          if (charCode === 0) break
          str += String.fromCharCode(charCode)
        }
        return str
      }

      const readRationalArray = (start: number, count: number, littleEndian: boolean) => {
        const values: number[] = []
        for (let i = 0; i < count; i++) {
          const numerator = view.getUint32(start + i * 8, littleEndian)
          const denominator = view.getUint32(start + i * 8 + 4, littleEndian)
          values.push(denominator ? numerator / denominator : 0)
        }
        return values
      }

      const dmsToDecimal = (dms: number[], ref: string) => {
        if (dms.length !== 3) return null
        const [deg, min, sec] = dms
        let decimal = deg + min / 60 + sec / 3600
        if (ref === 'S' || ref === 'W') decimal = -decimal
        return decimal
      }

      let offset = 2
      while (offset < view.byteLength - 1) {
        const marker = view.getUint16(offset)
        offset += 2

        if (marker === 0xffda || marker === 0xffd9) break

        const length = view.getUint16(offset)
        offset += 2

        if (marker === 0xffe1 && getString(offset, 4) === 'Exif') {
          const tiffStart = offset + 6
          const littleEndian = view.getUint16(tiffStart) === 0x4949
          const firstIFDOffset = view.getUint32(tiffStart + 4, littleEndian)
          const ifd0 = tiffStart + firstIFDOffset
          const entries = view.getUint16(ifd0, littleEndian)
          let gpsOffset = 0

          for (let i = 0; i < entries; i++) {
            const entryOffset = ifd0 + 2 + i * 12
            const tag = view.getUint16(entryOffset, littleEndian)
            if (tag === 0x8825) {
              gpsOffset = view.getUint32(entryOffset + 8, littleEndian)
              break
            }
          }

          if (!gpsOffset) return null

          const gpsIFD = tiffStart + gpsOffset
          const gpsEntries = view.getUint16(gpsIFD, littleEndian)
          let latRef = ''
          let lonRef = ''
          let latValues: number[] | null = null
          let lonValues: number[] | null = null

          for (let i = 0; i < gpsEntries; i++) {
            const entryOffset = gpsIFD + 2 + i * 12
            const tag = view.getUint16(entryOffset, littleEndian)
            const type = view.getUint16(entryOffset + 2, littleEndian)
            const count = view.getUint32(entryOffset + 4, littleEndian)
            const valueOffset = entryOffset + 8
            const byteLength = (typeSizes[type] || 0) * count
            const actualOffset =
              byteLength > 4 ? tiffStart + view.getUint32(valueOffset, littleEndian) : valueOffset

            if (tag === 0x0001) {
              latRef = getString(actualOffset, count).trim()
            } else if (tag === 0x0003) {
              lonRef = getString(actualOffset, count).trim()
            } else if (tag === 0x0002 && type === 5) {
              latValues = readRationalArray(actualOffset, count, littleEndian)
            } else if (tag === 0x0004 && type === 5) {
              lonValues = readRationalArray(actualOffset, count, littleEndian)
            }
          }

          if (latRef && lonRef && latValues && lonValues) {
            const lat = dmsToDecimal(latValues, latRef)
            const lng = dmsToDecimal(lonValues, lonRef)
            if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
              return { lat, lng }
            }
          }
          return null
        } else {
          offset += length - 2
        }
      }

      return null
    }

    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer
          const location = readGpsFromBuffer(buffer)
          resolve(location)
        } catch {
          resolve(null)
        }
      }
      reader.onerror = () => resolve(null)
      reader.readAsArrayBuffer(file)
    })
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? [])

    const supported = selectedFiles.filter(file =>
      ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)
    )

    setPhotos(supported)

    const previews = supported.map(file => URL.createObjectURL(file))
    setPhotoPreviews(previews)

    if (supported.length > 0) {
      const exifLocation = await extractExifLocation(supported[0])
      if (exifLocation?.lat != null && exifLocation?.lng != null) {
        setPhotoLocation(exifLocation)
      } else {
        setPhotoLocation(null)
      }
    } else {
      setPhotoLocation(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('HANDLE_SUBMIT_RUNNING')
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    const gpsPromise =
      navigator.geolocation
        ? new Promise<{ lat: number; lng: number } | null>((resolve) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null),
              { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
            )
          })
        : Promise.resolve(null)

    try {
      // Build a single jobAddress string from the structured fields
      const jobAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}`.trim()

      const resolveLocation = async () => {
        console.log('RESOLVE_LOCATION_RUNNING', new Date().toISOString())
        if (
          photoLocation &&
          Number.isFinite(photoLocation.lat) &&
          Number.isFinite(photoLocation.lng)
        ) {
          return {
            latitude: photoLocation.lat,
            longitude: photoLocation.lng,
            locationSource: 'EXIF' as const,
          }
        }

        let geocoded = null
        try {
          geocoded = await Promise.race([
            geocodeJobAddress(jobAddress),
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
          ])
        } catch {
          geocoded = null
        }

        if (
          geocoded &&
          Number.isFinite(geocoded.lat) &&
          Number.isFinite(geocoded.lng)
        ) {
          return {
            latitude: geocoded.lat,
            longitude: geocoded.lng,
            locationSource: 'ADDRESS' as const,
          }
        }

        console.log('RESOLVE_LOCATION_BEFORE_GPS')
        const gpsCoords = await gpsPromise

        if (
          gpsCoords &&
          Number.isFinite(gpsCoords.lat) &&
          Number.isFinite(gpsCoords.lng)
        ) {
          console.log('GPS_SUCCESS_RAW', gpsCoords)
          console.log('GPS_COORDS', {
            lat: gpsCoords.lat,
            lng: gpsCoords.lng,
            accuracy: undefined,
          })
          console.log('GPS_RETURNING_DEVICE')
          return {
            latitude: gpsCoords.lat,
            longitude: gpsCoords.lng,
            locationSource: 'DEVICE' as const,
          }
        }

        console.log('RESOLVE_LOCATION_RETURN_NULL')
        return { latitude: null, longitude: null, locationSource: 'DEVICE' as const }
      }

      console.log('PHOTO_LOCATION_AT_SUBMIT', photoLocation)
      const resolved = await resolveLocation()
      console.log('RESOLVE_LOCATION_RESULT', resolved)
      const latitude = resolved.latitude
      const longitude = resolved.longitude
      const locationSource = resolved.locationSource

      const uploadedUrls: string[] = []

      for (const file of photos) {
        const formData = new FormData()
        formData.append('photo', file)

        const uploadResponse = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadResponse.json()
        uploadedUrls.push(uploadData.photoUrl)
      }

      const response = await fetch('/api/submit-checkin-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installer,
          street,
          notes,
          city,
          state,
          zip,
          doorType,
          latitude,
          longitude,
          locationSource,
          photoUrls: uploadedUrls,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error || 'Failed to submit check-in')
      }

      setMessage('✓ Check-in submitted successfully!')
      setInstaller('')
      setStreet('')
      setCity('')
      setState('')
      setZip('')
      setNotes('')
      setPhotos([])
      setPhotoPreviews([])
      setPhotoLocation(null)

    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    }

    setIsSubmitting(false)
  }

  return (
    <main className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-center mb-4">Jobsite Check-In</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Installer */}
          <div>
            <label htmlFor="installer" className="block text-sm font-medium text-gray-700 mb-1">Installer</label>
            <input
              id="installer"
              className="w-full p-3 border rounded-lg"
              placeholder="Installer name"
              value={installer}
              onChange={(e) => setInstaller(e.target.value)}
              readOnly={isUserRole}
            />
          </div>

          {/* Address fields */}
          <div className="space-y-2">
            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-1">Street</label>
              <input
                id="street"
                className="w-full p-3 border rounded-lg"
                placeholder="123 Main St"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                id="city"
                className="w-full p-3 border rounded-lg"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <select
                  id="state"
                  className="w-full p-3 border rounded-lg"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                >
                  <option value="">State</option>
                <option value="AL">AL</option>
                <option value="AK">AK</option>
                <option value="AZ">AZ</option>
                <option value="AR">AR</option>
                <option value="CA">CA</option>
                <option value="CO">CO</option>
                <option value="CT">CT</option>
                <option value="DE">DE</option>
                <option value="FL">FL</option>
                <option value="GA">GA</option>
                <option value="HI">HI</option>
                <option value="ID">ID</option>
                <option value="IL">IL</option>
                <option value="IN">IN</option>
                <option value="IA">IA</option>
                <option value="KS">KS</option>
                <option value="KY">KY</option>
                <option value="LA">LA</option>
                <option value="ME">ME</option>
                <option value="MD">MD</option>
                <option value="MA">MA</option>
                <option value="MI">MI</option>
                <option value="MN">MN</option>
                <option value="MS">MS</option>
                <option value="MO">MO</option>
                <option value="MT">MT</option>
                <option value="NE">NE</option>
                <option value="NV">NV</option>
                <option value="NH">NH</option>
                <option value="NJ">NJ</option>
                <option value="NM">NM</option>
                <option value="NY">NY</option>
                <option value="NC">NC</option>
                <option value="ND">ND</option>
                <option value="OH">OH</option>
                <option value="OK">OK</option>
                <option value="OR">OR</option>
                <option value="PA">PA</option>
                <option value="RI">RI</option>
                <option value="SC">SC</option>
                <option value="SD">SD</option>
                <option value="TN">TN</option>
                <option value="TX">TX</option>
                <option value="UT">UT</option>
                <option value="VT">VT</option>
                <option value="VA">VA</option>
                <option value="WA">WA</option>
                <option value="WV">WV</option>
                <option value="WI">WI</option>
                <option value="WY">WY</option>
              </select>
              </div>
              <div className="w-1/2">
                <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
                <input
                  id="zip"
                  className="w-full p-3 border rounded-lg"
                  placeholder="Zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="doorType" className="block text-sm font-medium text-gray-700 mb-1">Door Type</label>
              <select
                id="doorType"
                className="w-full p-3 border rounded-lg"
                value={doorType}
                onChange={(e) => setDoorType(e.target.value)}
              >
                <option value="">Select type</option>
              <option value="Wood Door">Wood Door</option>
              <option value="Iron Door">Iron Door</option>
              <option value="Fiberglass Front Door">Fiberglass Front Door</option>
              <option value="Fiberglass Back / Patio Door">Fiberglass Back / Patio Door</option>
              <option value="Barn Door">Barn Door</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              id="notes"
              className="w-full p-3 border rounded-lg"
              placeholder="Any additional notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Photos */}
          <div>
            <label htmlFor="photo-input" className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            <input
              id="photo-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              multiple
              onChange={handlePhotoChange}
              className="w-full p-3 border rounded-lg"
            />
          </div>

          {photoPreviews.length > 0 && (
            <div className="grid gap-3 mt-2">
              {photoPreviews.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  className="w-full rounded-lg object-cover"
                  style={{ height: '200px' }}
                />
              ))}
            </div>
          )}

          <button
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white p-3 rounded-lg"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </form>

        {message && <p className="text-center mt-3">{message}</p>}
      </div>
    </main>
  )
}
