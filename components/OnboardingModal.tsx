'use client'

import { useState, useEffect, useCallback } from 'react'
import { tierHasFeature } from '@/lib/planVersions'
import { TRADES } from '@/lib/tradeProducts'

const WIDGET_PLATFORM_INSTRUCTIONS: Record<string, string> = {
  WordPress: '1. Log into WordPress and open the page where you want your work to show up (or create a new page).\n2. Click the + button to add a new block.\n3. Type "Custom HTML" in the search box and select it.\n4. Paste the code below into that block.\n5. Click Update (or Publish) in the top right to save your page.',
  Squarespace: '1. Log into Squarespace and open the page where you want your work to show up.\n2. Click Edit on that page.\n3. Click the + icon where you want the widget to appear, scroll down, and choose Code.\n4. Paste the code below into the box that opens, then click Apply.\n5. Click Save, then Publish, in the top right.',
  Webflow: '1. Open your site in the Webflow Designer and go to the page where you want your work to show up.\n2. In the left panel, find the Embed element and drag it onto the page.\n3. Double-click the Embed box you just added.\n4. Paste the code below into the box, then click Save & Close.\n5. Click Publish in the top right to make it live.',
  'Plain HTML': '1. Find the HTML file for the page where you want your work to show up. If someone else built your site, ask them for it — or log into your hosting account (GoDaddy, Bluehost, Netlify, etc.) and look for "File Manager" or "Site Files."\n2. Right-click that file and choose Open With → Notepad (Windows) or TextEdit (Mac). Don’t use Microsoft Word — it can break the file.\n3. Press Ctrl+F (Cmd+F on Mac) and search for </body>. That’s a marker near the end of the file.\n4. Click right before </body> and paste the code below.\n5. Save the file, then upload it back to your host the same way you found it. Most hosts show a Save or Publish button.\n6. Stuck? Your web host’s live chat can usually paste one snippet for you in a few minutes — just say "I need to add one HTML snippet before </body> on this page."',
}

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
  free:  ['Job check-ins with photos (up to 5 per job)', 'Basic dashboard'],
  pro:   ['Unlimited published job pages with full SEO', 'Portfolio page', 'Analytics & click tracking', 'Google Business Profile post generator'],
  elite: ['Everything in Pro', 'Auto-formatted Google Business Profile posts', 'Professional before & after images', 'Ghost camera overlay', 'Drag-to-reveal widget'],
  titan: ['Everything in Elite', 'Automatic Google Business review requests', 'Custom AI copywriting agent', 'Custom AI Review Request Manager', 'Custom website widget for local SEO', 'Custom subdomain & white-label branding'],
}

interface Props {
  planTier?: string | null
  orgSlug?: string | null
}

const ONBOARDING_STEP_KEY = 'pc_onboarding_step'

