'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'

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
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.trim() || null,
          website: website.trim() || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile')
      const updated: OrganizationProfile = data.organization
      setProfile(updated)
      setPhone(updated.phone || '')
      setWebsite(updated.website || '')
      setMessage('Business profile updated.')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title="Account">
      {/* Business profile card */}
      <div className="db-shell-card" style={{ maxWidth: 520 }}>
        <div className="db-shell-card-title">Business Profile</div>

        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--t3)' }}>Loading...</p>
        ) : error && !profile ? (
          <p className="db-shell-alert-error">{error}</p>
        ) : !profile ? (
          <p style={{ fontSize: 13, color: 'var(--t2)' }}>No organization profile linked to this account.</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="db-shell-label">Business Name</label>
              <div className="db-shell-field-static">{profile.name}</div>
            </div>

            <div>
              <label htmlFor="business-phone" className="db-shell-label">Company Phone</label>
              <input
                id="business-phone"
                type="tel"
                className="db-shell-input"
                style={{ width: '100%', minWidth: 0 }}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="business-website" className="db-shell-label">Business Website</label>
              <input
                id="business-website"
                type="url"
                className="db-shell-input"
                style={{ width: '100%', minWidth: 0 }}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            {message && <div className="db-shell-alert-success">{message}</div>}
            {error && <div className="db-shell-alert-error">{error}</div>}

            <button
              type="submit"
              disabled={saving}
              className="db-shell-btn"
              style={{ alignSelf: 'flex-start', minWidth: 120 }}
            >
              {saving ? 'Saving\u2026' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>

      {/* Subscription card */}
      {planTier && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Subscription</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
            Current plan: <strong style={{ color: 'var(--t1)' }}>{PLAN_LABELS[planTier] ?? planTier}</strong>
          </p>

          {planTier === 'free' ? (
            <a
              href="/pricing"
              className="db-shell-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              Upgrade Plan
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          ) : (
            <button
              onClick={() => setShowDowngradeWarning(true)}
              disabled={portalLoading}
              className="db-shell-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {portalLoading ? 'Opening\u2026' : 'Manage Subscription'}
              {!portalLoading && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          )}
          <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
            {planTier === 'free'
              ? 'Upgrade anytime. No contracts.'
              : 'Change or cancel your plan anytime through the billing portal.'}
          </p>
        </div>
      )}

      {/* Downgrade warning modal */}
      {showDowngradeWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          backdropFilter: 'blur(3px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 14, maxWidth: 460, width: '100%',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 10 }}>
              Before you continue
            </h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>
              If you <strong>cancel or downgrade</strong>:
            </p>
            <ul style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, paddingLeft: 18, marginBottom: 14 }}>
              <li>Published job pages beyond your plan limit will be unpublished</li>
              <li>Higher-tier features will be turned off</li>
              <li>Your data is preserved — resubscribing restores everything instantly</li>
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowDowngradeWarning(false); handleManageSubscription() }}
                disabled={portalLoading}
                className="db-shell-btn"
                style={{ flex: 1, height: 40 }}
              >
                {portalLoading ? 'Opening\u2026' : 'Continue to billing portal'}
              </button>
              <button
                onClick={() => setShowDowngradeWarning(false)}
                style={{
                  flex: 1, height: 40, background: 'var(--surface-3)', color: 'var(--t1)',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Keep my plan
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
