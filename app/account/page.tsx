'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'

interface OrganizationProfile {
  name: string
  phone: string | null
  website: string | null
}

const PLAN_LABELS: Record<string, string> = {
  free:  'Free Starter',
  pro:   'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

export default function AccountPage() {
  const { data: session } = useSession()
  const planTier = (session?.user as any)?.planTier as string | null | undefined
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)
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

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setPortalError(null)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        // No active Stripe subscription (e.g. canceled, webhook delay) — send to pricing
        window.location.href = '/pricing'
        return
      }
      window.location.href = data.url
    } catch {
      window.location.href = '/pricing'
    }
  }

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
      {/* Subscription section — only shown when planTier is known */}
      {planTier && (
        <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-bold mb-1">Subscription</h2>
          <p className="text-sm text-gray-500 mb-4">
            Current plan: <span className="font-semibold text-gray-800">{PLAN_LABELS[planTier] ?? planTier}</span>
          </p>

          {portalError && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-3">
              {portalError}
            </div>
          )}

          {showDowngradeWarning && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(12,74,110,0.5)',
              backdropFilter: 'blur(3px)', zIndex: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}>
              <div style={{
                background: '#fff', borderRadius: '16px', maxWidth: '460px', width: '100%',
                padding: '32px 28px', boxShadow: '0 20px 60px rgba(12,74,110,0.2)',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: '#FFF7ED', border: '1px solid #FED7AA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0C4A6E', marginBottom: '10px' }}>
                  Before you continue
                </h3>
                <p style={{ fontSize: '14px', color: '#4B7A94', lineHeight: 1.6, marginBottom: '12px' }}>
                  If you <strong>cancel your subscription</strong> or downgrade to the free plan:
                </p>
                <ul style={{ fontSize: '13px', color: '#4B7A94', lineHeight: 1.7, paddingLeft: '18px', marginBottom: '16px' }}>
                  <li>All published job pages beyond your plan limit will be automatically unpublished</li>
                  <li>Higher-tier features (geo-grid tracking, advanced analytics, etc.) will be turned off</li>
                  <li>Your data is fully preserved — resubscribing restores everything instantly</li>
                </ul>
                <p style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '24px', fontStyle: 'italic' }}>
                  If you switch to a lower paid plan, any features above your new tier will be turned off and their associated data will be frozen until you resubscribe to a qualifying plan.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setShowDowngradeWarning(false); handleManageSubscription() }}
                    disabled={portalLoading}
                    style={{
                      flex: 1, height: '44px', background: '#0EA5E9', color: '#fff',
                      border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 700,
                      cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    {portalLoading ? 'Opening…' : 'Continue to billing portal'}
                  </button>
                  <button
                    onClick={() => setShowDowngradeWarning(false)}
                    style={{
                      flex: 1, height: '44px', background: '#F1F5F9', color: '#0C4A6E',
                      border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  >
                    Keep my plan
                  </button>
                </div>
              </div>
            </div>
          )}

          {planTier === 'free' ? (
            <a
              href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors"
            >
              Upgrade Plan
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          ) : (
            <button
              onClick={() => setShowDowngradeWarning(true)}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-semibold hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? 'Opening…' : 'Manage Subscription'}
              {!portalLoading && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          )}
          <p className="text-xs text-gray-400 mt-3">
            {planTier === 'free'
              ? 'Upgrade anytime. No contracts.'
              : 'Change or cancel your plan anytime through the billing portal.'}
          </p>
        </div>
      )}
    </main>
  )
}

