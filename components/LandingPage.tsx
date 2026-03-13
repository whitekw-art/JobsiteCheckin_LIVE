'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import '@/styles/landing.css'

// ── Testimonial data ──────────────────────────────────────────────────────────
interface Testimonial {
  index: number
  initials: string
  name: string
  role: string
  quote: string
  metric: string
}

const testimonials: Testimonial[] = [
  {
    index: 0,
    initials: 'JH',
    name: 'James Holloway',
    role: 'Roofing Company \u00b7 Nashville, TN',
    quote:
      'I used to rely on word-of-mouth. Now my jobs show up when someone in my city searches for a door installer. It takes my guys 30 seconds after every job. That\u2019s it.',
    metric: '+$2,400 traced to search in 90 days',
  },
  {
    index: 1,
    initials: 'CR',
    name: 'Carlos R.',
    role: 'Entry Door Pro \u00b7 Dallas, TX',
    quote:
      'Customers call and say they found us online. We didn\u2019t do anything \u2014 it just happens automatically after each check-in.',
    metric: '23 job pages indexed across 4 search engines',
  },
]

// ── FAQ data ──────────────────────────────────────────────────────────────────
interface FaqItem {
  q: string
  a: string
}

const faqs: FaqItem[] = [
  {
    q: 'Does my crew need a smartphone?',
    a: 'No. Your crew can check in from any smartphone on the job, but it\u2019s not required. Photos can be taken with any camera and uploaded later from a computer. The check-in form runs in any browser \u2014 phone, tablet, or desktop.',
  },
  {
    q: 'Do I need a website to use this?',
    a: 'No. Every published job gets its own page on our domain \u2014 customers can find you on Google without you having a website at all. If you do have a website, our Pro tier lets you embed those pages directly on your site too.',
  },
  {
    q: 'How many jobs do we need to see results?',
    a: 'Consistency matters more than volume. Even a handful of jobs a week adds up to dozens of Google pages over 90 days. The more you check in, the faster your presence builds \u2014 but there\u2019s no minimum to get started.',
  },
  {
    q: 'How does the 90-day guarantee work?',
    a: 'Check in at least 3 times per week for 90 days. If your dashboard doesn\u2019t show real traffic \u2014 page views, phone taps, or website clicks \u2014 email us. We verify your activity data and refund your last 2 months. No forms, no arguments.',
  },
  {
    q: 'Can I control which jobs get published?',
    a: 'Yes. Every job starts private. You review it and publish when you\u2019re ready. You can edit, unpublish, or keep any job internal at any time. Your crew checks in; you decide what goes on Google.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Month-to-month. No contracts. No cancellation fees. Cancel any time from your account \u2014 takes 30 seconds.',
  },
]

// ── Check SVG ─────────────────────────────────────────────────────────────────
function CheckSVG() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="7.5" stroke="#059669" strokeWidth="1" />
      <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ── Pricing check SVG ─────────────────────────────────────────────────────────
