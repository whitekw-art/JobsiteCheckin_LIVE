'use client'

import { useState, useRef, useEffect } from 'react'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'

const benefits = [
  {
    num: '01',
    title: 'The transformation does the selling',
    teaser: "A prospect who drags the slider doesn't need to read your pitch. They've already seen the result with their own hands.",
    body: "Static photos require explanation. A before/after slider doesn't. When a homeowner drags the handle and sees the full change in one motion, they've already seen your work — no pitch needed. Text a prospect the link mid-conversation and the slider closes for you.",
  },
  {
    num: '02',
    title: 'Proof that disputes evaporate',
    teaser: 'A timestamped, GPS-tagged before photo shows exactly what the job site looked like when your crew arrived. No ambiguity.',
    body: "Pre-existing damage. Condition on arrival. Work completed. Every before/after pair is stored in your dashboard with the exact time and GPS location of each photo. If a customer claims something wasn't done or a surface was damaged, you have a dated, GPS-tagged record from the job site — not a verbal account.",
  },
  {
    num: '03',
    title: 'More engagement on your job pages',
    teaser: 'Interactive content keeps visitors on the page longer. The slider gives them a reason to stay, click, and contact you.',
    body: 'A static photo album gets a quick scroll. A draggable comparison slider makes someone stop and interact. Prospects who touch your job page spend more time on it — and time on page is one of the clearest signals that someone is seriously considering hiring you.',
  },
  {
    num: '04',
    title: 'Your crew already takes these photos',
    teaser: "You don't need a new habit. Before/after photos already happen on most jobs — the app just makes them work together.",
    body: "Most crews already photograph a job site before starting and after finishing — for records, for their own proof, out of habit. The Before/After feature captures those existing photos, links them as a matched pair, and puts them to work on the job page. Nothing new for your crew to learn. Nothing more to remember.",
  },
  {
    num: '05',
    title: 'Shareable in seconds during a sales call',
    teaser: "Text a prospect the link to a job two streets over. They see the slider. They see what your crew did. You don't have to say another word.",
    body: "Every published job page has a permanent URL. When you're on a call with a prospect and they want to see your work, you pull up the job page from your dashboard and text it in 15 seconds. They open it and find a full transformation — before/after slider, photos, address, your contact info — at the exact moment they're deciding whether to hire you.",
  },
  {
    num: '06',
    title: 'No editing. No extra steps. No design work.',
    teaser: "The slider is built and published automatically. You don't touch a photo editor or upload two versions of anything.",
    body: "Creating before/after comparisons traditionally requires photo editing, separate upload flows, or third-party tools. With ProjectCheckin, tagging a photo Before or After is one tap. Publishing creates the slider automatically. There's no editing step, no file management, no design work. The whole process for one job takes under two minutes from job site to live slider.",
  },
]

