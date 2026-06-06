'use client'

import { useState, useEffect } from 'react'

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
  pro:   ['Unlimited published job pages with full SEO', 'Portfolio page', 'Analytics & click tracking', 'Google Business Profile post generator'],
  elite: ['Everything in Pro', 'Auto-formatted Google Business Profile posts', 'Professional before & after images', 'Ghost camera overlay', 'Drag-to-reveal widget'],
  titan: ['Everything in Elite', 'Automatic Google Business review requests', 'Custom AI copywriting agent', 'Custom AI Review Request Manager', 'Custom subdomain & white-label branding'],
}

interface Props {
  planTier?: string | null
  orgSlug?: string | null
}

const ONBOARDING_STEP_KEY = 'pc_onboarding_step'

export default function OnboardingModal({ planTier, orgSlug }: Props) {
  const [step, setStepState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const saved = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '1', 10)
    return (saved >= 1 && saved <= 5) ? saved : 1
  })

  const setStep = (n: number) => {
    localStorage.setItem(ONBOARDING_STEP_KEY, String(n))
    setStepState(n)
  }

  // Step 4 — GBP review link
  const [gbpReviewLink,  setGbpReviewLink]  = useState('')
  const [gbpLinkSaving,  setGbpLinkSaving]  = useState(false)
  const [gbpLinkError,   setGbpLinkError]   = useState<string | null>(null)

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

  const handleGbpLinkSave = async () => {
    const link = gbpReviewLink.trim()
    if (!link) { setStep(5); return }

    const isValid =
      link.startsWith('https://g.page/r/') ||
      link.startsWith('https://search.google.com/local/writereview')
    if (!isValid) {
      setGbpLinkError('Link must start with https://g.page/r/ or https://search.google.com/local/writereview')
      return
    }

    setGbpLinkSaving(true)
    setGbpLinkError(null)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gbpReviewLink: link }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save. Please try again.')
      }
      setStep(5)
    } catch (err: any) {
      setGbpLinkError(err.message)
    } finally {
      setGbpLinkSaving(false)
    }
  }

  const handleFinish = async () => {
    await fetch('/api/organization/complete-onboarding', { method: 'POST' })
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    window.location.href = '/dashboard'
  }

  const tier = planTier || 'free'
  const planLabel = PLAN_LABELS[tier] || 'Free Starter'
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES.free

  return (
    <div style={styles.backdrop} aria-modal="true" role="dialog" aria-label="Account setup">
      <div style={styles.modal}>

        {/* Progress dots — 5 steps */}
        <div style={styles.dots}>
          {[1,2,3,4,5].map(n => (
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
                    stroke="#059669" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
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

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-name">
                  Business name <span style={styles.required}>*</span>
                </label>
                <input
                  id="ob-name"
                  type="text"
                  style={styles.input}
                  placeholder="Your business name"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  autoFocus
                />
                <span style={styles.hint}>Appears on every published job page and your portfolio.</span>
              </div>

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

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-web">Business website</label>
                <input
                  id="ob-web"
                  type="text"
                  style={styles.input}
                  placeholder="www.yourbusiness.com"
                  value={bizWebsite}
                  onChange={e => setBizWebsite(e.target.value)}
                />
                <span style={styles.hint}>
                  We link directly to your site from every published job — free traffic to your own website.
                </span>
              </div>

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

        {/* ── STEP 3: Get your Google review link (guide) ── */}
        {step === 3 && (
          <div style={styles.body}>
            <h2 style={styles.stepTitle}>Get your Google review link</h2>

            {/* 1 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>1</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>
                  Open your Google Business Profile{' '}
                  <a
                    href="https://business.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0EA5E9', textDecoration: 'underline' }}
                  >
                    HERE
                  </a>.
                </div>
              </div>
            </div>

            {/* 2 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>2</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Log in and click &ldquo;Ask for reviews&rdquo;</div>
                <div style={{ ...styles.guideDesc, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: 0 }}>
                  Look for this button on your dashboard:
                  <img
                    src="/images/onboarding/gbp-ask-reviews-icon.png"
                    alt="Ask for reviews button"
                    style={{ height: 46, borderRadius: 6, border: '1px solid #BAE6FD', flexShrink: 0 }}
                  />
                </div>
              </div>
            </div>

            {/* 3 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>3</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Copy your review link</div>
                <div style={styles.guideDesc}>A panel opens with your unique review link. Copy the highlighted link:</div>
                <img
                  src="/images/onboarding/gbp-review-link-screenshot.png"
                  alt="Copy your review link"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #BAE6FD', display: 'block' }}
                />
              </div>
            </div>

            {/* 4 */}
            <div style={{ ...styles.guideStep, marginBottom: 24 }}>
              <div style={styles.guideNum}>4</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Come back here and paste it</div>
                <div style={styles.guideDesc}>Hit the button below when you&rsquo;ve copied your link.</div>
              </div>
            </div>

            <button style={styles.btnPrimary} onClick={() => setStep(4)}>
              I&rsquo;ve copied my link — paste it now
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button onClick={() => setStep(4)} style={styles.btnSkip}>Skip for now</button>
          </div>
        )}

        {/* ── STEP 4: Paste your review link ── */}
        {step === 4 && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>Paste your review link</h2>
            <p style={styles.stepSub}>
              We&rsquo;ll connect the customers you choose to your Google review page with this link.
            </p>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="ob-gbp-link">Your Google review link</label>
              <input
                id="ob-gbp-link"
                type="url"
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13 }}
                placeholder="https://g.page/r/..."
                value={gbpReviewLink}
                onChange={e => { setGbpReviewLink(e.target.value); setGbpLinkError(null) }}
                autoFocus
              />
              <span style={styles.hint}>
                Starts with <code>https://g.page/r/</code> or <code>https://search.google.com/local/writereview</code>
              </span>
            </div>

            {gbpLinkError && <div style={{ ...styles.errorBox, marginBottom: 16 }}>{gbpLinkError}</div>}

            <button
              style={{ ...styles.btnPrimary, ...(gbpLinkSaving ? styles.btnDisabled : {}) }}
              onClick={handleGbpLinkSave}
              disabled={gbpLinkSaving}
            >
              {gbpLinkSaving ? (
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
            <button onClick={() => setStep(5)} style={styles.btnSkip}>Skip for now</button>
          </div>
        )}

        {/* ── STEP 5: First steps ── */}
        {step === 5 && (
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

// ── Inline styles ──
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
  btnSkip: {
    background:      'none',
    border:          'none',
    color:           '#4B7A94',
    fontSize:        '13px',
    fontWeight:      600,
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    cursor:          'pointer',
    marginTop:       '10px',
    alignSelf:       'center',
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
    marginBottom:    '2px',
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
  guideStep: {
    display:         'flex',
    gap:             '12px',
    alignItems:      'flex-start',
  },
  guideNum: {
    width:           '24px',
    height:          '24px',
    minWidth:        '24px',
    background:      '#0EA5E9',
    color:           '#fff',
    borderRadius:    '50%',
    fontSize:        '12px',
    fontWeight:      700,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       '1px',
  },
  guideText: {
    flex:            1,
  },
  guideLabel: {
    fontSize:        '13.5px',
    fontWeight:      700,
    color:           '#0C4A6E',
    marginBottom:    '4px',
    lineHeight:      1.4,
  },
  guideDesc: {
    fontSize:        '12.5px',
    color:           '#4B7A94',
    lineHeight:      1.5,
    marginBottom:    '8px',
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
    animation:       'spin 0.8s linear infinite',
  },
}