function PCheck() {
  return (
    <span className="pcheck">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="9" cy="9" r="8.5" stroke="#059669" strokeWidth="1" />
        <path d="M5.5 9l2.5 2.5 5-5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function PDash() {
  return <span className="pdash">&mdash;</span>
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LandingPage({ registrationOpen = false }: { registrationOpen?: boolean }) {
  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalEmail, setModalEmail] = useState('')
  const searchParams = useSearchParams()

  // Auto-open modal when ?modal=waitlist is in the URL (e.g. redirected from register-closed page)
  useEffect(() => {
    if (searchParams.get('modal') === 'waitlist') {
      setModalOpen(true)
    }
  }, [searchParams])

  // Form state
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formBusiness, setFormBusiness] = useState('')
  const [formTrade, setFormTrade] = useState('')
  const [formPlan, setFormPlan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // CTA band email
  const [ctaEmail, setCtaEmail] = useState('')

  // Nav scroll
  const [navScrolled, setNavScrolled] = useState(false)

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Testimonials
  const [showTestimonials, setShowTestimonials] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)

  // ── Effects ────────────────────────────────────────────────────────────────

  // Sync prefill email to form
  useEffect(() => {
    setFormEmail(modalEmail)
  }, [modalEmail])

  // Body overflow lock when modal open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  // Escape key closes modal
  useEffect(() => {
    if (!modalOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeWaitlistModal()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen])

  // Nav scroll effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reveal animations (IntersectionObserver)
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
          } else {
            e.target.classList.remove('in')
          }
        })
      },
      { rootMargin: '0px 0px -80px 0px', threshold: 0.12 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Stat count-up
  useEffect(() => {
    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3)
    }

    const statEls = document.querySelectorAll<HTMLElement>('.stat-number[data-target]')
    const animated = new Set<Element>()

    const statObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          if (animated.has(el)) return
          animated.add(el)

          const target = parseInt(el.getAttribute('data-target') ?? '0', 10)
          const suffix = el.getAttribute('data-suffix') ?? ''
          const duration = 1200
          let startTs: number | null = null

          function tick(ts: number) {
            if (!startTs) startTs = ts
            const elapsed = ts - startTs
            const progress = Math.min(elapsed / duration, 1)
            const eased = easeOutCubic(progress)
            el.textContent = Math.round(eased * target) + suffix
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          statObserver.unobserve(el)
        })
      },
      { threshold: 0.3 }
    )

    statEls.forEach((el) => statObserver.observe(el))
    return () => statObserver.disconnect()
  }, [])

  // Testimonial localStorage + flag
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowTestimonials(localStorage.getItem('pc_show_testimonials') === 'true')
    }
  }, [])

  // Testimonial carousel auto-advance
  useEffect(() => {
    if (!showTestimonials) return
    const t = setInterval(() => setActiveSlide((p) => (p + 1) % testimonials.length), 5000)
    return () => clearInterval(t)
  }, [showTestimonials])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function openWaitlistModal(prefillEmail?: string) {
    setModalEmail(prefillEmail ?? '')
    setModalOpen(true)
  }

  function closeWaitlistModal() {
    setModalOpen(false)
  }

  function toggleFaq(index: number) {
    setOpenFaq((prev) => (prev === index ? null : index))
  }

  function toggleTestimonials() {
    const next = !showTestimonials
    setShowTestimonials(next)
    localStorage.setItem('pc_show_testimonials', String(next))
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      {/* Skip to main content */}
      <a
        href="#main-content"
        style={{
          position: 'absolute',
          top: '-40px',
          left: 0,
          background: '#0C4A6E',
          color: '#fff',
          padding: '8px 16px',
          zIndex: 999,
          borderRadius: '0 0 4px 0',
        }}
        onFocus={(e) => ((e.currentTarget as HTMLAnchorElement).style.top = '0')}
        onBlur={(e) => ((e.currentTarget as HTMLAnchorElement).style.top = '-40px')}
      >
        Skip to main content
      </a>

      {/* NAV */}
      <nav id="nav" className={navScrolled ? 'scrolled' : ''}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">ProjectCheckin</a>
          <ul className="nav-links">
            <li><a href="#how">How It Works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/auth/signin">{registrationOpen ? 'Sign In / Register' : 'Sign In'}</a></li>
            {!registrationOpen && (
              <li>
                <a
                  href="#"
                  className="btn-nav"
                  onClick={(e) => { e.preventDefault(); openWaitlistModal() }}
                >
                  Join the Waitlist
                </a>
              </li>
            )}
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="main-content" role="main">
        <div className="hero-inner">

          {/* Left column */}
          <div className="hero-left">
            <span className="hero-badge reveal">EARLY ACCESS &mdash; ONLY 20 SPOTS</span>
            <p className="hero-descriptor reveal">The job-tracking app that markets your business automatically.</p>
            <h1 className="hero-h1 reveal">Turn your job history into a lead machine.</h1>
            <p className="hero-sub reveal">
              Every job your team completes automatically shows up on Google, builds your reputation online, and brings in calls &mdash; without you writing a word or running a single ad.
            </p>
            <ul className="hero-bullets reveal">
              <li>No agency retainers.</li>
              <li>No writing. No content work.</li>
              <li>Just do the work &mdash; we turn it into leads.</li>
            </ul>

            {/* Primary CTA */}
            <div id="waitlist" className="hero-form-wrap reveal">
              {registrationOpen ? (
                <a href="/auth/register" className="btn-waitlist-hero">
                  Get Started
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              ) : (
                <button className="btn-waitlist-hero" onClick={() => openWaitlistModal()}>
                  Join the Waitlist
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
            </div>

            <div className="trust-row reveal">
              <span className="trust-item">
                <CheckSVG />
                Join now &mdash; lock in 50% off forever
              </span>
              <span className="trust-item">
                <CheckSVG />
                Limited spots available
              </span>
            </div>
          </div>

          {/* Right column — browser mockup */}
          <div className="hero-mockup-wrap reveal">
            <div className="browser-shell">
              <div className="browser-bar">
                <div className="browser-dots">
                  <div className="dot dot-r"></div>
                  <div className="dot dot-y"></div>
                  <div className="dot dot-g"></div>
                </div>
                <div className="browser-url">projectcheckin.com/jobs/huntsville-al/steel-door-replacement</div>
              </div>
              <div className="browser-content">
                <div className="job-header">
                  <div className="job-header-label">Completed Job</div>
                  <div className="job-title">Steel Entry Door Replacement &mdash; Huntsville, AL</div>
                  <div className="job-meta">
                    <span className="job-chip">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <path d="M5 1C3.3 1 2 2.3 2 4c0 2.6 3 5 3 5s3-2.4 3-5c0-1.7-1.3-3-3-3z" fill="rgba(255,255,255,0.8)" />
                      </svg>
                      Huntsville, AL
                    </span>
                    <span className="job-chip">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                        <rect x="1" y="2" width="8" height="6" rx="1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" />
                        <path d="M3 2V1M7 2V1" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" strokeLinecap="round" />
                      </svg>
                      Mar 6, 2026
                    </span>
                    <span className="job-chip">3 Photos</span>
                  </div>
                </div>
                <div className="job-body">
                  <div className="job-photos-row">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="job-photo-thumb">
                        <svg className="photo-icon" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                          <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
                          <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                        </svg>
                      </div>
                    ))}
                  </div>
                  <div className="job-structured">
                    <div className="structured-row">
                      <span className="structured-key">Service</span>
                      <span className="structured-val">Steel Door Replacement</span>
                    </div>
                    <div className="structured-row">
                      <span className="structured-key">Location</span>
                      <span className="structured-val">Huntsville, AL 35801</span>
                    </div>
                    <div className="structured-row">
                      <span className="structured-key">Crew</span>
                      <span className="structured-val">Torres Door &amp; Window</span>
                    </div>
                    <div className="structured-row">
                      <span className="structured-key">Status</span>
                      <span className="structured-val" style={{ color: '#059669', fontWeight: 600 }}>Completed &middot; Indexed</span>
                    </div>
                  </div>
                  <div className="search-snippet">
                    <div className="snippet-label">How it appears in search</div>
                    <div className="snippet-url">projectcheckin.com &rsaquo; jobs &rsaquo; huntsville-al &rsaquo; steel-door</div>
                    <div className="snippet-title">Steel Door Replacement in Huntsville, AL &mdash; Torres Door &amp; Window</div>
                    <div className="snippet-desc">Completed Mar 6, 2026. Photos included. Licensed contractor serving Huntsville area. Entry door, storm door, security door installation&hellip;</div>
                  </div>
                </div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#4A7FA0', textAlign: 'center', marginTop: '8px', fontStyle: 'italic' }}>
              Actual output from the ProjectCheckin app
            </p>
          </div>

        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <div className="proof-strip">
        <div className="proof-strip-inner">
          <span className="proof-strip-label">Built for field service teams in</span>
          <div className="proof-cities">
            <span className="proof-city">Huntsville, AL</span><span className="proof-city-sep">&middot;</span>
            <span className="proof-city">Phoenix, AZ</span><span className="proof-city-sep">&middot;</span>
            <span className="proof-city">Dallas, TX</span><span className="proof-city-sep">&middot;</span>
            <span className="proof-city">Memphis, TN</span><span className="proof-city-sep">&middot;</span>
            <span className="proof-city">Nashville, TN</span><span className="proof-city-sep">&middot;</span>
            <span className="proof-city">Denver, CO</span>
          </div>
        </div>
      </div>

      {/* STATS */}
      <section className="stats" id="stats">
        <div className="stats-grid">
          <div className="stat-col reveal">
            <span className="stat-number" data-target="81" data-suffix="%">0%</span>
            <div className="stat-label">use Google to evaluate local businesses</div>
            <div className="stat-source">BrightLocal 2024</div>
          </div>
          <div className="stat-col reveal">
            <span className="stat-number" data-target="76" data-suffix="%">0%</span>
            <div className="stat-label">of local searches result in a call within 24 hours</div>
            <div className="stat-source">Google</div>
          </div>
          <div className="stat-col reveal">
            <span className="stat-number" data-target="54" data-suffix="%">0%</span>
            <div className="stat-label">hired a contractor they&rsquo;d never heard of, online</div>
            <div className="stat-source">Angi 2025</div>
          </div>
        </div>
      </section>

      {/* RESULTS PREVIEW */}
      <section className="results" id="results-section">
        <div className="results-inner">
          <div className="results-header reveal">
            <span className="section-label">Platform Results</span>
            <h2 className="results-h2">What 90 days of check-ins looks like</h2>
            <p className="results-sub">Every completed job automatically builds your search presence. Here&rsquo;s the data your dashboard tracks from day one.</p>
          </div>

          <div className="results-body">

            {/* Left: dashboard window */}
            <div className="results-dashboard reveal">
              <div className="results-dash-header">
                <div className="results-dash-dots">
                  <div className="results-dash-dot rdd-red"></div>
                  <div className="results-dash-dot rdd-amber"></div>
                  <div className="results-dash-dot rdd-green"></div>
                </div>
                <span className="results-dash-title">Your Results Dashboard &mdash; Month 3</span>
              </div>
              <div className="results-dash-body">
                <span className="results-dash-period">30-day rolling window</span>

                <div className="rdash-metric">
                  <span className="rdash-label">Page Views</span>
                  <div className="rdash-right">
                    <div className="rdash-spark">
                      <div className="rdash-bar" style={{ height: '7px' }}></div>
                      <div className="rdash-bar" style={{ height: '10px' }}></div>
                      <div className="rdash-bar" style={{ height: '9px' }}></div>
                      <div className="rdash-bar" style={{ height: '14px' }}></div>
                      <div className="rdash-bar" style={{ height: '13px' }}></div>
                      <div className="rdash-bar" style={{ height: '18px' }}></div>
                      <div className="rdash-bar peak" style={{ height: '24px' }}></div>
                    </div>
                    <span className="rdash-val">312</span>
                  </div>
                </div>

                <div className="rdash-metric">
                  <span className="rdash-label">Phone Taps</span>
                  <div className="rdash-right">
                    <div className="rdash-spark">
                      <div className="rdash-bar" style={{ height: '5px' }}></div>
                      <div className="rdash-bar" style={{ height: '7px' }}></div>
                      <div className="rdash-bar" style={{ height: '7px' }}></div>
                      <div className="rdash-bar" style={{ height: '10px' }}></div>
                      <div className="rdash-bar" style={{ height: '12px' }}></div>
                      <div className="rdash-bar" style={{ height: '15px' }}></div>
                      <div className="rdash-bar peak" style={{ height: '20px' }}></div>
                    </div>
                    <span className="rdash-val">14</span>
                  </div>
                </div>

                <div className="rdash-metric">
                  <span className="rdash-label">Website Clicks</span>
                  <div className="rdash-right">
                    <div className="rdash-spark">
                      <div className="rdash-bar" style={{ height: '5px' }}></div>
                      <div className="rdash-bar" style={{ height: '8px' }}></div>
                      <div className="rdash-bar" style={{ height: '7px' }}></div>
                      <div className="rdash-bar" style={{ height: '11px' }}></div>
                      <div className="rdash-bar" style={{ height: '10px' }}></div>
                      <div className="rdash-bar" style={{ height: '15px' }}></div>
                      <div className="rdash-bar peak" style={{ height: '21px' }}></div>
                    </div>
                    <span className="rdash-val">27</span>
                  </div>
                </div>

                <span className="results-trend">&#8593; Trending up each month</span>

                <div className="results-indexed-row">
                  <div>
                    <div className="results-indexed-label">Job Pages on Google</div>
                    <div className="results-indexed-sub">3 check-ins/week &times; 13 weeks</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="results-indexed-val">39</div>
                    <div className="results-indexed-unit">pages indexed</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: outcome cards */}
            <div className="results-right">
              <div className="results-outcome reveal">
                <div className="results-outcome-icon roi-icon-search">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                </div>
                <div className="results-outcome-title">Every job becomes a search result</div>
                <div className="results-outcome-body">Each check-in creates a Google-indexed page for that job location, service type, and city &mdash; automatically. No writing, no tech work required.</div>
              </div>

              <div className="results-outcome reveal">
                <div className="results-outcome-icon roi-icon-phone">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                  </svg>
                </div>
                <div className="results-outcome-title">Track every call that comes from search</div>
                <div className="results-outcome-body">Phone taps and website clicks from your job pages are tracked in real time. You see exactly where leads are coming from &mdash; no guessing, no attribution headaches.</div>
              </div>

              <div className="results-outcome reveal">
                <div className="results-outcome-icon roi-icon-chart">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="results-outcome-title">More jobs = compounding reach</div>
                <div className="results-outcome-body">Each new page adds to your search footprint permanently. 39 pages at month 3 becomes 150+ by year&rsquo;s end &mdash; every one still ranking and driving leads.</div>
              </div>
            </div>

          </div>
          <p className="results-disclaimer reveal">Numbers shown are projections based on 3 check-ins/week for 90 days. Actual results vary by market, trade, and activity level.</p>
        </div>
      </section>

      {/* TESTIMONIALS — visibility controlled by showTestimonials */}
      {showTestimonials && (
        <section className="testimonials" id="testimonials-section">
          <div className="testimonials-inner">

            <div className="section-header reveal">
              <span className="section-label">What our beta users say</span>
            </div>

            {/* Featured */}
            <div className="featured-testi reveal">
              <div>
                <div className="testi-quote-mark">&ldquo;</div>
                <p className="testi-quote-text">I got 4 calls last month from people who found my work online. Never paid for ads once.</p>
                <div className="testi-author">
                  <div className="avatar">MT</div>
                  <div>
                    <div className="testi-name">Mike Torres</div>
                    <div className="testi-role">Door &amp; Window Service &middot; Phoenix, AZ</div>
                  </div>
                </div>
              </div>
              <div className="featured-metric">
                <span className="featured-metric-number">+4 leads<br />/month</span>
                <div className="featured-metric-label">from search traffic</div>
              </div>
            </div>

            {/* Two smaller cards — carousel on mobile */}
            <div className="testi-cards" id="testi-carousel">
              {testimonials.map((t) => (
                <div
                  key={t.index}
                  className={`testi-card reveal${activeSlide === t.index ? ' carousel-active' : ''}`}
                  data-carousel-index={t.index}
                >
                  <p className="testi-card-quote">&ldquo;{t.quote}&rdquo;</p>
                  <div className="testi-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '12px' }}>{t.initials}</div>
                      <div>
                        <div className="testi-name">{t.name}</div>
                        <div className="testi-role">{t.role}</div>
                      </div>
                    </div>
                    <div className="testi-card-metric">{t.metric}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Carousel dots (mobile only) */}
            <div className="carousel-dots" id="carousel-dots">
              {testimonials.map((t) => (
                <div
                  key={t.index}
                  className={`carousel-dot${activeSlide === t.index ? ' active' : ''}`}
                  data-dot={t.index}
                  onClick={() => setActiveSlide(t.index)}
                />
              ))}
            </div>

          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <h2 className="how-h2 reveal">How It Works</h2>
          <div className="how-grid">
            <div className="how-step reveal">
              <div className="how-number">01</div>
              <div className="how-title">Check In</div>
              <p className="how-body">Your crew takes photos and checks in after every job. Takes 30 seconds on any phone.</p>
            </div>
            <div className="how-step reveal">
              <div className="how-number">02</div>
              <div className="how-title">We Build the Page</div>
              <p className="how-body">We generate a job page that&apos;s optimized for Google in your service area. No writing. No tech work. You control what gets published &mdash; approve, edit, or unpublish any job page at any time. Keep internal or low-quality jobs private, only showcase your best work.</p>
            </div>
            <div className="how-step reveal">
              <div className="how-number">03</div>
              <div className="how-title">Customers Find You</div>
              <p className="how-body">Owners and managers approve, edit, or unpublish any job page. More jobs = dozens or even hundreds of pages over time. Customers searching your area find your work on Google. They call you.</p>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="phone-mockup-outer reveal" style={{ display: 'block' }}>
            <div className="phone-mockup-screen">
              <div className="phone-status-bar">
                <div className="phone-dot" style={{ background: '#38BDF8' }}></div>
                <div className="phone-dot" style={{ background: '#0EA5E9' }}></div>
                <div className="phone-dot" style={{ background: '#0C4A6E' }}></div>
              </div>
              <div className="phone-screen-title">Job Check-In</div>
              <div>
                <div className="phone-field-label">Job Type</div>
                <div className="phone-field-input">Steel door installation</div>
              </div>
              <div>
                <div className="phone-field-label">Location</div>
                <div className="phone-field-input">Huntsville, AL</div>
              </div>
              <div>
                <div className="phone-field-label">Photos</div>
                <div className="phone-photos-row">
                  <div className="phone-photo-thumb" style={{ background: '#0EA5E9' }}></div>
                  <div className="phone-photo-thumb" style={{ background: '#38BDF8' }}></div>
                  <div className="phone-photo-thumb" style={{ background: '#7DD3FC' }}></div>
                </div>
              </div>
              <div className="phone-submit-btn">Submit Check-In &#10003;</div>
              <div className="phone-submit-note">Takes 30 seconds</div>
            </div>
          </div>

          {/* Callout */}
          <div className="how-callout reveal" style={{ marginTop: '48px', color: '#0C4A6E' }}>
            The more jobs your crew does, the more pages build up on Google &mdash; automatically. Heavy users end up with dozens or even hundreds of searchable job pages across their city.
          </div>

        </div>
      </section>

      {/* GUARANTEE */}
      <section className="guarantee">
        <div className="guarantee-inner">
          <div className="reveal">
            <p className="guarantee-promise">
              &ldquo;If you don&rsquo;t see real traffic in 90 days, we refund your last 2 months.&rdquo;
            </p>
            <p className="guarantee-no-hassle">No forms. No lengthy process. Just email us.</p>

            <div className="check-row">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="#059669" strokeWidth="1" />
                <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Minimum 3 check-ins per week for 90 days
            </div>
            <div className="check-row">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="#059669" strokeWidth="1" />
                <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Real traffic (views, calls, clicks) visible in dashboard
            </div>
            <div className="check-row">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="#059669" strokeWidth="1" />
                <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Email us. We verify your activity data. Refund issued within 48 hours.
            </div>

            <div className="cancel-anytime-row">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="4" y="9" width="12" height="9" rx="2" stroke="#0EA5E9" strokeWidth="1.5" />
                <path d="M7 9V6a3 3 0 016 0v3" stroke="#0EA5E9" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="cancel-anytime-text">Cancel anytime. No contracts.</span>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="dash-card reveal">
            <div className="dash-title">Your Results This Month</div>

            <div className="dash-metric-row">
              <span className="dash-metric-label">Page Views</span>
              <div className="dash-metric-right">
                <div className="sparkline">
                  <div className="spark-bar" style={{ height: '8px' }}></div>
                  <div className="spark-bar" style={{ height: '12px' }}></div>
                  <div className="spark-bar" style={{ height: '10px' }}></div>
                  <div className="spark-bar" style={{ height: '16px' }}></div>
                  <div className="spark-bar" style={{ height: '14px' }}></div>
                  <div className="spark-bar" style={{ height: '20px' }}></div>
                  <div className="spark-bar" style={{ height: '22px' }}></div>
                </div>
                <span className="dash-metric-val">847</span>
              </div>
            </div>

            <div className="dash-metric-row">
              <span className="dash-metric-label">Phone Taps</span>
              <div className="dash-metric-right">
                <div className="sparkline">
                  <div className="spark-bar" style={{ height: '6px' }}></div>
                  <div className="spark-bar" style={{ height: '8px' }}></div>
                  <div className="spark-bar" style={{ height: '7px' }}></div>
                  <div className="spark-bar" style={{ height: '10px' }}></div>
                  <div className="spark-bar" style={{ height: '14px' }}></div>
                  <div className="spark-bar" style={{ height: '16px' }}></div>
                  <div className="spark-bar" style={{ height: '18px' }}></div>
                </div>
                <span className="dash-metric-val">23</span>
              </div>
            </div>

            <div className="dash-metric-row">
              <span className="dash-metric-label">Website Clicks</span>
              <div className="dash-metric-right">
                <div className="sparkline">
                  <div className="spark-bar" style={{ height: '5px' }}></div>
                  <div className="spark-bar" style={{ height: '9px' }}></div>
                  <div className="spark-bar" style={{ height: '8px' }}></div>
                  <div className="spark-bar" style={{ height: '12px' }}></div>
                  <div className="spark-bar" style={{ height: '11px' }}></div>
                  <div className="spark-bar" style={{ height: '15px' }}></div>
                  <div className="spark-bar" style={{ height: '20px' }}></div>
                </div>
                <span className="dash-metric-val">41</span>
              </div>
            </div>

            <div className="dash-trend">&#8593; 34% from last month</div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <span className="pricing-eyebrow reveal">FOUNDING MEMBER PRICING</span>
          <h2 className="pricing-h2 reveal">Lock in 50% off &mdash; for life.</h2>
          <p className="pricing-sub reveal">Be one of 20 founding members. Half off every month, forever. Waitlist closes when spots fill.</p>
          <div className="urgency-bar-wrap reveal">
            <div className="urgency-bar">&#9889; Only 20 founding member spots &mdash; join the waitlist to lock in your rate</div>
          </div>

          <p className="pricing-scroll-hint">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Swipe to compare all plans
          </p>
          <div className="pricing-table-outer">
            <div className="pricing-table-wrap reveal">
              <table className="pricing-table" role="table">
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '18%' }} />
                </colgroup>
                <thead>
                  <tr className="pricing-thead-row">
                    <th className="pricing-th pricing-th-feature" scope="col">Features</th>
                    {/* FREE */}
                    <th className="pricing-th pricing-th-free" scope="col">
                      <span className="th-tier-label">FREE</span>
                      <span className="th-price-strike">&nbsp;</span>
                      <span className="th-price-amount" style={{ color: 'var(--navy)' }}>$0</span>
                      <span className="th-price-sub">/forever</span>
                      <span className="th-founder-note">&nbsp;</span>
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>Join Waitlist</button>
                      }
                    </th>
                    {/* PRO */}
                    <th className="pricing-th pricing-th-pro" scope="col">
                      <div className="th-badge th-badge-popular">MOST POPULAR</div>
                      <span className="th-tier-label">PRO</span>
                      <span className="th-price-strike">$99/mo</span>
                      <span className="th-price-amount" style={{ color: '#0EA5E9' }}>$49.50<span style={{ fontSize: '16px', fontWeight: 500 }}>/mo</span></span>
                      <span className="th-price-sub">founding member rate</span>
                      <span className="th-founder-note" style={{ color: '#0EA5E9' }}>locked in for life</span>
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-primary-full" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-primary-full" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </th>
                    {/* ELITE */}
                    <th className="pricing-th pricing-th-elite" scope="col">
                      <div className="th-badge th-badge-value">BEST VALUE</div>
                      <span className="th-tier-label">ELITE</span>
                      <span className="th-price-strike">$149/mo</span>
                      <span className="th-price-amount" style={{ color: '#0C4A6E' }}>$74.50<span style={{ fontSize: '16px', fontWeight: 500 }}>/mo</span></span>
                      <span className="th-price-sub">founding member rate</span>
                      <span className="th-founder-note" style={{ color: '#0C4A6E' }}>locked in for life</span>
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost-navy" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost-navy" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </th>
                    {/* TITAN */}
                    <th className="pricing-th pricing-th-titan" scope="col">
                      <div className="th-badge th-badge-titan">FULL SUITE</div>
                      <span className="th-tier-label">TITAN</span>
                      <span className="th-price-strike">$299/mo</span>
                      <span className="th-price-amount" style={{ color: '#F59E0B' }}>$149.50<span style={{ fontSize: '16px', fontWeight: 500 }}>/mo</span></span>
                      <span className="th-price-sub">founding member rate</span>
                      <span className="th-founder-note" style={{ color: '#92400E' }}>locked in for life</span>
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost-amber" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost-amber" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* GROUP: Core Platform */}
                  <tr className="pricing-group-row">
                    <td>Core Platform</td>
                    <td className="cell-free"></td><td className="cell-pro"></td><td className="cell-elite"></td><td className="cell-titan"></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Published job pages</td>
                    <td className="cell-free"><span className="ptext" style={{ color: '#4A7FA0' }}>Up to 5</span></td>
                    <td className="cell-pro"><span className="ptext">Unlimited</span></td>
                    <td className="cell-elite"><span className="ptext" style={{ color: 'var(--navy)' }}>Unlimited</span></td>
                    <td className="cell-titan"><span className="ptext" style={{ color: '#92400E' }}>Unlimited</span></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Mobile check-in app</td>
                    <td className="cell-free"><PCheck /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Photos per job</td>
                    <td className="cell-free"><span className="ptext" style={{ color: '#4A7FA0' }}>5</span></td>
                    <td className="cell-pro"><span className="ptext">Unlimited</span></td>
                    <td className="cell-elite"><span className="ptext" style={{ color: 'var(--navy)' }}>Unlimited</span></td>
                    <td className="cell-titan"><span className="ptext" style={{ color: '#92400E' }}>Unlimited</span></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Owner publish controls</td>
                    <td className="cell-free"><PCheck /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>

                  {/* GROUP: Visibility & SEO */}
                  <tr className="pricing-group-row">
                    <td>Visibility &amp; SEO</td>
                    <td className="cell-free"></td><td className="cell-pro"></td><td className="cell-elite"></td><td className="cell-titan"></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Full SEO optimization per page</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Traffic dashboard (views, calls, clicks)</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Public portfolio page</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">90-day results guarantee</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PCheck /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>

                  {/* GROUP: Growth */}
                  <tr className="pricing-group-row">
                    <td>Growth <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '9px' }}>(Elite &amp; above)</span></td>
                    <td className="cell-free"></td><td className="cell-pro"></td><td className="cell-elite"></td><td className="cell-titan"></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Google Business Profile auto-posts</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Post-job review request texts</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Before/after photo tagging</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PCheck /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>

                  {/* GROUP: Scale */}
                  <tr className="pricing-group-row">
                    <td>Scale <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '9px' }}>(Titan only)</span></td>
                    <td className="cell-free"></td><td className="cell-pro"></td><td className="cell-elite"></td><td className="cell-titan"></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Geo-grid rank tracking heatmap</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PDash /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">CRM &amp; QuickBooks integration</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PDash /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">White-label widget</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PDash /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Multi-location support</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PDash /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>
                  <tr className="pricing-feature-row">
                    <td className="pricing-feature-name">Priority support + strategy calls</td>
                    <td className="cell-free"><PDash /></td>
                    <td className="cell-pro"><PDash /></td>
                    <td className="cell-elite"><PDash /></td>
                    <td className="cell-titan"><PCheck /></td>
                  </tr>

                  {/* CTA ROW */}
                  <tr className="pricing-cta-row">
                    <td className="pricing-feature-name"></td>
                    <td className="cell-free">
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%' }}>Join Waitlist</button>
                      }
                    </td>
                    <td className="cell-pro">
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-primary-full" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-primary-full" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </td>
                    <td className="cell-elite">
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost-navy" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost-navy" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </td>
                    <td className="cell-titan">
                      {registrationOpen
                        ? <a href="/auth/register" className="btn-ghost-amber" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', width: '100%' }}>Get Started</a>
                        : <button onClick={() => openWaitlistModal()} className="btn-ghost-amber" style={{ height: '40px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', width: '100%' }}>Join Waitlist</button>
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>{/* /pricing-table-outer */}
          <p className="pricing-footnote reveal">At founding member rates, one extra job in 90 days pays for the whole year.</p>
          <p className="pricing-footnote-2 reveal">Founding member pricing locks in the day you join. It never goes up.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section" id="faq">
        <div className="faq-inner">
          <h2 className="faq-h2 reveal">Common questions</h2>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <div key={i} className="faq-item reveal">
                <button
                  className="faq-q"
                  onClick={() => toggleFaq(i)}
                  aria-expanded={openFaq === i}
                >
                  {faq.q}
                  <svg className="faq-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M4.5 7l4.5 4.5L13.5 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`faq-a${openFaq === i ? ' open' : ''}`}>
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="cta-band" id="cta">
        <div className="cta-band-inner">
          <h2 className="cta-h2 reveal">Turn your next job into<br />your next customer.</h2>
          <p className="cta-sub reveal">Free to join. Founding members get 50% off for life.</p>
          <div className="cta-form reveal">
            <label htmlFor="cta-email" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
              Email address
            </label>
            <input
              type="email"
              id="cta-email"
              className="cta-input"
              placeholder="Your email"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
            />
            <button
              type="button"
              className="btn-cta-orange"
              onClick={() => {
                if (registrationOpen) {
                  window.location.href = `/auth/register${ctaEmail ? `?email=${encodeURIComponent(ctaEmail)}` : ''}`
                } else {
                  openWaitlistModal(ctaEmail)
                }
              }}
            >
              {registrationOpen ? 'Get Started' : 'Join the Waitlist'}
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <span className="footer-brand">ProjectCheckin</span>
          <span className="footer-tagline">Built for the trades.</span>
          <div className="footer-legal-links">
            <a href="/privacy" className="footer-legal-link">Privacy Policy</a>
            <span className="footer-legal-sep">&middot;</span>
            <a href="/terms" className="footer-legal-link">Terms of Service</a>
            <span className="footer-legal-sep">&middot;</span>
            <a href="mailto:support@projectcheckin.com" className="footer-legal-link">Contact</a>
          </div>
          <span className="footer-copy">&copy; 2026 ProjectCheckin</span>
        </div>
      </footer>

      {/* WAITLIST MODAL — only rendered when registration is closed */}
      {!registrationOpen && <div
        className={`modal-overlay${modalOpen ? ' open' : ''}`}
        id="waitlist-modal"
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
            <div id="modal-form-state">
              <span className="modal-eyebrow">Early Access &mdash; 20 Spots</span>
              <h2 className="modal-h" id="modal-heading">Claim your spot on the waitlist</h2>
              <p className="modal-sub">Free to join. No credit card. No commitment.<br />First 20 members lock in 50% off forever when we launch.</p>

              <form onSubmit={handleWaitlistSubmit} noValidate>
                <div className="modal-field">
                  <label htmlFor="modal-name">Full name <span style={{ color: '#dc2626' }} aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="modal-name"
                    name="name"
                    placeholder="Your full name"
                    required
                    autoComplete="name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="modal-email">Email address <span style={{ color: '#dc2626' }} aria-hidden="true">*</span></label>
                  <input
                    type="email"
                    id="modal-email"
                    name="email"
                    placeholder="you@yourbusiness.com"
                    required
                    autoComplete="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="modal-business" style={{ fontWeight: 500 }}>
                    Business name <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="modal-business"
                    name="businessName"
                    placeholder="Your company name"
                    autoComplete="organization"
                    value={formBusiness}
                    onChange={(e) => setFormBusiness(e.target.value)}
                  />
                </div>
                <div className="modal-field">
                  <label htmlFor="modal-trade" style={{ fontWeight: 500 }}>
                    What does your team do? <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select
                    id="modal-trade"
                    name="trade"
                    value={formTrade}
                    onChange={(e) => setFormTrade(e.target.value)}
                  >
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
                  <select
                    id="modal-plan"
                    name="planInterest"
                    value={formPlan}
                    onChange={(e) => setFormPlan(e.target.value)}
                  >
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
                  {submitting ? 'Submitting...' : 'Join the Waitlist \u2192'}
                </button>
              </form>
              <p className="modal-disclaimer">
                No spam. No credit card. Just your spot in line. &nbsp;
                <a href="/privacy" style={{ color: '#4A7FA0', textDecoration: 'underline' }}>Privacy Policy</a>
              </p>
            </div>
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
      </div>}

      {/* ADMIN TOGGLE PANEL — hidden until super-admin page is built.
          When building the super-admin page, move testimonials toggle control there.
          The toggleTestimonials() function and showTestimonials state are still wired up
          and ready — just need a UI surface to call them from. */}
    </>
  )
}
