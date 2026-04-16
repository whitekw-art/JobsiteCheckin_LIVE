'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'

type Tab = 'general' | 'team' | 'billing' | 'connections'

interface OrganizationProfile {
  name: string
  slug: string | null
  phone: string | null
  website: string | null
}

const PLAN_LABELS: Record<string, string> = {
  free:  'Free Starter',
  pro:   'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

function subTabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: 'transparent',
    border: 'none',
    color: active ? 'var(--sky-text)' : 'var(--t3)',
    cursor: 'pointer',
    borderBottom: active ? '2px solid var(--sky)' : '2px solid transparent',
    marginBottom: -1,
  }
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        flexShrink: 0,
        background: checked ? 'var(--sky)' : 'var(--border-2)',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background .2s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 14,
        height: 14,
        top: 3,
        left: checked ? 19 : 3,
        background: '#fff',
        borderRadius: '50%',
        transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
    </div>
  )
}

// Google G icon for the card header icon box (compact — just the G)
const GoogleGIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
    <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
    <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.3 44 24 44z" fill="#4CAF50"/>
    <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.1 35.6 44 30.2 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
  </svg>
)

// Full Google wordmark for the connect button
const GoogleWordmark = () => (
  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>
    <span style={{ color: '#4285F4' }}>G</span>
    <span style={{ color: '#EA4335' }}>o</span>
    <span style={{ color: '#FBBC05' }}>o</span>
    <span style={{ color: '#4285F4' }}>g</span>
    <span style={{ color: '#34A853' }}>l</span>
    <span style={{ color: '#EA4335' }}>e</span>
  </span>
)

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

