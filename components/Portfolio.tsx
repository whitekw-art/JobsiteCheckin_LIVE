'use client'

import { useState } from 'react'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'
import '@/styles/portfolio.css'

const benefits = [
  {
    num: '01',
    title: 'Your portfolio updates itself — no separate maintenance required',
    teaser: 'Published jobs go straight to your portfolio. You do not manage a separate gallery or upload anything twice.',
    body: 'Every time you publish a job from your dashboard, the portfolio reflects it immediately. After a year of consistent publishing, your portfolio shows every completed project — always current, without any additional effort. There is no second system to maintain, no gallery to update manually, and nothing to organize in a separate tool. The dashboard and portfolio are connected: one publish action keeps both current.',
  },
  {
    num: '02',
    title: 'Visitors see real work with real context — not staged photos',
    teaser: 'Every job in your portfolio includes real photos from the actual job, the city where it was done, the job type, and the completion date.',
    body: "There are no stock photos, no staged shots, and no jobs that did not happen. That specificity is exactly what makes someone trust what they are looking at. A gallery that shows 'Iron door installation, Nashville, TN, April 2026' with photos from the actual job is more convincing than a polished marketing page with generic images. Anyone looking at your portfolio is looking for evidence that you have done this work before, and documented job records provide it in a way that staged content cannot replicate.",
  },
  {
    num: '03',
    title: 'Filter by job type — visitors find work relevant to what they need',
    teaser: 'Your portfolio includes filter tabs by job category, so a homeowner looking for a specific type of work sees exactly that — not a mix of unrelated projects.',
    body: 'When someone who needs an iron door sees a filtered gallery of iron door jobs, the portfolio reads as specific and directly relevant to their situation. They are not scrolling through unrelated work to find what matters to them. The filter tabs are generated automatically from the job types recorded in your published jobs — you do not configure anything separately.',
  },
  {
    num: '04',
    title: 'Your portfolio URL works in every channel you already use',
    teaser: 'Put it in your email signature, drop it in a bid proposal, or text it before a consultation — the link stays current without any updates from you.',
    body: 'The portfolio URL does not change. Once you put it in your email signature, every email you send from that point forward includes a link to your current portfolio — including every job you publish after that. The same applies to your Google Business Profile, any social accounts, text messages, and bid emails. The link is always live, always current, and does not need to be re-sent when new jobs are added.',
  },
  {
    num: '05',
    title: 'Your dashboard stays private; your portfolio stays public',
    teaser: 'Customer names, phone numbers, and contact information remain in your private dashboard. Visitors see only the published work.',
    body: 'The separation between the private dashboard and the public portfolio is built into the system. When you publish a job, only the job type, location, photos, and date appear on the public portfolio page. No customer names, no phone numbers, no internal notes. You control what is published; everything else remains in your private dashboard, visible only to you and the admin users you have authorized.',
  },
  {
    num: '06',
    title: 'Job records stay with your business — not on any individual\'s device',
    teaser: 'When a job is submitted through the app, the record belongs to your account — not to the phone it was submitted from.',
    body: 'If someone leaves your team, every job they submitted remains in your dashboard. The photos, location data, job type, and notes are attached to your organization account, not to the device that submitted them. Your documented job history is not at risk if a phone is lost, an employee moves on, or staffing changes. Your portfolio continues to reflect every job that was ever submitted and published, regardless of any personnel changes.',
  },
]

