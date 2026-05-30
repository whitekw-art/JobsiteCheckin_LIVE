'use client'

import { useState } from 'react'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'

const benefits = [
  {
    num: '01',
    title: 'Branded Search Presence',
    teaser: 'When a prospect Googles your company name after getting a quote, a professional page with real job photos appears in results.',
    body: 'Before calling, most prospects do a quick search. A Local Job Page gives them something professional to land on — real photos, your business name, your location, and a direct way to contact you. This works on day one, before you\'ve published dozens of jobs. A service business with no website still looks credible because Google returns a well-structured page from a real job.',
  },
  {
    num: '02',
    title: 'Shareable Proof of Work',
    teaser: 'Send a prospect a real URL — not a screenshot — showing your recent work two streets over.',
    body: 'When you\'re quoting a job, showing real work from the customer\'s own neighborhood is your strongest close. Every Local Job Page has a permanent URL you can text or email to a prospect mid-conversation. "Here\'s what we installed two miles from you last month" is a closer. No agency writes this content — your crew generates it every time they finish a job.',
  },
  {
    num: '03',
    title: 'Structured Data — Schema Markup',
    teaser: 'Every page is automatically tagged so Google understands your business, service type, exact location, and photos — without guessing.',
    body: 'Each Local Job Page includes JSON-LD schema markup — LocalBusiness, Service, ImageObject, and GeoCoordinates — embedded automatically on every publish. This tells Google exactly who you are, what you did, where you did it, and what the result looked like. Most service business websites have no schema markup at all. Structured data is one of the few ranking factors Google explicitly confirms in its own documentation.',
  },
  {
    num: '04',
    title: 'Location-Specific URLs and Metadata',
    teaser: 'The URL, page title, and meta description all include city, state, and service type — built for local searches from the ground up.',
    body: 'A page at /jobs/nashville-tn/iron-door-a1b2c3 with a title of "Iron Door in Nashville, TN" targets a real, specific location from its very structure. The city and state appear in the URL slug, the title tag, the meta description, and the on-page content — exactly the signals Google uses to determine relevance for a local search. Every page is purpose-built for the location it represents, not a generic service page with a city name swapped in.',
  },
  {
    num: '05',
    title: 'Automatic Sitemap Inclusion',
    teaser: 'Every published job page is automatically added to the sitemap, signaling Google to crawl it immediately.',
    body: 'ProjectCheckin\'s sitemap updates in real time as jobs are published. When Google\'s crawler next visits the sitemap, your new job page is already on the list with a crawl-priority signal. There\'s nothing to submit, configure, or manage. Publishing a job triggers the entire chain — page created, sitemap updated, Google notified.',
  },
  {
    num: '06',
    title: 'Permanent, Compounding Content Library',
    teaser: 'Each page you publish is a permanent indexed asset. 200 jobs over 18 months = 200 location-specific pages with your name on them.',
    body: 'Each Local Job Page doesn\'t disappear when the job is done — it stays indexed and continues to accumulate value. A competitor with a 5-page website can\'t replicate this without hiring an agency to produce content or building the same tool themselves. The library you build over 12–18 months becomes hard to replicate. A service business that starts publishing today builds a lead that competitors can\'t quickly close.',
  },
  {
    num: '07',
    title: 'Long-Tail Organic Traffic',
    teaser: 'Across hundreds of pages, specific searches for your service and city accumulate real clicks no single webpage could capture.',
    body: 'No single job page captures thousands of searches. But across 200–300 published pages, you\'re simultaneously targeting hundreds of specific location, service, and business-name combinations. This is programmatic SEO — the same model Angi, Thumbtack, and Zillow used to build search authority over time. Individual pages may see modest traffic; the portfolio as a whole builds steadily with every job published.',
  },
  {
    num: '08',
    title: 'Backlinks to Your Own Website',
    teaser: 'Every job page links to your website, passing authority from projectcheckin.com to your own domain as the platform grows.',
    body: 'Each Local Job Page includes a link to your business website. As projectcheckin.com grows in domain authority — through more published pages, more inbound links, and more traffic — the value of those outbound links increases. Publishing 10 jobs means 10 pages with a link to your site from an increasingly credible source. The platform\'s authority and your website\'s authority grow together.',
  },
]

