'use client'

import { useState } from 'react'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'

const benefits = [
  {
    num: '01',
    title: 'Google Rewards Active Listings',
    teaser: 'Businesses that post regularly to their GBP show up more often in local search results and the Google Maps local pack.',
    body: "Google's local ranking algorithm weighs engagement signals — how often a business updates its profile, adds photos, and posts content. Most contractors create a GBP listing and never touch it again. Regular job posts directly address that gap. Every post is a signal that you're active, working, and present in the areas you serve. Consistency over time is what moves the needle — not a single burst of posts.",
  },
  {
    num: '02',
    title: 'Real Job Photos Beat Stock Photos',
    teaser: "Businesses with active, real photo galleries get 42% more direction requests and 35% more website clicks than those without — Google's own data.",
    body: "This stat is from Google's own GBP data. Homeowners respond to photos of real finished work — not clipart, stock images, or an empty photo section. Every job post adds a fresh, real photo to your GBP listing. Over 6 months of regular posting, your listing looks like what it is: an active business doing real jobs. That visual credibility converts browsers into callers before they've even visited your website.",
  },
  {
    num: '03',
    title: 'Reach People Already Searching for You',
    teaser: "GBP posts appear when someone Googles your business name. That's the highest-intent audience you have — they're already looking.",
    body: "When a prospect gets your card, sees your truck, or hears about you from a neighbor, the first thing they do is Google your name. What they find on that results page determines whether they call. A stale GBP with no recent activity says the business might not be operating anymore. A GBP with a post from last week — showing a finished job two streets over — says the opposite. GBP posts reach the people most likely to become customers.",
  },
  {
    num: '04',
    title: 'Zero Writing Required',
    teaser: 'ProjectCheckin generates the caption automatically from the job data your crew already entered — service type, city, and notes.',
    body: 'The caption is generated from what\'s already in the job record: the door type, the city, the date, and any notes your crew or office added. A typical output: "Iron door installation completed in Nashville, TN. Double-entry with custom glass panel. See the full project with photos →". No marketing copy. No thinking. The post reads like a real business update because it is one — it just happened to write itself.',
  },
  {
    num: '05',
    title: 'Posts Drive Traffic to Your Full Job Page',
    teaser: 'Each GBP post links to the full Local Job Page — more photos, more detail, and a direct path for interested homeowners to contact you.',
    body: 'A GBP post shows one photo and a short caption — enough to get attention. The "See the full project" link takes interested homeowners to the full Local Job Page: all the photos, the job notes, the exact location, and a direct call-to-action to contact you. The GBP post creates the first impression; the job page handles the close. Most contractors have no landing page behind their GBP. Yours does.',
  },
  {
    num: '06',
    title: 'No Google Login Every Time',
    teaser: 'Connect once. Post from your ProjectCheckin dashboard as many times as you want — no switching apps, no passwords, no interruptions.',
    body: "Most contractors who try to post to their GBP manually give up because logging into Google's Business Profile tools is cumbersome — especially mid-day from a phone on a job site. After a one-time Google account connection in your ProjectCheckin account settings, posting is a single button click from the same dashboard you already use. No context switching. No loading a separate app. The friction is eliminated, which is the only reason consistent posting ever actually happens.",
  },
  {
    num: '07',
    title: 'The 7-Day Window Works in Your Favor',
    teaser: "Google Posts expire after 7 days — which means a post-per-job cadence keeps your listing permanently fresh, not permanently stale.",
    body: "The expiration that frustrates contractors who post manually is an advantage for contractors who post consistently. A business that posts every time they publish a job always has a current post showing. A business that doesn't — or that posts once and stops — shows nothing. If a competitor's last GBP post was four months ago, your listing showing last week's job is a direct contrast. The 7-day limit keeps the bar clear: to stay visible, you have to keep working and keep posting. You already do the work. ProjectCheckin handles the rest.",
  },
  {
    num: '08',
    title: 'Visible in Both Google Search and Google Maps',
    teaser: 'Posts appear everywhere your business listing does — on desktop, mobile, and Google Maps, for anyone who finds or searches for your business.',
    body: 'Google Business Profile posts appear in the "Updates" section of your business listing across every Google surface: Google Search results, the Google Maps business panel, and Google Search on mobile. Homeowners who find your business while navigating to a job site, searching from a phone, or looking you up after a referral all see the same thing: a business that posted a finished project recently. That consistency, across every screen they might use, is what makes the listing feel alive rather than abandoned.',
  },
]