const faqs = [
  {
    q: 'Does my crew need to take photos in any specific order?',
    a: 'No specific order required. In the check-in form, there are Before and After tag buttons for each photo. Your crew can tag them at any point — while photographing, after the job, or when publishing. The ghost overlay camera appears automatically when they tap After and select which Before photo to pair with it.',
  },
  {
    q: 'What if the crew forgets to take the before photo?',
    a: 'The job publishes normally with all other photos. The slider only appears on the job page when both a Before and After photo are present. If only one is tagged, the photo still saves to the job record and your gallery — it just won\'t create a slider. No data is lost and the rest of the job page is unaffected.',
  },
  {
    q: "Can I use this for jobs that aren't visible transformations?",
    a: 'Yes. HVAC techs photograph the old unit and the new installation. Electricians photograph the old panel and the upgraded one. Plumbers photograph the problem and the fix. Any job that starts in one state and ends in another — which is nearly every service call — produces a meaningful before/after.',
  },
  {
    q: 'Where does the slider appear?',
    a: 'The drag-to-reveal slider appears automatically on the public job page when both a Before and After photo are tagged and the job is published. The same job page also shows your other job photos, business info, and a contact/estimate button. The slider is the featured element at the top of the page.',
  },
  {
    q: 'Can I do multiple before/after pairs on one job?',
    a: 'Yes. You can tag multiple photos as Before and multiple as After on the same job. The job page will display the primary pair as the featured slider, with the remaining tagged photos in the photo gallery below. Large jobs — like a whole-house repaint or a multi-room remodel — can show several distinct before/after moments.',
  },
  {
    q: 'Is the before photo visible to the public?',
    a: "Yes — and that's the point. The before photo is what makes the after meaningful. Prospects need to see where you started to appreciate what you delivered. The slider keeps both in view simultaneously, letting anyone drag back and forth to see the full extent of the work. The before photo isn't a liability — it's the evidence that makes the after photo a proof of skill.",
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function BeforeAfter() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(0)
  const [openFaq, setOpenFaq]         = useState<number | null>(0)

  const demoRef      = useRef<HTMLDivElement>(null)
  const dividerRef   = useRef<HTMLDivElement>(null)
  const afterPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const demo       = demoRef.current
    const divider    = dividerRef.current
    const afterPanel = afterPanelRef.current
    if (!demo || !divider || !afterPanel) return

    let isDragging = false

    const setPosition = (clientX: number) => {
      const rect = demo.getBoundingClientRect()
      const pct  = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
      divider.style.left        = pct + '%'
      afterPanel.style.clipPath = `inset(0 0 0 ${pct}%)`
    }

    const onMouseDown = (e: MouseEvent) => { isDragging = true; setPosition(e.clientX) }
    const onMouseUp   = ()               => { isDragging = false }
    const onMouseMove = (e: MouseEvent) => { if (isDragging) setPosition(e.clientX) }
    const onTouchStart = (e: TouchEvent) => { isDragging = true; e.preventDefault() }
    const onTouchEnd   = ()               => { isDragging = false }
    const onTouchMove  = (e: TouchEvent) => { if (isDragging) setPosition(e.touches[0].clientX) }

    demo.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    divider.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    // Initial position — show mostly before
    const rect = demo.getBoundingClientRect()
    setPosition(rect.left + rect.width * 0.85)

    // Animate on load: sweep left to reveal after, then settle back at 85%
    const animTimer = setTimeout(() => {
      const start = Date.now()
      const dur   = 1400
      const animate = () => {
        const elapsed = Date.now() - start
        if (elapsed < dur) {
          const pct = 85 - Math.sin((elapsed / dur) * Math.PI) * 65
          divider.style.left        = pct + '%'
          afterPanel.style.clipPath = `inset(0 0 0 ${pct}%)`
          requestAnimationFrame(animate)
        } else {
          divider.style.left        = '85%'
          afterPanel.style.clipPath = 'inset(0 0 0 85%)'
        }
      }
      requestAnimationFrame(animate)
    }, 600)

    return () => {
      demo.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      divider.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchmove', onTouchMove)
      clearTimeout(animTimer)
    }
  }, [])

  return (
    <>
      <MarketingNav />

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="current">Before &amp; After</span>
      </div>

      {/* HERO */}
      <section>
        <div className="hero-wrap">
          <div className="hero-copy">
            <h1>Show what changed. Close more jobs.</h1>
            <p>
              Your crew takes a photo when they arrive and a photo when they leave. Every
              published job page gets a drag-to-reveal slider. Prospects see the full
              transformation. You don&apos;t have to explain a thing.
            </p>
            <div className="hero-cta">
              <a href="/auth/register" className="btn-primary">Start Free</a>
              <span className="hero-fine">No credit card required</span>
            </div>
            <div className="hero-define">
              <strong>What is Before &amp; After?</strong>
              Tag a photo BEFORE when you arrive and AFTER when the job is done. The app
              matches the pair and adds a drag-to-reveal slider to the public job page
              automatically. No editing. No uploading twice. No marketing work.
            </div>
          </div>

          {/* INTERACTIVE SLIDER DEMO */}
          <div className="ba-demo-wrap">
            <div className="ba-demo" ref={demoRef}>
              <div className="ba-before">
                <span className="ba-tag ba-tag-b">BEFORE</span>
              </div>
              <div className="ba-after" ref={afterPanelRef}>
                <span className="ba-tag ba-tag-a">AFTER</span>
              </div>
              <div className="ba-divider" ref={dividerRef}>
                <div className="ba-handle">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 3,12 9,6" />
                    <polyline points="15,6 21,12 15,18" />
                  </svg>
                </div>
              </div>
            </div>
            <div className="ba-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="12" x2="16" y2="12" />
                <polyline points="5,9 2,12 5,15" />
                <polyline points="19,9 22,12 19,15" />
              </svg>
              Drag the handle to see the difference
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <div className="section-title">Three taps. One transformation. Published automatically.</div>
          <div className="steps steps-cards">
            <div className="step">
              <div className="step-num active">1</div>
              <h3>Tag the Before</h3>
              <p>
                When your crew arrives, they open the app, tap <strong>Before</strong>, and
                take a photo. Ten seconds. It&apos;s attached to the job and saved — GPS-tagged
                and timestamped.
              </p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Ghost Camera Guides the After</h3>
              <p>
                When the job is done, tap <strong>After</strong>. The before photo appears
                at 40% opacity — a ghost on screen so the crew lines up the exact same
                angle and shoots.
              </p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Slider Goes Live on the Job Page</h3>
              <p>
                Publish the job and the drag-to-reveal slider appears automatically on the
                public page. Prospects drag left and right to see the full transformation.
                No editing. No design work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GHOST CAMERA CALLOUT */}
      <section className="ghost-section">
        <div className="ghost-inner">
          <div className="ghost-copy">
            <div className="ghost-badge">ProjectCheckin exclusive</div>
            <h2>The ghost overlay camera.<br />Perfectly matched shots, every time.</h2>
            <p>
              Most before/after photos don&apos;t match. The angle shifts. The framing is off.
              The comparison looks sloppy and the transformation gets lost.
            </p>
            <p>
              When your crew taps After, the before photo appears on their screen at 40%
              opacity — like a ghost. They can see exactly how the original was framed and
              line up the same angle before they shoot. The result is a matched pair that
              holds up.
            </p>
            <p>No briefing your crew. No retakes. They see the original frame and match it.</p>
          </div>

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
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits-section">
        <div className="benefits-inner">
          <div className="section-label">What you get</div>
          <div className="section-title" style={{ marginBottom: '16px' }}>
            Why before/after photos work harder than regular job photos.
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '36px', fontStyle: 'italic' }}>
            Every job without a before/after is a transformation you can&apos;t show.
          </p>

          {benefits.map((b, i) => (
            <div key={i} className={`benefit-item${openBenefit === i ? ' open' : ''}`}>
              <button
                className="benefit-btn"
                onClick={() => setOpenBenefit(openBenefit === i ? null : i)}
                aria-expanded={openBenefit === i}
              >
                <span className="benefit-num">{b.num}</span>
                <span className="benefit-text">
                  <span className="benefit-title">{b.title}</span>
                  <span className="benefit-teaser">{b.teaser}</span>
                </span>
                <span className="benefit-icon">{plusIcon}</span>
              </button>
              <div className="benefit-body">{b.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* MID CTA */}
      <div className="mid-cta">
        <p>Start building before/after pages from your next job.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <span className="hero-fine">No credit card required · Cancel anytime</span>
      </div>

      {/* STAT STRIP — 3 columns */}
      <div className="stat-strip-3">
        <div className="stat-strip-3-inner">
          <div>
            <div className="stat-number"><em>88</em>%</div>
            <div className="stat-desc">of people who search locally for a service engage with a business within 24 hours.</div>
            <div className="stat-source">Think with Google</div>
          </div>
          <div>
            <div className="stat-number"><em>&lt; 2</em> min</div>
            <div className="stat-desc">from job site photo to live before/after slider on your public page.</div>
            <div className="stat-source">ProjectCheckin</div>
          </div>
          <div>
            <div className="stat-number"><em>57</em>%</div>
            <div className="stat-desc">of consumers won&apos;t hire a business with under 4 stars on Google.</div>
            <div className="stat-source">BrightLocal, 2023</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">Before &amp; After, answered.</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item${openFaq === i ? ' open' : ''}`}>
              <button
                className="faq-q"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                {f.q}
                <span className="faq-icon">{plusIcon}</span>
              </button>
              <div className="faq-a">{f.a}</div>
            </div>
          ))}
        </div>
      </section>

      {/* EXPLORE MORE */}
      <div className="explore-strip">
        <div className="explore-inner">
          <div className="explore-label">Explore more features</div>
          <div className="explore-links">
            <a href="/features/local-job-pages" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              Local Job Pages
            </a>
            <a href="/features/review-requests" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Review Requests
            </a>
            <a href="/features/gbp-post-generator" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              GBP Post Generator
            </a>
            <a href="/pricing" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z" />
              </svg>
              View Pricing
            </a>
          </div>
        </div>
      </div>

      {/* CTA BAND */}
      <section className="cta-band">
        <h2>Every job you finish is a transformation<br />you haven&apos;t shown yet.</h2>
        <p>Start free. No credit card required.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <div className="cta-fine">Free plan available. Paid plans from $49.50/mo.</div>
      </section>

      {/* FOOTER */}
      <footer className="feat-footer">
        <a href="/" className="footer-brand">ProjectCheckin</a>
        <div className="footer-links">
          <a href="/pricing">Pricing</a>
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </footer>
    </>
  )
}