const faqs = [
  {
    q: 'What is a Local Job Page?',
    a: 'A Local Job Page is a public webpage created automatically when you publish a completed job on ProjectCheckin. It includes your photos, service type, exact address, and business contact info — structured with schema markup so Google can index and understand each job.',
  },
  {
    q: 'How does my team actually use it on the job?',
    a: 'When your team arrives, they open the app, select the job type, enter the address, and take photos. The whole process takes under two minutes. GPS and timestamp are captured automatically — there\'s nothing to fill in after the job is done.',
  },
  {
    q: 'What happens to the photos after a job is published?',
    a: 'Every photo is saved to the job record in your dashboard, organized by job. You can tag them as before or after photos, add notes, and publish the completed job as a page that customers and prospects can find.',
  },
  {
    q: 'Can I use this as proof if a customer disputes the work?',
    a: 'Yes. Every check-in creates a timestamped, GPS-tagged record of the work — photos, notes, job address, and date are all saved and accessible from your dashboard at any time.',
  },
  {
    q: 'Do Local Job Pages help my business show up on Google?',
    a: 'Yes. Each Local Job Page is indexed by Google with location-specific metadata — city, state, and service type in the URL, title, and schema markup. Individual pages rank for specific long-tail searches. Across hundreds of published jobs, your business builds a local search presence that compounds over time.',
  },
  {
    q: 'How many photos can I take per job?',
    a: 'As many as the job requires. Monthly photo limits apply by plan: Free includes 50 photos/month, Pro includes 500, Elite 2,000, and Titan is unlimited. Photos are automatically resized so storage is never an issue.',
  },
  {
    q: 'Do I need my own website for this to work?',
    a: 'No. ProjectCheckin creates a public job page and a portfolio page for your business automatically — no website or technical setup required. Every completed job gets a shareable link, and your portfolio builds itself as jobs are published.',
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function LocalJobPages() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(null)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)

  return (
    <>
      <MarketingNav />

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="current">Local Job Pages</span>
      </div>

      {/* HERO */}
      <section>
        <div className="hero-wrap">
          <div className="hero-copy">
            <h1>Every completed job becomes a page on Google.</h1>
            <p>
              Your crew enters the address and takes photos. ProjectCheckin builds a
              location-specific, indexed job page automatically — your photos, service type,
              and business info ready for local searchers.
            </p>
            <div className="hero-cta">
              <a href="/auth/register" className="btn-primary">Start Free</a>
              <span className="hero-fine">No credit card required</span>
            </div>
            <div className="hero-define">
              <strong>What is a Local Job Page?</strong> A public webpage created automatically
              when you publish a completed job. Includes your photos, service type, address, and
              contact info — formatted with schema markup so Google can index and understand it.
            </div>
          </div>

          {/* BROWSER FRAME */}
          <div>
            <div className="browser-frame">
              <div className="browser-chrome">
                <div className="browser-dots">
                  <div className="browser-dot red" />
                  <div className="browser-dot amber" />
                  <div className="browser-dot green" />
                </div>
                <div className="browser-url">projectcheckin.com/jobs/wood-door-huntsville-al</div>
              </div>

              <div className="jp-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/job-page-door-hero.png" alt="Completed door installation" />
                <div className="jp-back">← Back to Portfolio</div>
              </div>

              <div className="jp-body">
                <div>
                  <div className="jp-chip">Wood Door</div>
                  <div className="jp-title">Wood Door in Huntsville, AL</div>
                  <div className="jp-meta">📍 Huntsville, AL 35801 &nbsp;·&nbsp; April 2026</div>
                  <div className="jp-desc">
                    Installed a custom double-entry door for the Jones family. Rich hand-stained
                    hardwood pair with insulated decorative glass featuring intricate wrought iron
                    scrollwork — selected for both curb appeal and energy efficiency.
                  </div>
                </div>
                <div className="jp-card">
                  <div className="jp-card-name">YOUR COMPANY NAME</div>
                  <div className="jp-card-btn">Free Estimate</div>
                  <div className="jp-card-sub">Visit Website</div>
                </div>
              </div>

              <div className="jp-divider" />
              <div className="jp-more-label">More Projects by YOUR COMPANY NAME</div>
              <div className="jp-grid">
                <div className="jp-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/jp-thumb-wood-door.png" alt="Wood door installation" />
                </div>
                <div className="jp-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/jp-thumb-fiberglass-door.png" alt="Fiberglass front door replacement" />
                </div>
                <div className="jp-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/jp-thumb-iron-door-1.png" alt="Iron door installation" />
                </div>
                <div className="jp-thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/jp-thumb-iron-door-2.png" alt="Iron door installation" />
                </div>
              </div>

              <div className="jp-footer">
                <div className="jp-footer-title">Need a job done? Get a free estimate.</div>
                <div className="jp-footer-btns">
                  <span className="jp-footer-btn orange">Free Estimate</span>
                  <span className="jp-footer-btn ghost">Visit Website</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <div className="section-title">One step from your crew. Everything else is automatic.</div>
          <div className="steps">
            <div className="step">
              <div className="step-num active">1</div>
              <h3>Take Photos</h3>
              <p>
                Your crew opens the app at the job site, enters the address, and takes photos. Under
                two minutes. That&apos;s all they do — nothing to fill out after the job is done.
              </p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>We Build the Page</h3>
              <p>
                ProjectCheckin formats the job page automatically: location-specific URL, title, and
                meta description; schema markup (LocalBusiness, GeoCoordinates, ImageObject);
                sitemap inclusion; and your business contact info with a call-to-action.
              </p>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Live on Google</h3>
              <p>
                A public, indexed page goes live with your photos, service type, location, and
                business name. Backlinks to your website accumulate. Your portfolio grows with
                every publish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits-section">
        <div className="benefits-inner">
          <div className="section-label">What you get</div>
          <div className="section-title" style={{ marginBottom: '40px' }}>
            What Local Job Pages actually do for your business.
          </div>

          {benefits.map((b, i) => (
            <div
              key={i}
              className={`benefit-item${openBenefit === i ? ' open' : ''}`}
            >
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

      {/* MID-PAGE CTA */}
      <div className="mid-cta">
        <p>Ready to start building your local search presence?</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <span className="hero-fine">No credit card required · Free plan available</span>
      </div>

      {/* STAT STRIP */}
      <div className="stat-strip">
        <div>
          <div className="stat-number"><em>88</em>%</div>
          <div className="stat-desc">
            of people who search locally for a service business engage within 24 hours.
          </div>
          <div className="stat-source">Think with Google</div>
        </div>
        <div className="stat-divider" />
        <div>
          <div className="stat-number"><em>81</em>%</div>
          <div className="stat-desc">
            of consumers read reviews before contacting a local business for the first time.
          </div>
          <div className="stat-source">BrightLocal, 2024</div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">How do Local Job Pages work?</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div
              key={i}
              className={`faq-item${openFaq === i ? ' open' : ''}`}
            >
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
            <a href="/features/before-after" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Before &amp; After
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
        <h2>Your jobs are already doing the work.<br />Let them show for it.</h2>
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
