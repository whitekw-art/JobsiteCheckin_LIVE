'use client'

import { useEffect, useState, FormEvent } from 'react'

interface OrganizationProfile {
  name: string
  phone: string | null
  website: string | null
}

export default function AccountPage() {
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/organization/profile')
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Failed to load profile')
        }
        const data = await res.json()
        const org: OrganizationProfile = data.organization
        setProfile(org)
        setPhone(org.phone || '')
        setWebsite(org.website || '')
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone.trim() || null,
          website: website.trim() || null,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to update profile')
      }

      const updated: OrganizationProfile = data.organization
      setProfile(updated)
      setPhone(updated.phone || '')
      setWebsite(updated.website || '')
      setMessage('Business profile updated successfully.')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Business Profile</h1>

        {loading ? (
          <p className="text-gray-600">Loading profile...</p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : !profile ? (
          <p className="text-gray-600 text-sm">
            No organization profile is linked to this account.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <p className="text-gray-900">{profile.name}</p>
            </div>

            <div>
              <label htmlFor="business-phone" className="block text-sm font-medium text-gray-700 mb-1">
                Company Phone Number
              </label>
              <input
                id="business-phone"
                type="tel"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="business-website" className="block text-sm font-medium text-gray-700 mb-1">
                Business Website
              </label>
              <input
                id="business-website"
                type="url"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {message && (
              <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                {message}
              </div>
            )}
            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

