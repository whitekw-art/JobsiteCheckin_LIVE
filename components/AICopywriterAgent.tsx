'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'

const TYPEWRITER_SEGMENTS = [
  { text: 'Full shingle replacement — Cedar Park, TX.', bold: true },
  { text: ' The original 3-tab shingles showed heavy granule loss across the south slope with two active leak points above the master suite. We removed both layers, replaced damaged decking, and installed ' },
  { text: 'CertainTeed Landmark Pro in Heather Blend', bold: true },
  { text: ' with continuous ridge vent and ice-and-water shield to all eaves. Completed in one day.' },
]

const WITHOUT = [
  { title: 'Job page quality depends on whoever submitted it', body: 'Some crews write detailed notes. Most write nothing.' },
  { title: 'Thin or blank descriptions hurt SEO', body: "Google has nothing to rank. Homeowners have nothing to read." },
  { title: 'Owner has to write or edit every page', body: 'Another task on the list that never gets done.' },
  { title: 'Inconsistent content across your portfolio', body: "Some pages look great. Most don't." },
  { title: 'Schema, alt text, and internal links left to you', body: 'Most contractors skip it entirely. Pages without structured data rank worse and get ignored by AI platforms.' },
]

const WITH = [
  { title: 'Every job gets a complete, professional description', body: "Regardless of what the crew typed — or didn't." },
  { title: 'Location-specific content Google can rank', body: 'Trade, address, and materials — the signals local search needs.' },
  { title: 'You review, not write', body: '30 seconds to read a draft and hit publish. That\'s it.' },
  { title: 'Consistent quality across your entire portfolio', body: 'Every page looks like a pro wrote it — because one did.' },
  { title: 'Schema, image alt text, and internal links — automatic', body: 'Every publish is fully optimized. No plugins, no settings, no extra steps.' },
]