export default function AccountPage() {
  const { data: session } = useSession()
  const planTier = (session?.user as any)?.planTier as string | null | undefined

  const [activeTab, setActiveTab] = useState<Tab>('general')

  // General tab state
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Controlled via NEXT_PUBLIC_GBP_API_READY env var
  // Local: add NEXT_PUBLIC_GBP_API_READY=true to .env.local
  // Vercel: add to staging/prod when Google API application is approved
  const GBP_API_READY = process.env.NEXT_PUBLIC_GBP_API_READY === 'true'

  // Portfolio link state
  const [linkCopied, setLinkCopied] = useState(false)
  const [showHowToModal, setShowHowToModal] = useState(false)

  function handleCopyPortfolioLink() {
    const slug = profile?.slug
    if (!slug) return
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')
    const url = `${baseUrl}/portfolio/${slug}?utm_source=gbp&utm_medium=profile`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  // Connections tab state (localStorage-backed, Phase 1)
  const [gbpConnected, setGbpConnected] = useState(false)
  const [postMode, setPostMode] = useState<'draft' | 'auto'>('draft')
  const [servicesSync, setServicesSync] = useState(false)
  const [showServicesTip, setShowServicesTip] = useState(false)

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

    // Load GBP preferences from localStorage
    setGbpConnected(localStorage.getItem('gbp_connected') === 'true')
    setPostMode((localStorage.getItem('gbp_post_mode') as 'draft' | 'auto') || 'draft')
    setServicesSync(localStorage.getItem('gbp_services_sync') === 'true')
  }, [])

  function handlePostModeChange(mode: 'draft' | 'auto') {
    setPostMode(mode)
    localStorage.setItem('gbp_post_mode', mode)
  }

  function handleServicesSyncToggle() {
    const next = !servicesSync
    setServicesSync(next)
    localStorage.setItem('gbp_services_sync', String(next))
  }

  function handleGbpConnect() {
    // Phase 1: localStorage-only. Phase 2: real OAuth flow.
    const next = !gbpConnected
    setGbpConnected(next)
    localStorage.setItem('gbp_connected', String(next))
    if (!next) {
      // Reset controls on disconnect
      setPostMode('draft')
      setServicesSync(false)
      localStorage.removeItem('gbp_post_mode')
      localStorage.removeItem('gbp_services_sync')
    }
  }

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

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {(['general', 'team', 'billing', 'connections'] as Tab[]).map((tab) => (
          <button key={tab} style={subTabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {activeTab === 'general' && (
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
      )}

      {/* ── TEAM TAB ── */}
      {activeTab === 'team' && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Team Members</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
            Manage your team members and their access levels.
          </p>
          <a
            href="/dashboard/team"
            className="db-shell-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            Manage Team
            <ChevronRight />
          </a>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {activeTab === 'billing' && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Subscription</div>

          {planTier ? (
            <>
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
                  <ChevronRight />
                </a>
              ) : (
                <button
                  onClick={() => setShowDowngradeWarning(true)}
                  disabled={portalLoading}
                  className="db-shell-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {portalLoading ? 'Opening\u2026' : 'Manage Subscription'}
                  {!portalLoading && <ChevronRight />}
                </button>
              )}
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
                {planTier === 'free'
                  ? 'Upgrade anytime. No contracts.'
                  : 'Change or cancel your plan anytime through the billing portal.'}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>No active subscription found.</p>
          )}
        </div>
      )}

      {/* ── CONNECTIONS TAB ── */}
      {activeTab === 'connections' && (
        <div style={{ maxWidth: 560 }}>

          {/* Google Business Profile card */}
          <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden', opacity: GBP_API_READY ? 1 : 0.72 }}>

            {/* Card header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <GoogleGIcon />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Google Business Profile</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Publish job updates to your Google listing</div>
                </div>
              </div>
              {/* Badge: Coming soon when API not ready, otherwise connection status */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                background: !GBP_API_READY ? 'var(--surface-3)' : gbpConnected ? 'var(--green-bg)' : 'var(--surface-3)',
                color: !GBP_API_READY ? 'var(--t3)' : gbpConnected ? 'var(--green)' : 'var(--t3)',
              }}>
                {!GBP_API_READY ? (
                  'Coming soon'
                ) : (
                  <>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: gbpConnected ? 'var(--green)' : 'var(--t4)' }} />
                    {gbpConnected ? 'Connected' : 'Not connected'}
                  </>
                )}
              </span>
            </div>

            {/* Value prop — always visible */}
            <div style={{ padding: '18px 20px', borderBottom: GBP_API_READY && !gbpConnected ? '1px solid var(--border)' : undefined }}>
              <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                Businesses with active GBP posts get <strong style={{ color: 'var(--t1)' }}>42% more direction requests</strong> and <strong style={{ color: 'var(--t1)' }}>35% more website clicks</strong>. — Google
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {[
                  'Every published job creates a Google Business post automatically',
                  'Posts include your job photo, location, and work description',
                  'Keeps your profile active — Google rewards consistent posting',
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                    <div style={{ width: 20, height: 20, background: 'var(--sky-dim)', color: 'var(--sky-text)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {txt}
                  </div>
                ))}
              </div>

              {/* Connect button — disabled when API not ready */}
              {!GBP_API_READY ? (
                <button
                  disabled
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px', borderRadius: 8,
                    background: 'var(--surface-3)', color: 'var(--t3)',
                    border: '1px solid var(--border)', fontSize: 13, fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'not-allowed',
                  }}
                >
                  <GoogleWordmark />
                  Connect Google Business — Coming Soon
                </button>
              ) : !gbpConnected ? (
                <button
                  onClick={handleGbpConnect}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 18px', borderRadius: 8,
                    background: '#fff', color: '#3c4043',
                    border: '1px solid #dadce0', boxShadow: '0 1px 2px rgba(0,0,0,.08)',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer',
                  }}
                >
                  <GoogleWordmark />
                  Connect Google Business Profile
                </button>
              ) : null}
            </div>

            {/* Post-connect controls — only when API ready and connected */}
            {GBP_API_READY && gbpConnected && (
              <>
                {/* Posting mode */}
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Posting mode</div>
                  <div style={{ display: 'flex', gap: 18, marginBottom: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                      <input type="radio" name="postMode" value="auto" checked={postMode === 'auto'} onChange={() => handlePostModeChange('auto')} />
                      Auto-publish
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                      <input type="radio" name="postMode" value="draft" checked={postMode === 'draft'} onChange={() => handlePostModeChange('draft')} />
                      Review before posting
                    </label>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                    {postMode === 'auto' ? 'Posts go live on Google immediately when you publish a job.' : 'You approve each post from the job card before it goes live on Google.'}
                  </div>
                </div>

                {/* Services sync */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Sync services list</span>
                      {/* Info icon with tooltip */}
                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <button
                          onMouseEnter={() => setShowServicesTip(true)}
                          onMouseLeave={() => setShowServicesTip(false)}
                          onFocus={() => setShowServicesTip(true)}
                          onBlur={() => setShowServicesTip(false)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center' }}
                          aria-label="What does sync services list do?"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                        </button>
                        {showServicesTip && (
                          <div style={{
                            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
                            marginBottom: 8, width: 260, background: 'var(--t1)', color: 'var(--surface)',
                            borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.55,
                            boxShadow: '0 4px 16px rgba(0,0,0,.2)', zIndex: 100,
                            pointerEvents: 'none',
                          }}>
                            Your Google Business Profile has a "Services" section that lists what you do — like <em>Door Installation</em> or <em>Garage Doors</em>. When this is on, ProjectCheckin automatically keeps that list updated to match the trade types in your account. You won't need to log into Google to update it manually.
                            <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: 'var(--t1)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>
                      Auto-update your GBP services to match your trade types.
                    </div>
                  </div>
                  <Toggle checked={servicesSync} onChange={handleServicesSyncToggle} />
                </div>

                {/* Disconnect */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Disconnect</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>Remove ProjectCheckin's access to your Google Business Profile.</div>
                  </div>
                  <button
                    onClick={handleGbpConnect}
                    style={{
                      display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 7,
                      fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif",
                      cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red)',
                      border: '1px solid rgba(220,38,38,.2)', flexShrink: 0,
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Portfolio Link card */}
          {profile?.slug && (
            <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Portfolio Link</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Share your work and track visits from any source</div>
                  </div>
                </div>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, flexShrink: 0,
                  background: 'var(--green-bg)', color: 'var(--green)',
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                  Available now
                </span>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {/* URL display row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'var(--surface-3)', border: '1px solid var(--border-2)',
                  borderRadius: 8, padding: '10px 14px', marginBottom: 10,
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span style={{
                    flex: 1, fontSize: 12.5, fontWeight: 600, color: 'var(--t1)',
                    fontFamily: 'monospace', letterSpacing: '-0.2px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    projectcheckin.com/portfolio/{profile.slug}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 10.5, fontWeight: 700, color: 'var(--green)',
                    background: 'var(--green-bg)', borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    tracking on
                  </span>
                  <button
                    onClick={handleCopyPortfolioLink}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 14px', borderRadius: 7,
                      fontSize: 12, fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                      background: linkCopied ? 'var(--green)' : 'var(--sky-text)',
                      color: '#fff', border: 'none',
                      transition: 'background .15s',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {linkCopied
                        ? <polyline points="20 6 9 17 4 12"/>
                        : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
                      }
                    </svg>
                    {linkCopied ? 'Copied' : 'Copy link'}
                  </button>
                </div>
                {/* How to use link */}
                <button
                  onClick={() => setShowHowToModal(true)}
                  style={{
                    background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer',
                    padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                  }}
                >
                  How to use this link
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* How to use modal */}
          {showHowToModal && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setShowHowToModal(false) }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
                backdropFilter: 'blur(3px)', zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
              }}
            >
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 14, width: '100%', maxWidth: 460,
                boxShadow: '0 20px 60px rgba(0,0,0,.15)', padding: '28px 24px', position: 'relative',
              }}>
                <button
                  onClick={() => setShowHowToModal(false)}
                  style={{
                    position: 'absolute', top: 16, right: 16, width: 28, height: 28,
                    borderRadius: 6, border: '1px solid var(--border-2)', background: 'var(--surface-3)',
                    color: 'var(--t2)', cursor: 'pointer', display: 'grid', placeItems: 'center',
                    fontSize: 16, lineHeight: 1,
                  }}
                >
                  &times;
                </button>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }}>
                  How to use your portfolio link
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 20 }}>
                  Copy your link and paste it anywhere customers might look you up. Every visit is tracked and shows up in your Reporting page.
                </div>
                {[
                  { step: 1, content: 'Copy your link using the button above.' },
                  {
                    step: 2, content: (
                      <div>
                        Paste it wherever your customers find you:
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {['Google Business Profile', 'Facebook', 'Instagram bio', 'Nextdoor', 'Email signature', 'Printed estimates', 'Text messages'].map((p) => (
                            <span key={p} style={{
                              display: 'inline-flex', alignItems: 'center',
                              padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                              background: 'var(--surface-3)', color: 'var(--t2)', border: '1px solid var(--border)',
                            }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    ),
                  },
                  { step: 3, content: 'When a homeowner clicks the link, their visit is recorded. Check Reporting to see how many people have viewed your portfolio.' },
                ].map(({ step, content }) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--t2)', lineHeight: 1.55, marginBottom: 12 }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--sky-dim)', color: 'var(--sky-text)',
                      fontSize: 11, fontWeight: 700, display: 'grid', placeItems: 'center',
                      flexShrink: 0, marginTop: 1,
                    }}>{step}</div>
                    <div>{content}</div>
                  </div>
                ))}
                <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>Adding to Google Business Profile</div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55 }}>
                  Go to <strong>business.google.com</strong> → Edit profile → Contact → Website → paste your link. This puts your portfolio in front of homeowners who find you on Google Maps or Search.
                </div>
              </div>
            </div>
          )}

          {/* Google Search Console — coming soon */}
          <div className="db-shell-card" style={{ padding: 0, overflow: 'hidden', opacity: 0.65 }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--surface-3)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Google Search Console</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>See your search impressions and clicks inside this dashboard</div>
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: 'var(--surface-3)', color: 'var(--t3)', flexShrink: 0,
              }}>
                Coming soon
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Downgrade warning modal — rendered outside tabs so it always overlays */}
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