export default function OnboardingModal({ planTier, orgSlug }: Props) {
  const isTitan = (planTier ?? 'free').toLowerCase() === 'titan'
  // Widget setup step (step 6) — Titan only, gated by the website_integration feature
  const hasWidgetStep = tierHasFeature(planTier, 'website_integration')
  const maxStep = hasWidgetStep ? 6 : 5

  const [step, setStepState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const saved = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '1', 10)
    const max = tierHasFeature(planTier, 'website_integration') ? 6 : 5
    return (saved >= 1 && saved <= max) ? saved : 1
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

  // Widget setup step state (step 6, Titan only)
  const [wUrl,            setWUrl]            = useState('')
  const [wSaving,         setWSaving]         = useState(false)
  const [wError,          setWError]          = useState<string | null>(null)
  const [wPlatform,       setWPlatform]       = useState<string>('WordPress')
  const [wCopied,         setWCopied]         = useState(false)
  const [wShowInfo,       setWShowInfo]       = useState(false)
  const [wShowUrlInstr,   setWShowUrlInstr]   = useState(false)
  const [wShowEmbedInstr, setWShowEmbedInstr] = useState(false)

  // AI research step state (Titan only — shown between step 2 and step 3)
  const [showAiResearch,  setShowAiResearch]  = useState(false)
  const [aiScraping,      setAiScraping]      = useState(false)
  const [aiScraped,       setAiScraped]       = useState(false)
  const [aiError,         setAiError]         = useState<string | null>(null)
  const [aiServices,      setAiServices]      = useState('')
  const [aiProducts,      setAiProducts]      = useState('')
  const [aiServiceArea,   setAiServiceArea]   = useState('')
  const [aiAbout,         setAiAbout]         = useState('')
  const [aiSaving,        setAiSaving]        = useState(false)

  const handleActivateAgentResearch = useCallback(async () => {
    setAiScraping(true)
    setAiError(null)
    try {
      const res = await fetch('/api/agents/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAiError(data?.error === 'rate_limited' ? 'Scan limit reached.' : 'Unable to read your website. Fill in your business info below.')
        setAiScraped(true)
        return
      }
      setAiServices(data.services ?? '')
      setAiProducts(data.products ?? '')
      setAiServiceArea(data.serviceArea ?? '')
      setAiAbout(data.businessDescription ?? '')
      setAiScraped(true)
    } catch {
      setAiError('Unable to read your website. Fill in your business info below.')
      setAiScraped(true)
    } finally {
      setAiScraping(false)
    }
  }, [])

  const handleAiStepConfirm = useCallback(async () => {
    setAiSaving(true)
    try {
      await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: aiServices,
          products: aiProducts,
          serviceArea: aiServiceArea,
          businessDescription: aiAbout,
        }),
      })
    } catch {
      // non-fatal — data already saved by scrape route; silently continue
    } finally {
      setAiSaving(false)
      setShowAiResearch(false)
      setStep(3)
    }
  }, [aiServices, aiProducts, aiServiceArea, aiAbout])

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
      if (isTitan) {
        setShowAiResearch(true)
      } else {
        setStep(3)
      }
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
    await fetch('/api/auth/session')
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    window.location.href = '/dashboard'
  }

  const widgetSlug = savedSlug || orgSlug || 'your-business'
  const widgetBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')

  const handleWidgetCopy = () => {
    const snippet = `<!-- ProjectCheckin: Website Integration for Local SEO -->\n<div id="pc-widget" data-org="${widgetSlug}"></div>\n<script src="${widgetBaseUrl}/widget.v1.js" defer></script>`
    navigator.clipboard.writeText(snippet).then(() => {
      setWCopied(true)
      setTimeout(() => setWCopied(false), 2000)
    })
  }

  // Save the portfolio URL if one was entered, then advance to the final onboarding step
  const handleWidgetFinish = async () => {
    const url = wUrl.trim()
    if (url) {
      let valid = false
      try {
        const parsed = new URL(url)
        valid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch { valid = false }
      if (!valid) {
        setWError('Enter a full URL starting with https:// (e.g. https://yourwebsite.com/our-work)')
        return
      }
      setWSaving(true)
      setWError(null)
      try {
        const res = await fetch('/api/organization/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolioPageUrl: url }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Failed to save. Please try again.')
        }
      } catch (err: any) {
        setWError(err.message)
        setWSaving(false)
        return
      }
      setWSaving(false)
    }
    setStep(6)
  }

  const tier = planTier || 'free'
  const planLabel = PLAN_LABELS[tier] || 'Free Starter'
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES.free

  return (
    <div style={styles.backdrop} aria-modal="true" role="dialog" aria-label="Account setup">
      <div style={styles.modal}>

        {/* Progress dots — 5 base, +1 for Titan AI step, +1 for Titan widget step */}
        {(() => {
          const totalDots = (isTitan ? 6 : 5) + (hasWidgetStep ? 1 : 0)
          // For Titan: AI step = dot 3, GBP steps shift to 4 and 5, done = 6
          const activeDot = showAiResearch ? 3 : (isTitan && step >= 3 ? step + 1 : step)
          return (
            <div style={styles.dots}>
              {Array.from({ length: totalDots }, (_, i) => i + 1).map(n => (
                <div key={n} style={{ ...styles.dot, ...(n === activeDot ? styles.dotActive : n < activeDot ? styles.dotDone : {}) }} />
              ))}
            </div>
          )
        })()}

        {/* ── TITAN ONLY: AI Agent Research step (shown after step 2) ── */}
        {showAiResearch && isTitan && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#FFF7ED', borderColor: '#FED7AA' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>Activate Agent Research</h2>
            <p style={styles.stepSub}>
              Your AI copywriting agent reads your website to learn your business — services, products, and service area — so it can write accurate job descriptions without you lifting a finger.
            </p>

            {bizWebsite && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#0C4A6E' }}>
                <span style={{ fontWeight: 600 }}>Website: </span>
                <span style={{ color: '#0EA5E9' }}>{bizWebsite}</span>
              </div>
            )}

            {!aiScraped && (
              <button
                style={{ ...styles.btnPrimary, ...(aiScraping ? styles.btnDisabled : {}), background: aiScraping ? '#94A3B8' : '#F97316' }}
                onClick={handleActivateAgentResearch}
                disabled={aiScraping}
              >
                {aiScraping ? (
                  <>
                    <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10"/>
                    </svg>
                    Analyzing your website…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M4.93 4.93a10 10 0 000 14.14"/></svg>
                    Activate Agent Research
                  </>
                )}
              </button>
            )}

            {aiError && (
              <div style={{ ...styles.errorBox, marginBottom: 12 }}>{aiError}</div>
            )}

            {aiScraped && (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, marginTop: 4 }}>
                {!aiError && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#065F46' }}>
                    Research complete. Review and edit below before continuing.
                  </div>
                )}
                <div style={styles.field}>
                  <label style={styles.label}>Services offered</label>
                  <input type="text" style={styles.input} value={aiServices} onChange={e => setAiServices(e.target.value)} placeholder="e.g. Door installation, garage doors, storm doors" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Products / brands</label>
                  <input type="text" style={styles.input} value={aiProducts} onChange={e => setAiProducts(e.target.value)} placeholder="e.g. Therma-Tru, Pella, Emtek hardware" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Service area</label>
                  <input type="text" style={styles.input} value={aiServiceArea} onChange={e => setAiServiceArea(e.target.value)} placeholder="e.g. Huntsville, AL and surrounding areas" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>About your business</label>
                  <textarea
                    style={{ ...styles.input, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }}
                    rows={3}
                    value={aiAbout}
                    onChange={e => setAiAbout(e.target.value)}
                    placeholder="1–2 sentences about what you do and who you serve."
                  />
                </div>

                <button
                  style={{ ...styles.btnPrimary, ...(aiSaving ? styles.btnDisabled : {}) }}
                  onClick={handleAiStepConfirm}
                  disabled={aiSaving}
                >
                  {aiSaving ? (
                    <>
                      <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0110 10"/>
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      Looks good — continue
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </>
                  )}
                </button>
              </div>
            )}

            {!aiScraped && (
              <button onClick={() => { setShowAiResearch(false); setStep(3) }} style={styles.btnSkip}>
                Skip for now
              </button>
            )}
          </div>
        )}

        {/* ── STEP 1: Welcome ── */}
        {!showAiResearch && step === 1 && (
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
        {!showAiResearch && step === 2 && (
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
        {!showAiResearch && step === 3 && (
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
        {!showAiResearch && step === 4 && (
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

        {/* ── FINAL STEP: First steps / You're all set (step 5 of 5, or step 6 of 6 for Titan widget users) ── */}
        {!showAiResearch && (hasWidgetStep ? step === 6 : step === 5) && (
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

        {/* ── STEP 5: Website Integration for Local SEO (Titan only, optional) ── */}
        {!showAiResearch && step === 5 && hasWidgetStep && (
          <div style={styles.body}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#F97316', marginBottom: 5 }}>
              Step 5 of {maxStep} — Optional
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <h2 style={{ ...styles.stepTitle, marginBottom: 0 }}>Website Integration for Local SEO</h2>
              <button
                onClick={() => setWShowInfo(!wShowInfo)}
                aria-label="What is this?"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: wShowInfo ? '#0EA5E9' : '#94A3B8', padding: 0, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </button>
            </div>
            {wShowInfo && (
              <div style={{ background: '#0F172A', color: '#E8F0F8', borderRadius: 10, padding: '13px 34px 13px 15px', fontSize: 12.5, lineHeight: 1.65, position: 'relative' as const, marginBottom: 12 }}>
                <button onClick={() => setWShowInfo(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 3px' }}>×</button>
                Deliver geo-content and authority to your own domain. Publish jobs to build local SEO, so customers find you faster. Link your Google Business Profile posts from ProjectCheckin to your own website.
              </div>
            )}
            <div style={{ height: 8 }} />

            {/* Section 1: portfolio URL */}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0C4A6E', marginBottom: 6 }}>Paste your portfolio page URL here</div>
            <button
              onClick={() => setWShowUrlInstr(!wShowUrlInstr)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: '#0EA5E9', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", alignSelf: 'flex-start' }}
            >
              Instructions
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: wShowUrlInstr ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {wShowUrlInstr && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10 }}>
                Create a page on your website (e.g. yourwebsite.com/our-work) and paste its URL here. This is where your new portfolio of work will show up on your website and will automatically start generating local SEO for your page. You can always opt out at any time if you&rsquo;d like, and remove the page.
              </div>
            )}
            <input
              type="url"
              style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13, marginBottom: 14 }}
              placeholder="https://yourwebsite.com/our-work"
              value={wUrl}
              onChange={e => { setWUrl(e.target.value); setWError(null) }}
            />

            {/* Section 2: embed code */}
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0C4A6E', marginBottom: 6 }}>Add the widget to your website</div>
            <button
              onClick={() => setWShowEmbedInstr(!wShowEmbedInstr)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: '#0EA5E9', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", alignSelf: 'flex-start' }}
            >
              Instructions
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: wShowEmbedInstr ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {wShowEmbedInstr && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10 }}>
                After you create a new page on your website (e.g., yourwebsite.com/our-work), select the website builder by clicking one of the options below. Then, paste the code below into that new page you created. Your published jobs will appear automatically — no updates needed.
              </div>
            )}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' as const }}>
              {Object.keys(WIDGET_PLATFORM_INSTRUCTIONS).map((p) => (
                <button
                  key={p}
                  onClick={() => setWPlatform(p)}
                  style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", border: wPlatform === p ? '1px solid rgba(14,165,233,.4)' : '1.5px solid #BAE6FD', color: wPlatform === p ? '#0284C7' : '#4B7A94', background: wPlatform === p ? '#F0F9FF' : '#fff' }}
                >
                  {p}
                </button>
              ))}
            </div>
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10, whiteSpace: 'pre-line' as const }}>
              {WIDGET_PLATFORM_INSTRUCTIONS[wPlatform]}
            </div>
            <div style={{ background: '#0F172A', color: '#7DD3FC', borderRadius: 8, padding: '12px 14px', fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.6, marginBottom: 10, overflowX: 'auto' as const, whiteSpace: 'pre' as const }}>
              <span style={{ color: '#86EFAC' }}>&lt;div</span> <span style={{ color: '#FCA5A5' }}>id</span>=<span style={{ color: '#FDE68A' }}>&quot;pc-widget&quot;</span> <span style={{ color: '#FCA5A5' }}>data-org</span>=<span style={{ color: '#FDE68A' }}>&quot;{widgetSlug}&quot;</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/div&gt;</span>{'\n'}
              <span style={{ color: '#86EFAC' }}>&lt;script</span> <span style={{ color: '#FCA5A5' }}>src</span>=<span style={{ color: '#FDE68A' }}>&quot;{widgetBaseUrl}/widget.v1.js&quot;</span> <span style={{ color: '#FCA5A5' }}>defer</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/script&gt;</span>
            </div>
            <button
              onClick={handleWidgetCopy}
              style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: '#F0F9FF', color: wCopied ? '#059669' : '#4B7A94', border: '1px solid #BAE6FD' }}
            >
              {wCopied ? 'Copied!' : 'Copy code'}
            </button>

            {wError && <div style={{ ...styles.errorBox, marginTop: 14 }}>{wError}</div>}

            {/* Footer: skip left, save & finish right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #E0F2FE' }}>
              <div>
                <button onClick={() => setStep(6)} style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'flex-start', textAlign: 'left' as const, padding: 0 }}>
                  Skip — set up later in Account → Connections
                </button>
                <div style={{ fontSize: 11.5, color: '#4B7A94', lineHeight: 1.5, marginTop: 6 }}>
                  No website yet? Your GBP posts are still building your Google presence.
                </div>
              </div>
              <button
                style={{ ...styles.btnPrimary, width: 'auto', height: 44, padding: '0 20px', marginTop: 0, flexShrink: 0, ...(wSaving ? styles.btnDisabled : {}) }}
                onClick={handleWidgetFinish}
                disabled={wSaving}
              >
                {wSaving ? 'Saving…' : 'Continue'}
              </button>
            </div>
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