const faqs = [
  {
    q: 'What is a GBP Post and where does it appear?',
    a: 'A Google Business Profile (GBP) Post is a short update — photo plus caption — that appears on your business listing when someone searches for you in Google Search or Google Maps. It shows in the "Updates" section of your profile and is visible to anyone who finds your business on Google. Posts expire after 7 days, which is why consistent posting matters.',
  },
  {
    q: 'What does the auto-generated caption say?',
    a: 'ProjectCheckin generates the caption from the job data your crew already entered: service type, city, and any notes. A typical caption looks like: "Iron door installation completed in Huntsville, AL. Double-entry with decorative glass and forged hardware. See the full project — photos and details — on our project page." The caption includes a link to the full Local Job Page for anyone who wants to see more.',
  },
  {
    q: 'Do I need to log into Google every time?',
    a: 'No. You connect your Google Business Profile once from your Account settings. After that, clicking "Post to Google Business" on any published job card in your dashboard sends the post directly — no separate login, no copy-pasting, no browser switching required.',
  },
  {
    q: 'GBP posts expire after 7 days — is that a problem?',
    a: "No — it works in your favor. If you publish one job per week, your Google Business Profile always shows a fresh post from the current week. The 7-day window means consistent job publishing translates directly into a constantly updated listing. Google rewards active profiles with better placement in local results. Contractors who post once and stop show nothing. Yours shows last week's job.",
  },
  {
    q: 'How is this different from Local Job Pages?',
    a: 'Local Job Pages are permanent, indexed web pages that build long-term search presence — they stay live indefinitely and accumulate value over time. GBP Posts are short-lived updates (7 days) that appear directly on your Google Business Profile and reach people searching for your business right now. They work together: the GBP post drives immediate visibility, the Local Job Page builds durable presence.',
  },
  {
    q: 'Which plans include GBP posting?',
    a: "GBP posting is available on Pro, Elite, and Titan plans. Pro and Elite plans post links back to the full job page on projectcheckin.com. Titan plans post links to the job page on the contractor's own domain — so the traffic and any SEO credit from that click goes to their own website instead of ours.",
  },
  {
    q: "What if I don't have a Google Business Profile set up yet?",
    a: "You'll need a Google Business Profile to use this feature — it's free to create at business.google.com. If you already have one but haven't verified it, Google requires verification before posts are visible publicly. Your ProjectCheckin Account settings include a step-by-step guide to connect your existing GBP once it's verified.",
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function GBPPostGenerator() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(null)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)

  return (
    <>
      <MarketingNav />

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="current">GBP Post Generator</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--muted)', opacity: 0.55 }}>
          Updated May 2026
        </span>
      </div>

      {/* HERO */}
      <section>
        <div className="hero-wrap">
          <div className="hero-copy">
            <h1>Every job you publish posts to Google. One click.</h1>
            <p>
              ProjectCheckin writes the caption, attaches the job photo, and sends it to your Google
              Business Profile — straight from your dashboard. No logging into Google. No writing.
              Your listing stays active without any extra work.
            </p>
            <div className="hero-cta">
              <a href="/auth/register" className="btn-primary">Start Free</a>
              <span className="hero-fine">No credit card required</span>
            </div>
            <div className="hero-define" style={{ borderLeftColor: 'var(--google-blue)' }}>
              <strong>What is a GBP Post?</strong> A Google Business Profile post is a short update
              — photo plus a caption — that appears on your business listing in Google Search and
              Google Maps. When homeowners search for you, they see recent jobs. When Google checks
              your listing, it sees an active business.
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/gbp-flow-diagram.png"
            alt="How ProjectCheckin posts jobs to Google Business Profile — crew uploads a job photo, AI drafts the post, it goes live on Google"
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <div className="section-title">Finish a job. It&apos;s already posted to Google.</div>
          <div className="steps">
            <div className="step">
              <div className="step-num active">1</div>
              <h3>The post writes itself</h3>
              <p>
                Your crew submits photos and job details through the app. ProjectCheckin reads what
                was done — where, what service, which photos — and drafts a Google Business Profile
                post. You don&apos;t write anything.
              </p>
            </div>
            <div className="step">
              <div className="step-num">2</div>
              <h3>Send it from your dashboard</h3>
              <p>
                Your Google Business Profile is connected directly to your account. When the draft
                looks right, one button sends it. No logging into Google. No switching apps. No
                copy-pasting.
              </p>
              <div className="step-button-hint">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Post to Google Business
              </div>
            </div>
            <div className="step">
              <div className="step-num">3</div>
              <h3>Your listing stays active</h3>
              <p>
                The post goes live on your Google Business Profile — visible in Google Search and
                Google Maps. One new post per job means your listing always shows recent, real work.
                Google notices.
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
            What consistent GBP posting actually does for your business.
          </div>

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

      {/* MID-PAGE CTA */}
      <div className="mid-cta">
        <p>Let your jobs keep your Google listing fresh.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <span className="hero-fine">GBP posting included on Pro, Elite, and Titan plans</span>
      </div>

      {/* STAT STRIP */}
      <div className="stat-strip">
        <div>
          <div className="stat-number"><em>42</em>%</div>
          <div className="stat-desc">more direction requests for businesses with active GBP photo galleries vs. those without.</div>
          <div className="stat-source">Google Business Profile data</div>
        </div>
        <div className="stat-divider" />
        <div>
          <div className="stat-number"><em>35</em>%</div>
          <div className="stat-desc">more website clicks for businesses with active photo galleries vs. those without.</div>
          <div className="stat-source">Google Business Profile data</div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">How does GBP posting work?</h2>
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
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Local Job Pages
            </a>
            <a href="#" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Before &amp; After
            </a>
            <a href="#" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Review Requests
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
        <h2>Your next job is already your next Google post.<br />Let it go up automatically.</h2>
        <p>Start free. No credit card required.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <div className="cta-fine">GBP posting on Pro, Elite, and Titan. Free plan available.</div>
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
