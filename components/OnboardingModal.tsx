'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const TRADES = [
  'Door Installation',
  'Garage Door',
  'HVAC',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Landscaping',
  'Painting',
  'Flooring',
  'General Contractor',
  'Other',
]

const HEARD_ABOUT = [
  'Google Search',
  'Facebook / Social Media',
  'Referral from a colleague',
  'LinkedIn',
  'Trade show / event',
  'Online ad',
  'Other',
]

const PLAN_LABELS: Record<string, string> = {
  free:  'Free Starter',
  pro:   'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

const PLAN_FEATURES: Record<string, string[]> = {
  free:  ['Job check-ins with photos (up to 5 per job)', 'Up to 5 published job pages on Google', 'Basic dashboard'],
  pro:   ['Unlimited published job pages with full SEO', 'Portfolio page', 'Analytics & click tracking', 'Remove "Powered by" branding'],
  elite: ['Everything in Pro', 'Auto-formatted Google Business Profile posts', 'Post-job review requests', 'Review tracking'],
  titan: ['Everything in Elite', 'Geo-grid rank tracking', 'Multi-location support', 'Priority support'],
}

interface Props {
  planTier?: string | null
  orgSlug?: string | null
}

export default function OnboardingModal({ planTier, orgSlug }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 2 form state
  const [bizName,      setBizName]      = useState('')
  const [bizPhone,     setBizPhone]     = useState('')
  const [bizWebsite,   setBizWebsite]   = useState('')
  const [trade,        setTrade]        = useState('')
  const [heardAbout,   setHeardAbout]   = useState('')
  const [heardOther,   setHeardOther]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [savedSlug,    setSavedSlug]    = useState<string | null>(orgSlug ?? null)

  // Suppress ESC key while modal is mounted
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault()
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [])

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length === 0) return ''
    if (d.length < 4)  return `(${d}`
    if (d.length < 7)  return `(${d.slice(0,3)}) ${d.slice(3)}`
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  }

  const handleStep2Submit = async () => {
    setError(null)
    if (!bizName.trim()) { setError('Business name is required.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/organization/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          bizName.trim(),
          phone:         bizPhone.trim() || undefined,
          website:       bizWebsite.trim() || undefined,
          trade:         trade || undefined,
          howHeardAbout: heardAbout === 'Other' ? heardOther.trim() : heardAbout || undefined,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save. Please try again.')
      if (data?.organization?.slug) setSavedSlug(data.organization.slug)
      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = () => {
    // Full reload so the server re-reads onboardingComplete = true from DB
    // and the modal doesn't re-render
    window.location.href = '/dashboard'
  }

  const tier = planTier || 'free'
  const planLabel = PLAN_LABELS[tier] || 'Free Starter'
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES.free

  return (
    // Backdrop — pointer-events: none so clicks pass through to nothing interactive
    <div style={styles.backdrop} aria-modal="true" role="dialog" aria-label="Account setup">
      <div style={styles.modal}>

        {/* Progress dots */}
        <div style={styles.dots}>
          {[1,2,3].map(n => (
            <div key={n} style={{ ...styles.dot, ...(n === step ? styles.dotActive : n < step ? styles.dotDone : {}) }} />
          ))}
        </div>

        {/* ── STEP 1: Welcome ── */}
        {step === 1 && (
          <div style={styles.body}>
            <div style={styles.welcomeIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>You&rsquo;re in — welcome to ProjectCheckin</h2>
            <p style={styles.stepSub}>
              You&rsquo;re on the <strong style={{ color: '#0EA5E9' }}>{planLabel}</strong> plan.
              Here&rsquo;s what&rsquo;s ready for you:
            </p>
            <ul style={styles.featureList}>
              {features.map(f => (
                <li key={f} style={styles.featureItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p style={styles.stepNote}>
              Next, we&rsquo;ll set up your business profile. It only takes 60 seconds and makes everything work properly.
            </p>
            <button style={styles.btnPrimary} onClick={() => setStep(2)}>
              Set up my business profile
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}

        {/* ── STEP 2: Business details ── */}
        {step === 2 && (
          <div style={styles.body}>
            <h2 style={styles.stepTitle}>Tell us about your business</h2>
            <p style={styles.stepSub}>
              This information powers your public job pages and portfolio — it&rsquo;s how new customers find and contact you.
            </p>

            <div style={styles.form}>

              {/* Business name */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-name">
                  Business name <span style={styles.required}>*</span>
                </label>
                <input
                  id="ob-name"
                  type="text"
                  style={styles.input}
                  placeholder="Wilson's Door Company"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  autoFocus
                />
                <span style={styles.hint}>Appears on every published job page and your portfolio.</span>
              </div>

              {/* Business phone */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-phone">Business phone</label>
                <input
                  id="ob-phone"
                  type="tel"
                  style={styles.input}
                  placeholder="(256) 555-0190"
                  value={bizPhone}
                  onChange={e => setBizPhone(formatPhone(e.target.value))}
                />
                <span style={styles.hint}>
                  Customers who find you on Google will call this number directly from your job pages.
                </span>
              </div>

              {/* Website */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-web">Business website</label>
                <input
                  id="ob-web"
                  type="text"
                  style={styles.input}
                  placeholder="www.wilsonsdoors.com"
                  value={bizWebsite}
                  onChange={e => setBizWebsite(e.target.value)}
                />
                <span style={styles.hint}>
                  We link directly to your site from every published job — free traffic to your own website.
                </span>
              </div>

              {/* Trade */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-trade">What type of work do you do?</label>
                <select
                  id="ob-trade"
                  style={styles.select}
                  value={trade}
                  onChange={e => setTrade(e.target.value)}
                >
                  <option value="">Select your trade</option>
                  {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={styles.hint}>
                  Helps us generate accurate SEO copy for your job pages so the right customers find you.
                </span>
              </div>

              {/* How did you hear */}
              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-heard">How did you hear about us?</label>
                <select
                  id="ob-heard"
                  style={styles.select}
                  value={heardAbout}
                  onChange={e => setHeardAbout(e.target.value)}
                >
                  <option value="">Select one</option>
                  {HEARD_ABOUT.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {heardAbout === 'Other' && (
                  <input
                    type="text"
                    style={{ ...styles.input, marginTop: '8px' }}
                    placeholder="Tell us more…"
                    value={heardOther}
                    onChange={e => setHeardOther(e.target.value)}
                  />
                )}
              </div>

              {error && <div style={styles.errorBox}>{error}</div>}

              <button
                style={{ ...styles.btnPrimary, ...(submitting ? styles.btnDisabled : {}) }}
                onClick={handleStep2Submit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10"/>
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    Save and continue
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: First steps ── */}
        {step === 3 && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#F0FDF4', borderColor: '#A7F3D0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>You&rsquo;re all set!</h2>
            <p style={styles.stepSub}>
              Your business profile is live. Here are three great ways to get started:
            </p>

            <div style={styles.actionCards}>
              <a href="/check-in" style={styles.actionCard}>
                <div style={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#0EA5E9" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                <div>
                  <div style={styles.actionTitle}>Submit your first check-in</div>
                  <div style={styles.actionDesc}>Complete a job and publish your first Google-indexed page.</div>
                </div>
              </a>

              <a href="/dashboard?tab=team" style={styles.actionCard}>
                <div style={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#0EA5E9" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div>
                  <div style={styles.actionTitle}>Invite your crew</div>
                  <div style={styles.actionDesc}>Add team members so they can check in from the field.</div>
                </div>
              </a>

              {savedSlug && (
                <a href={`/portfolio/${savedSlug}`} target="_blank" rel="noreferrer" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#0EA5E9" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                  <div>
                    <div style={styles.actionTitle}>View your portfolio page</div>
                    <div style={styles.actionDesc}>Your shareable link is live — send it to customers.</div>
                  </div>
                </a>
              )}
            </div>

            <button style={styles.btnPrimary} onClick={handleFinish}>
              Go to my dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Inline styles (avoids CSS-in-JS dependency and keeps component self-contained) ──
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(12, 74, 110, 0.55)',
    backdropFilter:  'blur(4px)',
    zIndex:          9999,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '16px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
  },
  modal: {
    background:      '#fff',
    borderRadius:    '20px',
    width:           '100%',
    maxWidth:        '520px',
    maxHeight:       '90vh',
    overflowY:       'auto',
    boxShadow:       '0 24px 80px rgba(12,74,110,0.25)',
    padding:         '36px 32px 32px',
    position:        'relative',
  },
  dots: {
    display:         'flex',
    justifyContent:  'center',
    gap:             '8px',
    marginBottom:    '28px',
  },
  dot: {
    width:           '8px',
    height:          '8px',
    borderRadius:    '50%',
    background:      '#BAE6FD',
    transition:      'all 0.2s',
  },
  dotActive: {
    background:      '#0EA5E9',
    width:           '24px',
    borderRadius:    '4px',
  },
  dotDone: {
    background:      '#059669',
  },
  body: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '0',
  },
  welcomeIcon: {
    width:           '56px',
    height:          '56px',
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '14px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    '16px',
  },
  stepTitle: {
    fontSize:        '22px',
    fontWeight:      800,
    color:           '#0C4A6E',
    letterSpacing:   '-0.025em',
    marginBottom:    '8px',
    lineHeight:      1.2,
  },
  stepSub: {
    fontSize:        '14px',
    color:           '#4B7A94',
    lineHeight:      1.6,
    marginBottom:    '20px',
  },
  featureList: {
    listStyle:       'none',
    padding:         0,
    margin:          '0 0 20px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '10px',
  },
  featureItem: {
    display:         'flex',
    alignItems:      'flex-start',
    gap:             '10px',
    fontSize:        '14px',
    color:           '#0C4A6E',
    lineHeight:      1.5,
  },
  stepNote: {
    fontSize:        '13px',
    color:           '#4B7A94',
    lineHeight:      1.55,
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '10px',
    padding:         '12px 14px',
    marginBottom:    '24px',
  },
  btnPrimary: {
    width:           '100%',
    height:          '50px',
    background:      '#F97316',
    color:           '#fff',
    border:          'none',
    borderRadius:    '10px',
    fontSize:        '15px',
    fontWeight:      700,
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             '8px',
    boxShadow:       '0 2px 12px rgba(249,115,22,0.3)',
    letterSpacing:   '-0.01em',
    marginTop:       '4px',
  },
  btnDisabled: {
    opacity:         0.65,
    cursor:          'not-allowed',
  },
  form: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '18px',
  },
  field: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '5px',
  },
  label: {
    fontSize:        '13px',
    fontWeight:      600,
    color:           '#0C4A6E',
  },
  required: {
    color:           '#DC2626',
    marginLeft:      '2px',
  },
  input: {
    width:           '100%',
    height:          '44px',
    padding:         '0 14px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    fontSize:        '14px',
    color:           '#0C4A6E',
    background:      '#fff',
    border:          '1.5px solid #BAE6FD',
    borderRadius:    '10px',
    outline:         'none',
    boxSizing:       'border-box',
  },
  select: {
    width:           '100%',
    height:          '44px',
    padding:         '0 14px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    fontSize:        '14px',
    color:           '#0C4A6E',
    background:      '#fff',
    border:          '1.5px solid #BAE6FD',
    borderRadius:    '10px',
    outline:         'none',
    cursor:          'pointer',
    boxSizing:       'border-box',
  },
  hint: {
    fontSize:        '11.5px',
    color:           '#4B7A94',
    lineHeight:      1.5,
  },
  errorBox: {
    background:      '#FEF2F2',
    border:          '1px solid #FECACA',
    borderRadius:    '8px',
    padding:         '10px 14px',
    fontSize:        '13px',
    color:           '#DC2626',
  },
  actionCards: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '10px',
    marginBottom:    '24px',
  },
  actionCard: {
    display:         'flex',
    alignItems:      'flex-start',
    gap:             '14px',
    padding:         '14px 16px',
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '12px',
    textDecoration:  'none',
    transition:      'border-color 0.15s, background 0.15s',
    cursor:          'pointer',
  },
  actionIcon: {
    width:           '40px',
    height:          '40px',
    background:      '#fff',
    border:          '1px solid #BAE6FD',
    borderRadius:    '10px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  actionTitle: {
    fontSize:        '14px',
    fontWeight:      700,
    color:           '#0C4A6E',
    marginBottom:    '3px',
  },
  actionDesc: {
    fontSize:        '12.5px',
    color:           '#4B7A94',
    lineHeight:      1.4,
  },
  spinner: {
    animation: 'spin 0.8s linear infinite',
  },
}
