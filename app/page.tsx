'use client'

import { useState } from 'react'

export default function Home() {
  const [installer, setInstaller] = useState('')
  const [jobAddress, setJobAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const installers = ['John', 'Alex', 'Maria']

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage('')

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser')
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      })

      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      let photoUrl = ''
      if (photo) {
        const formData = new FormData()
        formData.append('photo', photo)

        const uploadResponse = await fetch('/api/upload-photo', {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || 'Failed to upload photo')
        }

        const uploadData = await uploadResponse.json()
        photoUrl = uploadData.photoUrl
      }

      const submitResponse = await fetch('/api/submit-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          installer,
          jobAddress,
          notes,
          latitude,
          longitude,
          photoUrl,
        }),
      })

      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        throw new Error(errorData.error || 'Failed to submit check-in')
      }

      setMessage('✓ Check-in submitted successfully!')
      setInstaller('')
      setJobAddress('')
      setNotes('')
      setPhoto(null)
      setPhotoPreview('')
      
      const fileInput = document.getElementById('photo-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''

    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Jobsite Check-In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="installer" className="block text-sm font-medium text-gray-700 mb-1">
                Installer
              </label>
              <select
                id="installer"
                value={installer}
                onChange={(e) => setInstaller(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select installer...</option>
                {installers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="jobAddress" className="block text-sm font-medium text-gray-700 mb-1">
                Job Address
              </label>
              <input
                id="jobAddress"
                type="text"
                value={jobAddress}
                onChange={(e) => setJobAddress(e.target.value)}
                required
                placeholder="123 Main Street"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about the job..."
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label htmlFor="photo-input" className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {photoPreview && (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="mt-2 w-full h-48 object-cover rounded-lg"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Check-In'}
            </button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg ${
              message.startsWith('Error') 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="text-center mt-4 text-sm text-gray-600">
          <p>Location will be captured automatically</p>
        </div>
      </div>
    </main>
  )
}