const faqs = [
  {
    q: 'What is a Job Portfolio on ProjectCheckin?',
    a: 'A Job Portfolio is a public page at a URL specific to your business — projectcheckin.com/portfolio/your-business. It displays every job you have published from your dashboard, organized by job type with photos, location, and date. Visitors can filter by job category and click through to individual job pages for more detail. The portfolio updates automatically each time you publish a new job — no separate maintenance required.',
  },
  {
    q: 'How do jobs get added to the portfolio?',
    a: 'Jobs are added to your portfolio when you click Publish on a job record in your dashboard. When a job is submitted through the check-in app, it appears in your private dashboard first. You review it, and when it is ready, you publish it. Publishing makes the job live as a public page and adds it to your portfolio at the same time. Jobs that have not been published do not appear in the portfolio.',
  },
  {
    q: 'Can anyone see my portfolio?',
    a: 'Yes — your portfolio is a public page. Anyone with the URL can view it without logging in. That is by design: you share the URL with anyone so they can see your work without needing an account. Your dashboard, by contrast, is private and requires authentication. Only you and the admin users you have authorized can access dashboard data.',
  },
  {
    q: 'Can I control which jobs appear in my portfolio?',
    a: 'Yes. Only published jobs appear in your portfolio. Jobs that have been submitted but not yet published remain in your private dashboard and are not visible publicly. If you publish a job and later want to remove it from your portfolio, you can unpublish it from your dashboard and it will be removed from the public view.',
  },
  {
    q: 'What information is visible on the public portfolio page?',
    a: 'The public portfolio shows the job type, the city and state where the work was done, the photos submitted with the job, and the date the job was completed. Each job card links to a full job page with all associated photos and a description. Your business phone number and website link appear at the top of your portfolio page as tap-to-call and website link buttons. Customer names, customer contact details, and internal dashboard notes are never shown publicly.',
  },
  {
    q: "Is my customer's information visible on the portfolio?",
    a: 'No. Customer names, phone numbers, and email addresses are stored in your private dashboard only. They are never shown on your public portfolio or on individual public job pages. The public view shows job type, location, photos, and dates — all of which are work documentation, not customer data.',
  },
  {
    q: 'What is the difference between the dashboard and the portfolio?',
    a: 'The dashboard is your private workspace — where job submissions land, where you manage records, publish jobs, send review requests, and view all data associated with your account. Only you and authorized admin users can access it. The portfolio is the public-facing output — a shareable gallery at a public URL that shows only the jobs you have chosen to publish. Publishing from your dashboard is what creates and keeps your portfolio current.',
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const phoneIcon = (
  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.08 1.18 2 2 0 012.07 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
  </svg>
)

const shareIcon = (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
  </svg>
)

export default function Portfolio() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(null)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)

  return (
    <>
      <MarketingNav />

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="current">Job Portfolio</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--muted)', opacity: 0.55 }}>
          Updated May 2026
        </span>
      </div>

      {/* HERO */}
      <section>
        <div className="hero-wrap">

          <div className="hero-copy">
            <h1>Every published job appears in your portfolio automatically.</h1>
            <p>
              Your portfolio lives at a public URL with your business name.
              Every job you publish from your dashboard adds to it without any extra steps.
              Send the link to any potential customer and they see a clean, organized gallery of your
              actual completed work, with real photos, real locations, and real dates attached.
            </p>
            <div className="hero-cta">
              <a href="/auth/register" className="btn-primary">Start Free</a>
              <span className="hero-fine">No credit card required</span>
            </div>
            <div className="hero-define">
              <strong>What is a Job Portfolio?</strong> A Job Portfolio is a public page at your own
              ProjectCheckin URL — visible to anyone you share it with, and updated automatically each
              time you publish a job from your dashboard. It displays your completed work organized by
              job type, with photos, locations, and dates attached. You control what gets published;
              everything else stays private in your dashboard.
            </div>
          </div>

          {/* HERO VISUAL: portfolio in browser frame */}
          <div className="browser-frame">
            <div className="browser-chrome">
              <div className="browser-dots">
                <div className="browser-dot red" />
                <div className="browser-dot amber" />
                <div className="browser-dot green" />
              </div>
              <div className="browser-url">projectcheckin.com/portfolio/carters-iron-doors</div>
            </div>
            <div>
              <div className="pc-head">
                <div className="pc-biz">
                  <div className="pc-avatar">CI</div>
                  <div>
                    <div className="pc-biz-name">Carter&apos;s Iron Doors</div>
                    <div className="pc-biz-sub">Nashville, TN &middot; Est. 2018</div>
                  </div>
                </div>
                <div className="pc-call-btn">{phoneIcon} Call Now</div>
              </div>
              <div className="pc-filters">
                <span className="pc-chip active">All Work</span>
                <span className="pc-chip passive">Iron Door</span>
                <span className="pc-chip passive">Wood Door</span>
                <span className="pc-chip passive">Garage</span>
              </div>
              <div className="pc-grid">
                <div className="pc-item">
                  <div className="pc-thumb t1">
                    <span className="pc-thumb-label">Iron Door</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Iron Door</div>
                    <div className="pc-meta-loc">Nashville, TN</div>
                  </div>
                </div>
                <div className="pc-item">
                  <div className="pc-thumb t2">
                    <span className="pc-thumb-label">Wood Door</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Wood Door</div>
                    <div className="pc-meta-loc">Franklin, TN</div>
                  </div>
                </div>
                <div className="pc-item">
                  <div className="pc-thumb t3 pc-thumb-new">
                    <span className="pc-thumb-label">Garage Door</span>
                    <span className="pc-new-badge">New</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Garage Door</div>
                    <div className="pc-meta-loc">Brentwood, TN</div>
                  </div>
                </div>
                <div className="pc-item">
                  <div className="pc-thumb t4">
                    <span className="pc-thumb-label">Iron Door</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Iron Door</div>
                    <div className="pc-meta-loc">Murfreesboro, TN</div>
                  </div>
                </div>
                <div className="pc-item">
                  <div className="pc-thumb t5">
                    <span className="pc-thumb-label">Wood Door</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Wood Door</div>
                    <div className="pc-meta-loc">Hendersonville, TN</div>
                  </div>
                </div>
                <div className="pc-item">
                  <div className="pc-thumb t6">
                    <span className="pc-thumb-label">Iron Door</span>
                  </div>
                  <div className="pc-meta">
                    <div className="pc-meta-type">Iron Door</div>
                    <div className="pc-meta-loc">Smyrna, TN</div>
                  </div>
                </div>
              </div>
              <div className="pc-footer">
                <span className="pc-count">Showing 6 of 24 completed jobs</span>
                <span className="pc-view-all">View all &rarr;</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <div className="section-title">From job submission to shareable portfolio.</div>
          <div className="steps">

            <div className="step">
              <div className="step-num active">1</div>
              <h3>Job data lands in your private dashboard</h3>
              <p>
                When a job is submitted through the check-in app, the record appears in your dashboard
                with everything attached &mdash; photos, GPS location, job type, date, and any notes.
                Only you and your admin users can see this. Customer contact information stays here,
                private, and is never shown publicly.
              </p>
            </div>

            <div className="step">
              <div className="step-num">2</div>
              <h3>You review and publish when the job is ready</h3>
              <p>
                From your dashboard, review the job record. When it looks right, click Publish.
                The job goes live as a public page on projectcheckin.com immediately, and is added
                to your portfolio at the same time. One action produces both results.
              </p>
              <div className="step-button-hint">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Publish Job
              </div>
            </div>

            <div className="step">
              <div className="step-num">3</div>
              <h3>Your portfolio updates and is ready to share</h3>
              <p>
                Every published job appears in your portfolio automatically &mdash; organized by job
                type, with all photos and location data included. Your portfolio URL stays the same.
                Send it once and it remains current every time you publish a new job.
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
            What a portfolio that updates itself actually does for your business.
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

      {/* DARK SECTION: what visitors see */}
      <section className="port-section">
        <div className="port-inner">

          <div className="port-copy">
            <div className="port-badge">What people see</div>
            <h2>A professional gallery of your completed work, built from real jobs.</h2>
            <p>
              Your dashboard is private. Your portfolio is public. Every job you publish from your
              dashboard appears here automatically &mdash; organized by job type, with real photos,
              real locations, and real dates. No staging. No stock photos. No fabricated records.
            </p>
            <p>
              Visitors can filter by job type to find work similar to what they are considering.
              Each job card links to a full job page with all the photos and details from that
              specific project. Your portfolio gives them enough to make a decision before they
              ever pick up the phone.
            </p>
            <div className="port-url">
              <div className="port-url-dot" />
              projectcheckin.com/portfolio/carters-iron-doors
            </div>
          </div>

          <div className="phone-outer">
            <div>
              <div className="phone">
                <div className="phone-bar">
                  <div className="phone-pill" />
                  <div className="phone-cam" />
                </div>
                <div className="phone-screen">
                  <div className="mob-head">
                    <div className="mob-biz-row">
                      <div className="mob-avatar">CI</div>
                      <div>
                        <div className="mob-biz-name">Carter&apos;s Iron Doors</div>
                        <div className="mob-biz-sub">Nashville, TN &middot; Est. 2018</div>
                      </div>
                    </div>
                    <div className="mob-call-btn">{phoneIcon} Call</div>
                  </div>
                  <div className="mob-filters">
                    <span className="mob-chip active">All</span>
                    <span className="mob-chip passive">Iron</span>
                    <span className="mob-chip passive">Wood</span>
                    <span className="mob-chip passive">Garage</span>
                  </div>
                  <div className="mob-grid">
                    <div className="mob-item">
                      <div className="mob-thumb m1">
                        <span className="pc-thumb-label">Iron Door</span>
                      </div>
                      <div className="mob-meta">
                        <div className="mob-meta-type">Iron Door</div>
                        <div className="mob-meta-loc">Nashville, TN</div>
                      </div>
                    </div>
                    <div className="mob-item">
                      <div className="ba-thumb">
                        <div className="ba-before" />
                        <div className="ba-after" />
                        <div className="ba-line" />
                        <div className="ba-handle" />
                        <span className="ba-label before">Before</span>
                        <span className="ba-label after">After</span>
                      </div>
                      <div className="mob-meta">
                        <div className="mob-meta-type">Garage Door</div>
                        <div className="mob-meta-loc">Brentwood, TN</div>
                      </div>
                    </div>
                    <div className="mob-item">
                      <div className="mob-thumb m3">
                        <span className="pc-thumb-label">Wood Door</span>
                      </div>
                      <div className="mob-meta">
                        <div className="mob-meta-type">Wood Door</div>
                        <div className="mob-meta-loc">Franklin, TN</div>
                      </div>
                    </div>
                    <div className="mob-item">
                      <div className="mob-thumb m4">
                        <span className="pc-thumb-label">Iron Door</span>
                      </div>
                      <div className="mob-meta">
                        <div className="mob-meta-type">Iron Door</div>
                        <div className="mob-meta-loc">Murfreesboro, TN</div>
                      </div>
                    </div>
                  </div>
                  <div className="mob-share">
                    {shareIcon}
                    Share this portfolio
                  </div>
                </div>
              </div>
              <p className="port-note">What anyone sees when you send the link &nbsp;&middot;&nbsp; No login required</p>
            </div>
          </div>

        </div>
      </section>

      {/* MID CTA */}
      <div className="mid-cta">
        <p>Your portfolio grows every time you publish a job from your dashboard.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <span className="hero-fine">Portfolio included on all plans. No credit card required.</span>
      </div>

      {/* STAT STRIP */}
      <div className="stat-strip">
        <div>
          <div className="stat-number"><em>$177</em>B</div>
          <div className="stat-desc">estimated annual cost of poor documentation and communication in the construction industry.</div>
          <div className="stat-source">Construction Industry Institute</div>
        </div>
        <div className="stat-divider" />
        <div>
          <div className="stat-number"><em>5</em>&ndash;<em>15</em>%</div>
          <div className="stat-desc">of total project costs attributed to rework caused by inadequate job documentation.</div>
          <div className="stat-source">Construction Industry Institute</div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">How does the Job Portfolio work?</h2>
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
            <a href="/features/gbp-post-generator" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              GBP Post Generator
            </a>
            <a href="/features/review-requests" className="explore-link">
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
        <h2>Every job you publish builds a portfolio that sells for you.</h2>
        <p>Start free. No credit card required.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <div className="cta-fine">Portfolio included on all plans. Pro from $49.50/mo.</div>
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
