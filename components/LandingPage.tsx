'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/landing.css'

// ── FAQ data ──────────────────────────────────────────────────────────────────
interface FaqItem { q: string; a: string }

const faqs: FaqItem[] = [
  {
    q: 'Does my crew need to download an app?',
    a: 'No download required. Your crew opens a link in a mobile browser, takes photos, adds a description, and submits. Most people are running in under two minutes.',
  },
  {
    q: 'How does the GBP posting work?',
    a: 'After each job is published, ProjectCheckin generates a GBP post for you — formatted and ready. You copy it and paste it into your GBP. Takes about 30 seconds. Full auto-posting is coming in a future update.',
  },
  {
    q: 'What trades does this work for?',
    a: 'Any field service business where the work is done on-site and can be photographed. Roofing, flooring, painting, HVAC, landscaping, plumbing, electrical, remodeling — if your crew goes to a job site, it works.',
  },
  {
    q: "What's the difference between a project page and my portfolio?",
    a: "Every job gets its own project page — a standalone before/after link you can send in a quote. Your portfolio is the full library of all published jobs as a public-facing showcase.",
  },
  {
    q: 'How is this different from posting on Google myself?',
    a: "Posting yourself means gathering photos, writing copy, logging in, and doing it after every job. Most businesses try for two weeks and stop. ProjectCheckin makes it one step your crew handles at the job site — so it happens every job, without you thinking about it.",
  },
  {
    q: 'Is there a contract or commitment?',
    a: "No contract, no commitment. Cancel anytime from your account settings. You keep every project page and portfolio entry you've published — they stay live as long as you're a subscriber.",
  },
  {
    q: "My crew isn't tech-savvy. Will they actually use this?",
    a: "No app to download, no account to create. You send your crew a link — they open it in their phone browser, take photos, add a quick note, and hit submit. Most crews are doing it on their first job. If they can text, they can do this.",
  },
  {
    q: 'How long does it take to get set up?',
    a: 'Under 10 minutes. Create your account, add your business info, and send your crew the check-in link. Your first job can be published the same day.',
  },
  {
    q: 'How do I get more Google reviews from customers?',
    a: "The biggest reason most businesses don't get reviews is they never ask — or they ask too late. ProjectCheckin sends a personalized review request to your customer automatically after each job is published, while the work is still fresh. Text or email, one tap, pre-written. Most businesses see more review conversations in their first month than they did all year.",
  },
  {
    q: 'How do I get my service business to show up on Google?',
    a: 'Google ranks local businesses that are active, documented, and reviewed. Every job you publish through ProjectCheckin creates a location-specific page Google can index, a Google Business Profile post showing recent activity, and a review request to your customer. Do that consistently and your Google presence builds with every job your crew completes.',
  },
]