const FAQS = [
  {
    q: 'What is an AI Copywriter Agent?',
    a: 'An AI agent built into your dashboard that reads photos submitted by your crew and automatically writes a complete, location-specific job description — ready to review and publish in 30 seconds. No typing required from anyone on your team.',
  },
  {
    q: "Does it work if my crew doesn't write any notes?",
    a: "Yes. The AI reads the photos directly — it identifies the trade, materials, scope of work, and before/after state from the images alone. Notes help, but they're never required.",
  },
  {
    q: 'Can I edit the description before it publishes?',
    a: "Always. The AI draft appears on your dashboard for review before anything goes live. You can change a word, rewrite the whole thing, or publish it exactly as written. You're always in control.",
  },
  {
    q: 'What does the AI actually read from photos?',
    a: 'It identifies the type of work performed, materials and products visible in the photos, the condition before and after, and the scope of the job. The more photos your crew submits, the more detail the description includes.',
  },
  {
    q: 'What SEO elements are applied automatically at publish?',
    a: 'Every publish includes LocalBusiness + Service schema markup, image alt text generated from photo analysis, and internal links to related jobs in the same city and trade. Nothing to configure — it all happens automatically.',
  },
  {
    q: 'Which plan includes this feature?',
    a: 'The AI Copywriter Agent is included in the Titan plan. It is coming soon — start capturing jobs now so your agent has a full library of job data to work from on day one.',
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const cameraIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

export default function AICopywriterAgent() {
  const opTextRef = useRef<HTMLParagraphElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const el = opTextRef.current
    if (!el) return

    const CHAR_SPEED  = 32
    const PAUSE_MS    = 520
    const PAUSE_EVERY = 10
    const LOOP_DELAY  = 2800

    let segIdx = 0, charIdx = 0, wordCount = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    function buildHtml() {
      let html = ''
      for (let i = 0; i < segIdx; i++) {
        const s = TYPEWRITER_SEGMENTS[i]
        html += s.bold ? `<strong>${s.text}</strong>` : s.text
      }
      if (segIdx < TYPEWRITER_SEGMENTS.length) {
        const cur = TYPEWRITER_SEGMENTS[segIdx]
        const part = cur.text.slice(0, charIdx)
        html += cur.bold ? `<strong>${part}</strong>` : part
      }
      html += '<span class="op-cursor"></span>'
      return html
    }

    function type() {
      if (segIdx >= TYPEWRITER_SEGMENTS.length) {
        timer = setTimeout(reset, LOOP_DELAY)
        return
      }
      const seg = TYPEWRITER_SEGMENTS[segIdx]
      if (charIdx >= seg.text.length) {
        segIdx++; charIdx = 0
        type(); return
      }
      const ch = seg.text[charIdx]
      charIdx++
      if (ch === ' ') wordCount++
      el.innerHTML = buildHtml()
      let delay = CHAR_SPEED
      if (ch === ' ' && wordCount > 0 && wordCount % PAUSE_EVERY === 0) delay = PAUSE_MS
      timer = setTimeout(type, delay)
    }

    function reset() {
      segIdx = 0; charIdx = 0; wordCount = 0
      el.innerHTML = '<span class="op-cursor"></span>'
      timer = setTimeout(type, 400)
    }

    timer = setTimeout(type, 1200)
    return () => { if (timer) clearTimeout(timer) }
  }, [])

  return (
    <>
      <MarketingNav />

      {/* Breadcrumb */}
      <div className="breadcrumb-dark">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="current">AI Copywriter Agent</span>
      </div>

      {/* Hero */}
      <section className="hero-dark">
        <div className="hero-dark-inner">
          <div>
            <h1>
              Photos go in.<br />
              <em>Published job pages</em><br />
              come out.
            </h1>
            <p className="hero-dark-sub">
              Your crew submits photos. Your AI copywriting agent reads every image and writes a complete, keyword-rich job description — ready to review and publish. No typing required from anyone on your team.
            </p>
            <div className="hero-define-dark">
              <strong>What is an AI Copywriter Agent?</strong> An AI agent trained to analyze your job photos and craft descriptions engineered for local search — high-intent, long-tail, location-specific keywords that help homeowners find your business on Google and through AI. Ready to review and publish in 30 seconds. No notes required.
            </div>
          </div>

          {/* Output preview */}
          <div className="output-preview">
            <div className="op-label">AI Copywriter Agent · Live preview</div>
            <div className="op-photos">
              <div className="op-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/lp-bac-before-door.png" alt="Before" />
                <span className="op-photo-tag before">Before</span>
              </div>
              <div className="op-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/lp-bac-before-door.png" alt="" style={{ opacity: 0.3 }} />
                <div className="op-ghost-icon">{cameraIcon}</div>
              </div>
              <div className="op-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/lp-bac-after-door.png" alt="After" />
                <span className="op-photo-tag after">After</span>
              </div>
            </div>
            <div className="op-processing">
              <span className="op-processing-dot" />
              <span className="op-processing-dot" />
              <span className="op-processing-dot" />
              Reading photos and writing description
            </div>
            <div className="op-output">
              <div className="op-output-bar">
                <div className="op-output-title">147 Clearwater Dr — Roofing</div>
                <div className="op-publish-btn">Publish</div>
              </div>
              <p className="op-text" ref={opTextRef}>
                <span className="op-cursor" />
              </p>
              <div className="op-tags">
                <span className="op-tag">Cedar Park, TX</span>
                <span className="op-tag">Roofing</span>
                <span className="op-tag">Shingle Replacement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — 4 steps */}
      <div className="hiw-section">
        <div className="section-label">How it works</div>
        <h2 className="section-title">Four steps. Zero extra effort.</h2>
        <p className="hiw-sub">Your AI copywriting agent works alongside your crew without them changing a thing. They submit photos. Your agent handles everything that comes next.</p>
        <div className="step-cards">
          {[
            { n: '1', title: 'Crew checks in with photos', desc: 'Address, trade, and a few job photos. Notes are optional — the AI doesn\'t need them to write a good description.' },
            { n: '2', title: 'Your AI agent reads every photo', desc: 'Identifies what was done — materials, scope, before and after state — directly from the images. No notes needed from your crew.' },
            { n: '3', title: 'Draft appears on your dashboard', desc: 'You review the generated description. Edit anything you want, or publish as-is. It takes 30 seconds.' },
            { n: '4', title: 'Job page goes live', desc: 'A location-specific, indexed page — tied to the job address — goes live and starts building your local search presence.' },
          ].map(({ n, title, desc }) => (
            <div key={n} className="step-card">
              <div className="sc-num">{n}</div>
              <div className="sc-title">{title}</div>
              <p className="sc-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* What It Writes */}
      <section className="detail-section">
        <div className="detail-inner">
          <div className="detail-copy">
            <div className="section-label">What it writes</div>
            <h2 className="section-title">Not a template. A real description of your real job.</h2>
            <p className="detail-sub">
              Your AI copywriting agent writes from what&apos;s actually in the photos — the trade, the materials, the condition before and after. Think of it as a professional writing employee who was on the job site with your crew, taking notes you&apos;ll never have to write yourself.
            </p>
            <ul className="value-list">
              {[
                { title: 'Location-specific from the first sentence', body: "City, street address, and neighborhood baked in — the way Google's local search algorithm expects it." },
                { title: 'Materials and scope from the photos', body: 'Reads what was actually used and what was done — not generic filler copy about the trade.' },
                { title: 'Professional tone, contractor voice', body: 'Written to sound like an experienced contractor wrote it — not like marketing copy or AI boilerplate.' },
                { title: 'Editable before it publishes', body: "You always review before anything goes live. Change a word or the whole thing — it's your page." },
                { title: 'Schema, alt text, and internal links at every publish', body: 'Structured data, image captions from photo analysis, and links to related jobs in the same city and trade — added automatically. Nothing to configure.' },
              ].map(({ title, body }) => (
                <li key={title}>
                  <div className="vl-bar" />
                  <div className="vl-text">
                    <strong>{title}</strong>
                    {body}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Example card */}
          <div className="example-card">
            <div className="ec-header">
              <div className="ec-title">
                Exterior repaint — Lakeway, TX
                <span>Submitted by: James T. · 3 photos</span>
              </div>
              <div className="ec-ai-label">AI Draft</div>
            </div>
            <p className="ec-body">
              <strong>Full exterior repaint on a two-story Colonial in Lakeway.</strong> The existing paint had significant chalking and peeling on the south and west faces from years of sun exposure. We pressure-washed the surface, spot-primed all bare wood, caulked all trim transitions, and applied two coats of <strong>Sherwin-Williams Emerald in Alabaster</strong>. Shutters and front door painted separately in Iron Ore for contrast. Completed in two days with full site cleanup.
            </p>
            <div className="ec-tags">
              <span className="ec-tag">Lakeway, TX</span>
              <span className="ec-tag">Exterior Painting</span>
              <span className="ec-tag">Sherwin-Williams</span>
              <span className="ec-tag">Two-Story</span>
            </div>
            <div className="ec-actions">
              <div className="ec-btn primary">Publish Job Page</div>
              <div className="ec-btn secondary">Edit Draft</div>
            </div>
            <div className="publish-auto">
              <div className="publish-auto-label">Also applied automatically at publish</div>
              <div className="publish-auto-list">
                <div className="publish-auto-item">
                  <div className="publish-auto-check">✓</div>
                  LocalBusiness + Service schema injected
                </div>
                <div className="publish-auto-item">
                  <div className="publish-auto-check">✓</div>
                  Alt text generated for all 3 photos
                </div>
                <div className="publish-auto-item">
                  <div className="publish-auto-check">✓</div>
                  Linked to 5 related painting jobs in Lakeway, TX
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Without vs. With */}
      <div className="compare-section">
        <div className="section-label">Without vs. with AI Copywriter</div>
        <h2 className="section-title">Every job gets a professional page.<br />Your AI agent doesn&apos;t miss one.</h2>
        <div className="compare-grid">
          <div className="compare-col without">
            <div className="compare-col-label">Without AI Copywriter</div>
            {WITHOUT.map(({ title, body }) => (
              <div key={title} className="compare-row">
                <div className="cr-mark x">✕</div>
                <div className="cr-text">
                  <strong>{title}</strong>
                  {body}
                </div>
              </div>
            ))}
          </div>
          <div className="compare-col with">
            <div className="compare-col-label">With AI Copywriter</div>
            {WITH.map(({ title, body }) => (
              <div key={title} className="compare-row">
                <div className="cr-mark chk">✓</div>
                <div className="cr-text">
                  <strong>{title}</strong>
                  {body}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="stat-strip">
        <div>
          <div className="stat-number"><em>88</em>%</div>
          <div className="stat-desc">of people who search locally for a service business engage within 24 hours.</div>
          <div className="stat-source">Think with Google</div>
        </div>
        <div className="stat-divider" />
        <div>
          <div className="stat-number"><em>81</em>%</div>
          <div className="stat-desc">of consumers read reviews before contacting a local business for the first time.</div>
          <div className="stat-source">BrightLocal, 2024</div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">How does the AI Copywriter Agent work?</h2>
        <div className="faq-list">
          {FAQS.map((f, i) => (
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

      {/* Explore More */}
      <div className="explore-strip">
        <div className="explore-inner">
          <div className="explore-label">Explore more features</div>
          <div className="explore-links">
            <Link href="/features/local-job-pages" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
              Local Job Pages
            </Link>
            <Link href="/features/ai-review-request" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              AI Review Request Agent
            </Link>
            <Link href="/features/before-after" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              Before &amp; After
            </Link>
            <Link href="/pricing" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01z"/></svg>
              View Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Band */}
      <section className="cta-band">
        <div className="cta-inner">
          <h2>Your AI agent<br />is ready to work.</h2>
          <p>Every photo your crew submits today becomes context your AI copywriting agent uses from day one. Start now and your agent writes every page you&apos;ve been putting off.</p>
          <div className="cta-fine">
            <Link href="/pricing">See all plans →</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="feat-footer">
        <Link href="/" className="footer-brand">ProjectCheckin</Link>
        <div className="footer-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </>
  )
}