// ── Arrow SVG ─────────────────────────────────────────────────────────────────
function ArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M11.5 7L8 3.5M11.5 7L8 10.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Checkmark SVG ─────────────────────────────────────────────────────────────
function ChkSVG() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 6l2.5 3L10 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── FAQ chevron ────────────────────────────────────────────────────────────────
function FaqArr() {
  return (
    <span className="faq-arr">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LandingPage({ registrationOpen = false }: { registrationOpen?: boolean }) {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEmail, setModalEmail] = useState('')
  const searchParams = useSearchParams()

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formBusiness, setFormBusiness] = useState('')
  const [formTrade, setFormTrade] = useState('')
  const [formPlan, setFormPlan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Before/after slider refs
  const sliderRef = useRef<HTMLDivElement>(null)
  const afterRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)

  // Portfolio tilt ref
  const browserRef = useRef<HTMLDivElement>(null)

  // ── Effects ────────────────────────────────────────────────────────────────

  // Auto-open modal from URL param
  useEffect(() => {
    if (searchParams.get('modal') === 'waitlist') setModalOpen(true)
  }, [searchParams])

  // Sync prefill email to form
  useEffect(() => { setFormEmail(modalEmail) }, [modalEmail])

  // Body overflow lock
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [modalOpen])

  // Escape key closes modal
  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWaitlistModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen])

  // Reveal animations — targets .r class
  useEffect(() => {
    const els = document.querySelectorAll('.r')
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in')
      }),
      { threshold: 0.06 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Before/After drag slider
  useEffect(() => {
    const slider = sliderRef.current
    const after  = afterRef.current
    const line   = lineRef.current
    const btn    = btnRef.current
    const hint   = hintRef.current
    if (!slider || !after || !line || !btn) return

    let pct = 0.90
    let dragging = false
    let hintDismissed = false

    function apply(p: number) {
      const r = (p * 100).toFixed(1)
      after!.style.clipPath = `inset(0 0 0 ${r}%)`
      line!.style.left = r + '%'
      btn!.style.left  = r + '%'
      if (hint) hint.style.left = r + '%'
    }

    function dismissHint() {
      if (!hintDismissed && hint) {
        hintDismissed = true
        hint.classList.add('hidden')
      }
    }

    function setFromEvent(e: MouseEvent | TouchEvent) {
      const rect = slider!.getBoundingClientRect()
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      pct = Math.min(Math.max((clientX - rect.left) / rect.width, 0.04), 0.96)
      apply(pct)
      dismissHint()
    }

    const onMouseDown = (e: MouseEvent) => { dragging = true; setFromEvent(e) }
    const onMouseUp   = () => { dragging = false }
    const onMouseMove = (e: MouseEvent) => { if (dragging) setFromEvent(e) }
    const onTouchStart = (e: TouchEvent) => { dragging = true; setFromEvent(e) }
    const onTouchEnd  = () => { dragging = false }
    const onTouchMove = (e: TouchEvent) => { if (dragging) setFromEvent(e) }

    slider.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mouseup',    onMouseUp)
    slider.addEventListener('mousemove',  onMouseMove)
    slider.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend',   onTouchEnd)
    slider.addEventListener('touchmove',  onTouchMove, { passive: true })

    apply(pct)

    return () => {
      slider.removeEventListener('mousedown',  onMouseDown)
      window.removeEventListener('mouseup',    onMouseUp)
      slider.removeEventListener('mousemove',  onMouseMove)
      slider.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend',   onTouchEnd)
      slider.removeEventListener('touchmove',  onTouchMove)
    }
  }, [])

  // 3D tilt on portfolio browser
  useEffect(() => {
    const el = browserRef.current
    if (!el) return
    const MAX_TILT = 6
    const onMouseMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width  - 0.5
      const y = (e.clientY - r.top)  / r.height - 0.5
      el.style.transform = `perspective(900px) rotateX(${-y * MAX_TILT}deg) rotateY(${x * MAX_TILT}deg) scale(1.02)`
      el.style.boxShadow = `${-x * MAX_TILT * 2}px ${y * MAX_TILT * 2}px 40px rgba(0,0,0,0.18)`
    }
    const onMouseLeave = () => {
      el.style.transform = ''
      el.style.boxShadow = ''
    }
    el.addEventListener('mousemove',  onMouseMove)
    el.addEventListener('mouseleave', onMouseLeave)
    return () => {
      el.removeEventListener('mousemove',  onMouseMove)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openWaitlistModal(prefillEmail?: string) {
    setModalEmail(prefillEmail ?? '')
    setModalOpen(true)
  }

  function closeWaitlistModal() {
    setModalOpen(false)
  }

  function toggleFaq(i: number) {
    setOpenFaq((prev) => (prev === i ? null : i))
  }

  async function handleWaitlistSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formName.trim() || !formEmail.trim()) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          businessName: formBusiness || undefined,
          trade: formTrade || undefined,
          planInterest: formPlan || undefined,
          source: 'landing-modal',
        }),
      })
      if (!res.ok) throw new Error('Failed')
      setSubmitted(true)
    } catch {
      setSubmitError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // CTA helper — opens modal or links to register
  function primaryCTA(label: string, className: string) {
    if (registrationOpen) {
      return (
        <a href="/auth/register" className={className}>
          {label} <ArrowRight />
        </a>
      )
    }
    return (
      <button className={className} onClick={() => openWaitlistModal()}>
        {label} <ArrowRight />
      </button>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="lp-root">
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        rel="stylesheet"
      />

      {/* Skip to main */}
      <a
        href="#main-content"
        style={{ position: 'absolute', top: '-40px', left: 0, background: '#0C3D5C', color: '#fff', padding: '8px 16px', zIndex: 999, borderRadius: '0 0 4px 0' }}
        onFocus={(e) => { (e.currentTarget as HTMLAnchorElement).style.top = '0' }}
        onBlur={(e)  => { (e.currentTarget as HTMLAnchorElement).style.top = '-40px' }}
      >
        Skip to main content
      </a>

      {/* ── NAV ── */}
      <MarketingNav />

      {/* ── HERO ── */}
      <section className="hero" id="main-content">
        <div className="hero-inner">
          <h1 className="hero-h1 r">
            <span className="h1-line1">Show your best work.</span>
            <span className="h1-line2"><em>Win your best customers.</em></span>
          </h1>
          <div className="hero-bottom r d2">
            <p className="hero-sub">
              Turn every completed job into a marketing presence that finds your next customer.
            </p>
            <div className="hero-cta-col">
              {registrationOpen ? (
                <a href="/auth/register" className="btn-primary">
                  Get Started <ArrowRight />
                </a>
              ) : (
                <button className="btn-primary" onClick={() => openWaitlistModal()}>
                  Get Early Access <ArrowRight />
                </button>
              )}
              {!registrationOpen && (
                <div className="spots-note">
                  <span className="spots-dot"></span>
                  Founding spots available
                </div>
              )}
              <div className="trust-row">
                <span className="trust-i"><ChkSVG />No agency fees</span>
                <span className="trust-i"><ChkSVG />Cancel anytime</span>
                <span className="trust-i"><ChkSVG />Any trade</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO VISUAL — perspective tilt dashboard ── */}
      <div className="hero-visual-wrap r">
        <div className="hero-visual-inner">
          <div className="dash-ui">
            <div className="dash-side">
              <div className="ds-brand">
                <div className="ds-brand-dot"></div>
                ProjectCheckin
              </div>
              <div className="ds-item">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><rect x="1" y="1" width="4" height="4" rx="1" fill="currentColor"/><rect x="7" y="1" width="4" height="4" rx="1" fill="currentColor" opacity=".4"/><rect x="1" y="7" width="4" height="4" rx="1" fill="currentColor" opacity=".4"/><rect x="7" y="7" width="4" height="4" rx="1" fill="currentColor" opacity=".4"/></svg>
                Overview
              </div>
              <div className="ds-item active">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M6 1l1.6 3.5H12L8.7 7l1.2 4L6 8.8 2.1 11 3.3 7 0 4.5h4.4L6 1Z" fill="currentColor"/></svg>
                My Jobs
              </div>
              <div className="ds-item">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
                Portfolio
              </div>
              <div className="ds-item">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 9l3-3 2.5 2 4-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/></svg>
                Reports
              </div>
            </div>
            <div className="dash-main">
              <div className="dm-header">
                <div>
                  <div className="dm-title">Completed Jobs</div>
                  <div className="dm-sub">Nashville, TN &middot; All trades</div>
                </div>
                <button className="dm-btn">+ New Check-In</button>
              </div>
              <div className="jobs-g">
                <div className="jcard">
                  <div className="jcard-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-door-craftsman.png" alt="" />
                    <span className="jtag">Live</span>
                  </div>
                  <div className="jcard-body">
                    <div className="jcard-t">Door Install — Craftsman</div>
                    <div className="jcard-m">Nashville, TN &middot; Apr 28</div>
                    <div className="jcard-chips"><span className="chip cp">Page</span><span className="chip cg">GBP Post</span><span className="chip cr">Review</span></div>
                  </div>
                </div>
                <div className="jcard">
                  <div className="jcard-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-finished-door.png" alt="" />
                    <span className="jtag">Live</span>
                  </div>
                  <div className="jcard-body">
                    <div className="jcard-t">Entry Door — Brentwood</div>
                    <div className="jcard-m">Brentwood, TN &middot; Apr 26</div>
                    <div className="jcard-chips"><span className="chip cp">Page</span><span className="chip cg">GBP Post</span><span className="chip cr">Review</span></div>
                  </div>
                </div>
                <div className="jcard">
                  <div className="jcard-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-hero-roof-home.png" alt="" style={{ objectPosition: 'center 60%' }} />
                    <span className="jtag">Live</span>
                  </div>
                  <div className="jcard-body">
                    <div className="jcard-t">Roof Replacement</div>
                    <div className="jcard-m">Green Hills, TN &middot; Apr 22</div>
                    <div className="jcard-chips"><span className="chip cp">Page</span><span className="chip cg">GBP Post</span><span className="chip cr">Review</span></div>
                  </div>
                </div>
                <div className="jcard">
                  <div className="jcard-img">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-hero-paint-home.png" alt="" />
                    <span className="jtag">Live</span>
                  </div>
                  <div className="jcard-body">
                    <div className="jcard-t">Exterior Paint</div>
                    <div className="jcard-m">Nashville, TN &middot; Apr 19</div>
                    <div className="jcard-chips"><span className="chip cp">Page</span><span className="chip cg">GBP Post</span><span className="chip cr">Review</span></div>
                  </div>
                </div>
              </div>
              <div className="activity">
                <div className="act-title">Recent Activity</div>
                <div className="act-row"><span className="act-dot"></span><span className="act-text">Review request sent &mdash; Sarah M., Door Install</span><span className="act-time">2m ago</span></div>
                <div className="act-row"><span className="act-dot"></span><span className="act-text">GBP post ready &mdash; Entry Door, Brentwood</span><span className="act-time">1h ago</span></div>
                <div className="act-row"><span className="act-dot"></span><span className="act-text">New project page published &mdash; Roof Replacement</span><span className="act-time">3h ago</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-visual-fade"></div>

      {/* ── STATS ── */}
      <section className="stats">
        <div className="stats-inner">
          <div className="stat r">
            <span className="stat-n">57%</span>
            <div className="stat-lbl">of consumers won&apos;t hire a business with under 4 stars on Google</div>
            <div className="stat-src">BrightLocal, 2023</div>
          </div>
          <div className="stat r d1">
            <span className="stat-n">81%</span>
            <div className="stat-lbl">of customers research on Google before contacting a local business</div>
            <div className="stat-src">BrightLocal, 2024</div>
          </div>
          <div className="stat r d2">
            <span className="stat-n">42%</span>
            <div className="stat-lbl">more direction requests when businesses post photos to Google</div>
            <div className="stat-src">Google Business Profile data</div>
          </div>
          <div className="stat r d3">
            <span className="stat-n">88%</span>
            <div className="stat-lbl">of local searches lead to a business contact within 24 hours</div>
            <div className="stat-src">Think with Google</div>
          </div>
        </div>
      </section>

      {/* ── BENTO ── */}
      <section className="bento-section">
        <div className="bento-head">
          <span className="section-label r">What ProjectCheckin creates</span>
          <h2 className="section-h2 r d1">Your jobs, working for you.</h2>
        </div>
        <div className="bento-grid">

          {/* LEFT COLUMN */}
          <div className="bento-col bento-col-left">

            {/* Portfolio page card */}
            <div className="bc bc-main r d1">
              <span className="bc-label">Shareable Project Page</span>
              <div className="bc-title">A live portfolio page for your business</div>
              <div className="bc-desc">Your own portfolio of your best work, branded for your business. We build the page, you control the content. Send it in quotes. Share it with prospects. Post it to Google Business. Indexed, linkable, and a permanent record of your crew&apos;s work.</div>
              <div className="bc-bullets">
                <ul className="bc-blist">
                  <li>Live, branded URL with your business name</li>
                  <li>Direct links to your website &amp; contact info for leads &amp; SEO</li>
                  <li>Zero effort to set up or create</li>
                </ul>
                <ul className="bc-blist">
                  <li>Fully editable. Update with a click.</li>
                  <li>Optimized for Google Search, ChatGPT, and Gemini so customers find you</li>
                </ul>
              </div>
              <div className="bc-browser" ref={browserRef}>
                <div className="bcb-chrome">
                  <div className="bcb-dots"><span></span><span></span><span></span></div>
                  <div className="bcb-bar">projectcheckin.com/portfolio/YOUR-COMPANY-HERE</div>
                </div>
                <div className="bcb-viewport">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <iframe
                    src="https://jobsite-checkin-staging.vercel.app/portfolio/wave-advisory-3e10"
                    className="bcb-frame"
                    scrolling="no"
                    frameBorder="0"
                    title="Portfolio page preview"
                  />
                </div>
              </div>
            </div>

            {/* Before/After text card */}
            <div className="bc bc-bac-text r d4">
              <span className="bc-label">Before / After</span>
              <div className="bc-title">Drag-to-reveal proof of the transformation</div>
              <div className="bc-desc">Every job page includes an interactive before/after comparison your prospects can drag and explore. Proof they can feel, not just read.</div>
              <ul className="bc-blist" style={{ marginBottom: '16px' }}>
                <li>Built into every published job page automatically</li>
                <li>Shareable — send it in quotes, texts, or emails</li>
                <li>Visible on your portfolio and in Google search results</li>
              </ul>
              <div className="bac-ghost">
                <div className="bac-ghost-bar">
                  <span className="bac-ghost-label">Ghost Camera — in the field</span>
                  <span className="bac-ghost-dot"></span>
                </div>
                <div className="bac-ghost-body">
                  <div className="ghost-phone-wrap">
                    <div className="ghost-phone">
                      <div className="ghost-notch" />
                      <div className="ghost-screen">
                        <div className="ghost-live-feed" />
                        <div className="ghost-overlay" />
                        <div className="ghost-reticle">
                          <span className="rct rct-tl" />
                          <span className="rct rct-tr" />
                          <span className="rct rct-bl" />
                          <span className="rct rct-br" />
                        </div>
                        <div className="ghost-top-bar">
                          <div className="ios-icon-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" />
                            </svg>
                          </div>
                          <div className="ios-icon-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="5" cy="12" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="19" cy="12" r="1.5" />
                            </svg>
                          </div>
                        </div>
                        <div className="ghost-bottom-area">
                          <div className="ghost-zoom-row">
                            <div className="ios-zoom-pill">1×</div>
                          </div>
                          <div className="ghost-bottom-bar">
                            <div className="ios-thumb" />
                            <div className="ios-shutter" />
                            <div className="ios-flip">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 4v6h6" />
                                <path d="M23 20v-6h-6" />
                                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bac-ghost-copy">
                    <p><strong>Add a photo later?</strong> The ghost camera overlays the before photo semi-transparently in your viewfinder so your crew lines up the same angle every time — no guessing.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="bento-col bento-col-right">

            {/* GBP card */}
            <div className="bc bc-gbp r d2">
              <span className="bc-label">Google Business Profile Post</span>
              <div className="bc-title">Connect to GBP — Approve and Post in a click</div>
              <div className="bc-desc">Formatted with your photos, job description, and location. You can edit &amp; revise, copy and paste, or with a click auto-post to GBP*.</div>
              <div className="gbp-preview">
                <div className="gbp-source">
                  <div className="gbp-g"></div>
                  <span className="gbp-name">Your Business on Google</span>
                </div>
                <div className="gbp-text">&ldquo;Completed a custom door installation in Brentwood today. New craftsman-style entry with updated hardware. Before and after photos below...&rdquo;</div>
                <button className="gbp-copy-btn">Copy Post Text</button>
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(15,23,42,0.45)', marginTop: '10px', marginBottom: 0 }}>*GBP auto-post coming soon!</p>
            </div>

            {/* Review card */}
            <div className="bc bc-review r d3">
              <span className="bc-label">Review Request</span>
              <div className="bc-title">Pre-written and ready to send</div>
              <div className="bc-desc">A personalized text and/or email to your customer. Edit if you&apos;d like, one tap to send from your phone or email. Logs &ldquo;Sent on&rdquo; dates so you&apos;ll never forget.</div>
              <div className="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <div className="rev-preview">
                <div className="rev-msg">&ldquo;Sarah &mdash; we really appreciated your business. Hope you love the new door. If you have a minute, a Google review helps us more than you know: [review link]&rdquo;</div>
                <div className="rev-photo-strip">
                  <div className="rev-photo-stack">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-door-stone-home.png" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-finished-door.png" alt="" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/lp-door-craftsman.png" alt="" />
                  </div>
                </div>
                <div className="rev-actions">
                  <button className="rev-btn rb-text">Send Text</button>
                  <button className="rev-btn rb-email">Send Email</button>
                </div>
              </div>
            </div>

            {/* Before/After slider card */}
            <div className="bc bc-bac-slider r d5">
              <div className="bac-slider" ref={sliderRef}>
                <div className="bac-img bac-img-before" aria-hidden="true"></div>
                <div className="bac-img bac-img-after"  aria-hidden="true" ref={afterRef}></div>
                <span className="bac-tag bac-tag-b">BEFORE</span>
                <span className="bac-tag bac-tag-a">AFTER</span>
                <div className="bac-line" ref={lineRef}></div>
                <div className="bac-btn"  ref={btnRef}>
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="7 4 3 10 7 16"/><polyline points="13 4 17 10 13 16"/>
                  </svg>
                </div>
                <div className="bac-hint" ref={hintRef}>&larr; drag</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="how" id="how-it-works">
        <div className="how-inner">
          <div className="how-head">
            <span className="section-label r">How It Works</span>
          </div>
          <div className="how-steps">

            {/* Step 01 */}
            <div className="how-step r">
              <div className="hs-copy">
                <div className="hs-step-n">01 &mdash; At the job site</div>
                <h3>Your crew submits a quick check-in on-site.</h3>
                <p>They snap photos of the job and add a quick note on the work — they&apos;ve done it at every job. Now instead of disappearing into a camera roll, they click submit and the job is logged, organized, and ready to work for you.</p>
                <div className="hs-bullets">
                  <div className="hs-b"><span className="hs-b-dot"></span>Before and after shots captured</div>
                  <div className="hs-b"><span className="hs-b-dot"></span>Job address and trade notes logged</div>
                  <div className="hs-b"><span className="hs-b-dot"></span>Customer info saved for a one-tap review request</div>
                </div>
              </div>
              <div className="hs-visual">
                <div className="step-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/lp-contractor-checkin.png" alt="Field crew checking in at job site" />
                  <div className="step-photo-badge">
                    <span className="spb-dot"></span>
                    <div>
                      <div className="spb-text">Check-In Submitted</div>
                      <div className="spb-sub">4 photos &middot; Nashville, TN</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="how-step flip r">
              <div className="hs-copy">
                <div className="hs-step-n">02 &mdash; In your dashboard</div>
                <h3>Each job lands organized and ready to go.</h3>
                <p>Every submission shows up in one clean place — a location-specific job page, a portfolio entry, a formatted Google Business post, and a review message with your customer&apos;s name already in it. Review it, edit if you want, and publish. It takes about 30 seconds.</p>
              </div>
              <div className="hs-visual">
                <div className="dash-mockup">
                  <div className="dm-chrome">
                    <div className="dm-logo">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" className="dm-logo-img" alt="" />
                      <span className="dm-logo-text">ProjectCheckin</span>
                    </div>
                    <button className="dm-new-btn">+ New Check-In</button>
                  </div>
                  <div className="dm-status-bar">
                    <span className="dm-status-dot"></span>
                    Your public portfolio is live &mdash; 5 jobs indexed on Google
                    <span className="dm-view-portfolio">View Portfolio &#8599;</span>
                  </div>
                  <div className="dm-job-header">
                    <div className="dm-date">
                      <div className="dm-date-mon">APR</div>
                      <div className="dm-date-day">18</div>
                    </div>
                    <div className="dm-job-meta">
                      <div className="dm-job-addr">412 Maple Creek Dr., Brentwood, TN 37027</div>
                      <div className="dm-job-type">Wood Door &middot; <span className="dm-photos-link">4 photos</span></div>
                    </div>
                    <div className="dm-live-wrap">
                      <span className="dm-live-dot"></span>
                      <span className="dm-live-text">Live</span>
                    </div>
                    <button className="dm-unpublish-btn">Unpublish</button>
                  </div>
                  <div className="dm-job-body">
                    <div className="dm-col-left">
                      <div className="dm-section">
                        <div className="dm-section-label">Customer <span className="dm-edit-link">Edit</span></div>
                        <div className="dm-customer-name">Jennifer Jones</div>
                        <div className="dm-field-row"><span className="dm-field-lbl">Phone</span>(615) 555-0100</div>
                        <div className="dm-field-row"><span className="dm-field-lbl">Email</span>j.jones@example.com</div>
                      </div>
                      <div className="dm-section">
                        <div className="dm-section-label">Address</div>
                        <div className="dm-addr-text">412 Maple Creek Dr.<br />Brentwood, TN 37027</div>
                        <div className="dm-maps-link">Open in Maps &#8599;</div>
                      </div>
                      <div className="dm-section">
                        <div className="dm-section-label">Job Info</div>
                        <div className="dm-info-row"><span className="dm-info-lbl">Installer</span>Paul</div>
                        <div className="dm-info-row"><span className="dm-info-lbl">Type</span>Wood Door</div>
                        <div className="dm-info-row"><span className="dm-info-lbl">Date</span>April 18, 2026</div>
                      </div>
                      <div className="dm-section">
                        <div className="dm-section-label">Notes</div>
                        <div className="dm-notes-wrap">
                          <div className="dm-notes-text">Replaced existing steel entry door with solid mahogany 3/0 x 6/8 with sidelights. Customer requested matte black hardware throughout. Installed new threshold and weatherstripping.</div>
                          <div className="dm-notes-fade"></div>
                        </div>
                      </div>
                    </div>
                    <div className="dm-col-right">
                      <div className="dm-photos-grid">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/dm-job-photo-1.png" alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/dm-job-photo-2.png" alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/dm-job-photo-3.png" alt="" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/dm-job-photo-4.png" alt="" />
                      </div>
                      <div className="dm-actions">
                        <button className="dm-action-btn"><span className="dm-action-icon">&#128279;</span>Copy Job Link</button>
                        <button className="dm-action-btn dm-action-gbp"><span className="dm-action-icon">&#128205;</span>Post to Google Business</button>
                        <button className="dm-action-btn dm-action-review"><span className="dm-action-icon">&#11088;</span>Request Google Review</button>
                      </div>
                    </div>
                  </div>
                  <div className="dm-user-badge">
                    <div className="dm-user-avatar"></div>
                    <span className="dm-user-plan">Titan Plan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="how-step r">
              <div className="hs-copy">
                <div className="hs-step-n">03 &mdash; Over time</div>
                <h3>Every job adds to a library that wins future work</h3>
                <p>After 30 jobs you have 30 shareable project pages. Your history of finished work becomes the most credible sales tool your business has. These pages are location-specific, tell Google &ldquo;I was here,&rdquo; increase your online footprint, and can drive traffic and leads to your business.</p>
                <div className="hs-bullets">
                  <div className="hs-b"><span className="hs-b-dot"></span>Portfolio grows without extra effort</div>
                  <div className="hs-b"><span className="hs-b-dot"></span>Send project links in quotes and proposals</div>
                  <div className="hs-b"><span className="hs-b-dot"></span>Google presence builds with each published job</div>
                </div>
              </div>
              <div className="hs-visual">
                <div className="dash-mockup">
                  <div className="dm-wrapper">
                    <div className="dm-sidebar">
                      <div className="dm-sidebar-logo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/logo.png" className="dm-logo-img" alt="" />
                        <span className="dm-logo-text">ProjectCheckin</span>
                      </div>
                      <div className="dm-nav">
                        <div className="dm-nav-section-lbl">Workspace</div>
                        <div className="dm-nav-item">Check-In</div>
                        <div className="dm-nav-item active">Jobs</div>
                        <div className="dm-nav-item">Team</div>
                        <div className="dm-nav-section-lbl">Analytics</div>
                        <div className="dm-nav-item">Reporting</div>
                        <div className="dm-nav-section-lbl">Settings</div>
                        <div className="dm-nav-item">Account</div>
                        <div className="dm-nav-item">Sign Out</div>
                      </div>
                      <div className="dm-sidebar-user">
                        <div className="dm-user-avatar"></div>
                        <span className="dm-user-plan">Titan Plan</span>
                      </div>
                    </div>
                    <div className="dm-main">
                      <div className="dm-main-header">
                        <span className="dm-main-title">Jobs</span>
                        <button className="dm-new-btn">+ New Check-In</button>
                      </div>
                      <div className="dm-stats-bar">
                        <div className="dm-stat"><div className="dm-stat-n">34</div><div className="dm-stat-l">Total Jobs</div></div>
                        <div className="dm-stat"><div className="dm-stat-n">3</div><div className="dm-stat-l">Today</div></div>
                        <div className="dm-stat"><div className="dm-stat-n">28</div><div className="dm-stat-l">Published</div></div>
                        <div className="dm-stat"><div className="dm-stat-n">6</div><div className="dm-stat-l">Active Installers</div></div>
                      </div>
                      <div className="dm-status-bar">
                        <span className="dm-status-dot"></span>
                        Your public portfolio is live &mdash; 28 jobs indexed on Google
                        <span className="dm-view-portfolio">View Portfolio &#8599;</span>
                      </div>
                      <div className="dm-filters">
                        <div className="dm-tabs">
                          <div className="dm-tab active">All <span className="dm-tab-count">34</span></div>
                          <div className="dm-tab">Live <span className="dm-tab-count">28</span></div>
                          <div className="dm-tab">Draft <span className="dm-tab-count">6</span></div>
                        </div>
                      </div>
                      <div className="dm-job-list">
                        {[
                          { mon: 'APR', day: 23, addr: '1847 Willowmist Crossing Dr, Franklin, TN 37064', type: 'Fiberglass Front Door · 4 photos', live: false },
                          { mon: 'APR', day: 22, addr: '3214 Copperbend Hollow Ln, Brentwood, TN 37027', type: 'Barn Door · 3 photos', live: true },
                          { mon: 'APR', day: 22, addr: '509 Fernbrook Hollow Ct, Murfreesboro, TN 37129', type: 'Barn Door · 5 photos', live: false },
                          { mon: 'APR', day: 21, addr: '721 Stonewick Meadows Dr, Spring Hill, TN 37174', type: 'Barn Door · 2 photos', live: true },
                          { mon: 'APR', day: 18, addr: '412 Maple Creek Dr, Brentwood, TN 37027', type: 'Wood Door · 4 photos', live: true },
                          { mon: 'APR', day: 10, addr: '2816 Bluegrass Summit Ave, Nashville, TN 37211', type: 'Iron Door · 2 photos', live: false },
                        ].map((row, i) => (
                          <div className="dm-list-row" key={i}>
                            <div className="dm-list-date">
                              <div className="dm-list-date-mon">{row.mon}</div>
                              <div className="dm-list-date-day">{row.day}</div>
                            </div>
                            <div className="dm-list-meta">
                              <div className="dm-list-addr">{row.addr}</div>
                              <div className="dm-list-type">{row.type}</div>
                            </div>
                            <div className="dm-list-right">
                              {row.live ? (
                                <>
                                  <div className="dm-list-live"><span className="dm-list-dot live"></span>Live</div>
                                  <button className="dm-list-unpublish">Unpublish</button>
                                </>
                              ) : (
                                <>
                                  <div className="dm-list-draft"><span className="dm-list-dot draft"></span>Draft</div>
                                  <button className="dm-list-publish">Publish</button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── ASPIRATION ── */}
      <section className="asp">
        <div className="asp-inner">
          <div className="asp-copy">
            <span className="section-label r">90 Days In</span>
            <h2 className="r d1">What your business looks like when the work is documented</h2>
            <p className="r d2">Document every job and it adds up fast. By month three, the jobs keep working for you long after you&apos;ve moved on &mdash; sending prospects proof before they even call.</p>
          </div>
          <div className="asp-metrics r d2">
            <div className="asp-m">
              <div className="asp-m-num">30<span>+</span></div>
              <div>
                <div className="asp-m-t">Published project pages</div>
                <div className="asp-m-s">Shareable proof for every job your crew completed</div>
              </div>
            </div>
            <div className="asp-m">
              <div className="asp-m-num">30<span>+</span></div>
              <div>
                <div className="asp-m-t">GBP posts ready</div>
                <div className="asp-m-s">Consistent posting signals an active, trusted business</div>
              </div>
            </div>
            <div className="asp-m">
              <div className="asp-m-num">30<span>+</span></div>
              <div>
                <div className="asp-m-t">Review requests sent</div>
                <div className="asp-m-s">One pre-written request goes out after every published job</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <div className="pricing-head">
            <h2 className="r">Founder pricing, locked in for life</h2>
            <p className="r d1">First 20 businesses get 50% off &mdash; for life. Prices go up when spots fill.</p>
          </div>
          <div className="pricing-grid">

            {/* FREE */}
            <div className="pc-card r">
              <div className="pc-tier">Free</div>
              <div className="pc-price">$0</div>
              <div className="pc-note">No credit card</div>
              <div className="pc-div"></div>
              <div className="pc-feats">
                <div className="pf"><span className="pf-ck">&#10003;</span>Try it free on your next 5 jobs</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>5 photos per job</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Owner publish controls</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Each job page built for Google search</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Public portfolio page</div>
              </div>
              {registrationOpen ? (
                <a href="/auth/register" className="btn-pc-ghost">Start Free</a>
              ) : (
                <button className="btn-pc-ghost" onClick={() => openWaitlistModal()}>Start Free</button>
              )}
            </div>

            {/* PRO */}
            <div className="pc-card r d1">
              <div className="pc-tier">Pro</div>
              <div className="pc-price">$49.50</div>
              <div className="pc-note">/ month &mdash; founding rate</div>
              <div className="pc-div"></div>
              <div className="pc-feats">
                <div className="pf-inherit">Everything in Free, plus:</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Unlimited published job pages</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Unlimited photos per job</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>One-tap GBP post from your job notes</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Traffic dashboard (views, calls, clicks)</div>
              </div>
              {registrationOpen ? (
                <a href="/auth/register" className="btn-pc-ghost">Get Started</a>
              ) : (
                <button className="btn-pc-ghost" onClick={() => openWaitlistModal()}>Get Early Access</button>
              )}
            </div>

            {/* ELITE — featured */}
            <div className="pc-card feat r d2">
              <div className="feat-tag">Recommended</div>
              <div className="pc-tier">Elite</div>
              <div className="pc-price">$74.50</div>
              <div className="pc-note">/ month &mdash; founding rate</div>
              <div className="pc-div"></div>
              <div className="pc-feats">
                <div className="pf-inherit">Everything in Pro, plus:</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Google Business Profile auto-posts <span className="soon-badge">Soon</span></div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Before/after photo tagging</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Before/after comparison on published pages</div>
              </div>
              {registrationOpen ? (
                <a href="/auth/register" className="btn-pc-main">Get Started</a>
              ) : (
                <button className="btn-pc-main" onClick={() => openWaitlistModal()}>Get Early Access</button>
              )}
            </div>

            {/* TITAN */}
            <div className="pc-card r d3">
              <div className="pc-tier">Titan</div>
              <div className="pc-price">$149.50</div>
              <div className="pc-note">/ month &mdash; founding rate</div>
              <div className="pc-div"></div>
              <div className="pc-feats">
                <div className="pf-inherit">Everything in Elite, plus:</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>AI copywriting agent <span className="new-badge">New</span></div>
                <div className="pf"><span className="pf-ck">&#10003;</span>AI review request agent <span className="soon-badge">Soon</span></div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Automated Google review requests</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Geo-grid rank tracking heatmap <span className="soon-badge">Soon</span></div>
                <div className="pf"><span className="pf-ck">&#10003;</span>CRM &amp; QuickBooks integration <span className="soon-badge">Soon</span></div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Website Integration for Local SEO</div>
                <div className="pf"><span className="pf-ck">&#10003;</span>Priority support + strategy calls</div>
              </div>
              {registrationOpen ? (
                <a href="/auth/register" className="btn-pc-ghost">Get Started</a>
              ) : (
                <button className="btn-pc-ghost" onClick={() => openWaitlistModal()}>Get Early Access</button>
              )}
            </div>

          </div>
          <p className="pricing-footnote r">
            Cancel anytime. No contracts.&nbsp;&nbsp;&middot;&nbsp;&nbsp;
            <a href="/pricing" style={{ color: 'var(--orange)', fontWeight: 700, textDecoration: 'none' }}>
              See full feature comparison &rarr;
            </a>
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq" id="faq">
        <div className="faq-inner">
          <div className="faq-head">
            <h2 className="r">Questions we hear a lot</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => toggleFaq(i)}
                aria-expanded={openFaq === i}
              >
                {faq.q}
                <FaqArr />
              </button>
              <div className="faq-a">{faq.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="final">
        <div className="final-inner">
          <h2 className="r">Your next job could start building your business. Or it could just be another job.</h2>
          <p className="r d1">Every project your crew completes is either documented and working for you, or it disappears when the truck drives away. ProjectCheckin makes sure the work you&apos;re most proud of doesn&apos;t go to waste.</p>
          {registrationOpen ? (
            <a href="/auth/register" className="btn-primary r d2" style={{ margin: '0 auto' }}>
              Start Documenting Jobs Free <ArrowRight />
            </a>
          ) : (
            <button className="btn-primary r d2" style={{ margin: '0 auto' }} onClick={() => openWaitlistModal()}>
              Start Documenting Jobs Free <ArrowRight />
            </button>
          )}
          <p className="final-sub r d3">No credit card required &middot; Cancel anytime</p>
          <a
            href="https://calendly.com/projectcheckin-/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-demo-ghost r d4"
          >
            Book a Demo →
          </a>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <a href="/" className="footer-logo">
            <div className="footer-mark">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="ProjectCheckin" />
            </div>
            ProjectCheckin
          </a>
          <div className="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="mailto:support@projectcheckin.com">Contact</a>
          </div>
        </div>
        <p className="footer-copy">&copy; 2026 ProjectCheckin. All rights reserved.</p>
      </footer>

      {/* ── WAITLIST MODAL ── */}
      {!registrationOpen && (
        <div
          className={`modal-overlay${modalOpen ? ' open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-heading"
          onClick={(e) => { if (e.target === e.currentTarget) closeWaitlistModal() }}
        >
          <div className="modal-card">
            <button className="modal-close" onClick={closeWaitlistModal} aria-label="Close">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M1 1l9 9M10 1L1 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>

            {!submitted ? (
              <>
                <span className="modal-eyebrow">Early Access &mdash; 20 Spots</span>
                <h2 className="modal-h" id="modal-heading">Claim your spot on the waitlist</h2>
                <p className="modal-sub">Free to join. No credit card. No commitment.<br />First 20 members lock in 50% off forever when we launch.</p>

                <form onSubmit={handleWaitlistSubmit} noValidate>
                  <div className="modal-field">
                    <label htmlFor="modal-name">Full name <span style={{ color: '#dc2626' }} aria-hidden="true">*</span></label>
                    <input type="text" id="modal-name" name="name" placeholder="Your full name" required autoComplete="name" value={formName} onChange={(e) => setFormName(e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="modal-email">Email address <span style={{ color: '#dc2626' }} aria-hidden="true">*</span></label>
                    <input type="email" id="modal-email" name="email" placeholder="you@yourbusiness.com" required autoComplete="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="modal-business" style={{ fontWeight: 500 }}>
                      Business name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input type="text" id="modal-business" name="businessName" placeholder="Your company name" autoComplete="organization" value={formBusiness} onChange={(e) => setFormBusiness(e.target.value)} />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="modal-trade" style={{ fontWeight: 500 }}>
                      What does your team do? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <select id="modal-trade" name="trade" value={formTrade} onChange={(e) => setFormTrade(e.target.value)}>
                      <option value="">Select your trade...</option>
                      <option value="doors-windows">Doors &amp; Windows</option>
                      <option value="roofing">Roofing</option>
                      <option value="hvac">HVAC</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="electrical">Electrical</option>
                      <option value="landscaping">Landscaping / Lawn Care</option>
                      <option value="painting">Painting</option>
                      <option value="flooring">Flooring</option>
                      <option value="general-contractor">General Contractor</option>
                      <option value="other">Other field service</option>
                    </select>
                  </div>
                  <div className="modal-field">
                    <label htmlFor="modal-plan" style={{ fontWeight: 500 }}>
                      Which plan interests you most? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                    </label>
                    <select id="modal-plan" name="planInterest" value={formPlan} onChange={(e) => setFormPlan(e.target.value)}>
                      <option value="">Not sure yet...</option>
                      <option value="free">Free &mdash; just getting started</option>
                      <option value="pro">Pro ($49.50/mo founding rate)</option>
                      <option value="elite">Elite ($74.50/mo founding rate)</option>
                      <option value="titan">Titan ($149.50/mo founding rate)</option>
                    </select>
                  </div>
                  {submitError && (
                    <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '8px' }}>{submitError}</p>
                  )}
                  <button type="submit" className="modal-submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Join the Waitlist →'}
                  </button>
                </form>
                <p className="modal-disclaimer">
                  No spam. No credit card. Just your spot in line.&nbsp;
                  <a href="/privacy" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>Privacy Policy</a>
                </p>
              </>
            ) : (
              <div className="modal-success">
                <div className="modal-success-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div className="modal-success-h">You&rsquo;re on the list.</div>
                <p className="modal-success-sub">Check your inbox &mdash; we&rsquo;ll confirm your spot.<br />You&rsquo;ll hear from us before launch.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
