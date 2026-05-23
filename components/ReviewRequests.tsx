'use client'

import { useState, useEffect } from 'react'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'
import '@/styles/review-requests.css'

const benefits = [
  {
    num: '01',
    title: 'The ask goes out at the right moment',
    teaser: 'Right after the job, when satisfaction is highest and the work is still fresh in the customer\'s mind.',
    body: 'Most review requests fail because they arrive too late — a week after the job when the memory has faded and the customer has moved on. With ProjectCheckin, you send the request while the work is still fresh — the customer remembers the job clearly, the satisfaction is recent, and your review link is right there. That\'s when people respond.',
  },
  {
    num: '02',
    title: 'It comes from your number, not a marketing tool',
    teaser: 'Your customer sees your name. They get a text that looks like you typed it. They reply directly to you.',
    body: 'Marketing platforms send review requests from generic numbers or no-reply addresses. Customers ignore them. When the text comes from your own phone — the same number they called to book — it reads like a personal follow-up, not a broadcast. That\'s why people respond. The reply-rate difference is not even close.',
  },
  {
    num: '03',
    title: 'The link is in the message — no searching required',
    teaser: 'Your Google review page URL is embedded in every message. Customer taps it and lands directly on Google, ready to write.',
    body: 'Most customers who want to leave a review give up because they can\'t find the page. They search for your business, find a few results, aren\'t sure which is the right one, and move on. ProjectCheckin puts your exact Google review link in every message. They tap it, they\'re there. You set the link once in account settings — it\'s automatically included every time you send a request.',
  },
  {
    num: '04',
    title: 'Every message sounds like you typed it yourself',
    teaser: 'Edit anything before you send, or tap send exactly as written. Either way it reads like a personal text — not an automated blast.',
    body: 'The pre-written message covers everything: a thank-you, a check-in on the work, and a direct ask for the review with your link. If you want to add a specific line about the job — "the iron work turned out great" — you can. The message opens in your native Messages or Mail app, where you control it completely. Nothing is sent automatically without your tap.',
  },
  {
    num: '05',
    title: 'Works by text and email',
    teaser: 'If you have a phone number, send a text. If you have email, send email. If you have both, send both.',
    body: 'The review request modal shows a Text button and an Email button based on whatever contact info you\'ve saved for the job. Both open in your native apps — Messages for texts, your default Mail app for email. Either way it goes from your number or your address, and the message is already written with your customer\'s name and review link. No subscription fees for the sending — your own apps handle it.',
  },
  {
    num: '06',
    title: 'Customers who don\'t reply get a follow-up without you doing anything',
    teaser: 'If they don\'t respond to the first text, a follow-up email goes out a few days later — on a schedule you set once.',
    body: 'Some customers don\'t respond to the first text — they meant to leave a review, they just forgot. A follow-up sent a few days later recovers a significant slice of those customers: people who genuinely intended to write something but never got around to it. You set the timing and message template once. After that, it handles itself while you\'re on the next job. No spreadsheet. No remembering who you already asked.',
  },
]

const faqs = [
  {
    q: 'What number does the text come from?',
    a: 'Your own phone number. The review request opens in your phone\'s native Messages app with the message pre-written and the recipient pre-filled. You review it, optionally edit it, and tap send. It goes from your number — not a platform, not a shared sending pool, not a no-reply address. The customer sees your name and number in their Messages app exactly as if you typed it yourself.',
  },
  {
    q: 'Does this cost anything extra?',
    a: 'No. Review Requests are included in all paid plans. There\'s no per-message fee because the message sends through your native Messages or Mail app, not through a sending service. Standard carrier messaging rates apply, which for most plans means it\'s free. The automated follow-up email system is also included — no add-on required.',
  },
  {
    q: 'Can I edit the message before it sends?',
    a: 'Yes. Nothing sends automatically. The review request modal shows the pre-written message in an editable text area. Change the wording, add a personal note about the specific job, or send it exactly as written. Once you tap the Text or Email button, the message opens in your native app — where you can make final changes before tapping send. You always control what goes out.',
  },
  {
    q: 'What if I don\'t have the customer\'s phone number?',
    a: 'The review request modal shows whichever contact options you\'ve saved. If you only have email, it shows the Email button. If you only have a phone number, it shows Text. If you have both, both are available. If no contact info is saved for the job, the option won\'t appear — but you can add it at any time by editing the job record from your dashboard.',
  },
  {
    q: 'Does anything send automatically, or do I always tap send?',
    a: 'The initial review request text or email requires your tap — nothing goes out automatically. The follow-up email system is different: once enabled and configured, it sends an automated reminder email a set number of days after the job page is published. You control the timing and the message template in your account settings. The follow-up email sends automatically on behalf of your business — you don\'t need to tap anything for that one.',
  },
  {
    q: 'Where do I set up my Google review link?',
    a: 'In your account under Connections. There\'s a Google Review Link field where you paste your Google Business Profile review URL — the direct link that takes customers straight to the review form. Once it\'s saved, it\'s automatically included in every review request you send. If the link isn\'t configured, the modal shows a warning so you know before you send.',
  },
  {
    q: 'What if Google removes a review after it\'s posted?',
    a: 'Google occasionally removes reviews for policy violations — usually spam detection, not anything you did wrong. The best defense is volume: the more reviews you have, the less any single removal affects your profile. That\'s one reason a consistent ask-after-every-job system matters more than a single push. If a review disappears, the follow-up system means you\'ve already asked that customer\'s neighbors too.',
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function ReviewRequests() {
  const [openBenefit, setOpenBenefit] = useState<number | null>(null)
  const [openFaq, setOpenFaq]         = useState<number | null>(null)
  const [activeTab, setActiveTab]     = useState<'sms' | 'email'>('sms')

  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.rr-reveal')
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('rr-visible')
            observer.unobserve(e.target)
          }
        })
      },
      { threshold: 0.08 }
    )
    els.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <MarketingNav />

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <a href="/">Home</a>
        <span className="sep">/</span>
        <span className="current">Review Requests</span>
      </div>

      {/* HERO */}
      <section style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="hero-wrap">
          <div className="hero-copy">
            <h1>Happy customers don&apos;t leave reviews. Until you ask.</h1>
            <p>
              Most contractors finish a job and move on. The ones with 50 five-star reviews
              did one thing different — they asked. One tap from your dashboard sends a
              message from your own phone, with your Google review link already in it.
            </p>
            <div className="hero-cta">
              <a href="/auth/register" className="btn-primary">Start Free</a>
              <span className="hero-fine">No credit card required · Cancel anytime</span>
            </div>
            <div className="hero-define">
              <strong>How it works</strong>
              After you finish a job, tap Request Review on the job card in your dashboard.
              A pre-written message opens in your phone&apos;s native Messages app — with the
              customer&apos;s name, your Google review link, and the published job page URL
              already included. Edit anything, or tap send exactly as written.
            </div>
          </div>

          {/* iMESSAGE CARD */}
          <div className="rr-imsg-wrap">
            <div className="rr-imsg-card">

              {/* iOS Messages chrome */}
              <div className="rr-imsg-chrome">
                <div className="rr-imsg-back">
                  <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 1L1 6l5 5" />
                  </svg>
                  Messages
                </div>
                <div className="rr-imsg-actions">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.86 9.64a19.79 19.79 0 01-3.07-8.67A2 2 0 012.77 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.5a16 16 0 006.29 6.29l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                  </svg>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="10" r="3" />
                    <path d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
                  </svg>
                </div>
                <div className="rr-imsg-avatar">SM</div>
                <div className="rr-imsg-name">Sarah M.</div>
                <div className="rr-imsg-sub">Mobile · 615-555-0182</div>
              </div>

              {/* Thread */}
              <div className="rr-imsg-thread">
                <div className="rr-imsg-ts">Today 4:47 PM</div>
                <div className="rr-imsg-row-out">
                  <div className="rr-imsg-bubble">
                    Sarah — we really appreciated your business. Hope you love the result — but please don&apos;t hesitate to call if anything needs attention.
                    <br /><br />
                    If you have a minute, a Google review helps us more than you know:
                    <span className="rr-imsg-link">⭐ Leave us a review on Google</span>
                    <span className="rr-imsg-link">📄 Your completed job page</span>
                    <br />
                    <span className="rr-imsg-sig">Thanks!<br />Carter&apos;s Iron Doors<br />615-555-0182</span>
                  </div>
                </div>
                <div className="rr-imsg-delivered">Delivered</div>
              </div>

              {/* Compose bar */}
              <div className="rr-imsg-compose">
                <div className="rr-imsg-compose-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </div>
                <div className="rr-imsg-compose-field">iMessage</div>
                <div className="rr-imsg-send">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" /></svg>
                </div>
              </div>

            </div>

            {/* Annotation chips */}
            <div className="rr-chips">
              <div className="rr-chip">
                <div className="rr-chip-dot orange" />
                Sends from your own phone number — not a platform
              </div>
              <div className="rr-chip">
                <div className="rr-chip-dot blue" />
                Customer&apos;s name and review link already filled in
              </div>
              <div className="rr-chip">
                <div className="rr-chip-dot green" />
                Editable before you send — or tap send as written
              </div>
              <div className="rr-chip">
                <div className="rr-chip-dot navy" />
                Opens in Messages or Mail — no new app to download
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="how-inner">
          <div className="section-label">How it works</div>
          <div className="section-title">Three steps. The hard one is already done.</div>
          <div className="steps">
            <div className="step rr-reveal">
              <div className="step-num active">1</div>
              <h3>Save customer info during check-in</h3>
              <p>
                When your crew checks in, they enter the customer&apos;s name and phone number.
                It takes 20 seconds. That info stays attached to the job — ready for the
                review request when the work is done.
              </p>
            </div>
            <div className="step rr-reveal rr-delay-1">
              <div className="step-num">2</div>
              <h3>Tap Request Review on the job card</h3>
              <p>
                One button in your dashboard. Tap it and the pre-written message opens in
                your native Messages app, addressed to your customer with your review link
                already included.
              </p>
              <div className="rr-sdp">
                <div className="rr-sdp-label">Your dashboard</div>
                <div className="rr-sdp-job">Iron Door — Nashville, TN</div>
                <div className="rr-sdp-addr">May 12, 2026 · Sarah M.</div>
                <div className="rr-sdp-btns">
                  <span className="rr-sdp-btn ghost">View Job</span>
                  <span className="rr-sdp-btn orange">Request Review</span>
                </div>
              </div>
            </div>
            <div className="step rr-reveal rr-delay-2">
              <div className="step-num">3</div>
              <h3>Customer gets a text from your number</h3>
              <p>
                Not from a platform. Not from a no-reply address. From your phone, with
                your name. They tap the link, they land on your Google review page,
                they write the review.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* DARK MESSAGE PREVIEW SECTION */}
      <section className="rr-msg-section">
        <div className="rr-msg-inner">

          <div className="rr-msg-copy rr-reveal">
            <div className="rr-msg-badge">What your customer receives</div>
            <h2>The message is already written.<br />You just tap send.</h2>
            <p>
              Every word is drafted. The customer&apos;s name is filled in. Your Google review
              link is embedded. The published job page is linked. Your signature is automatic.
            </p>
            <p>
              Edit any of it before sending — change the tone, add a personal line, adjust
              the copy. Or leave it exactly as written and tap send.
            </p>
            <p>
              Works by text and email. Both open in your native apps — Messages and Mail —
              from your own number and address.
            </p>

            <div className="rr-msg-tabs">
              <button
                className={`rr-msg-tab${activeTab === 'sms' ? ' active' : ''}`}
                onClick={() => setActiveTab('sms')}
              >
                Text Message
              </button>
              <button
                className={`rr-msg-tab${activeTab === 'email' ? ' active' : ''}`}
                onClick={() => setActiveTab('email')}
              >
                Email
              </button>
            </div>
          </div>

          <div className="rr-reveal rr-delay-1">
            <div className="rr-msg-card">

              <div className="rr-mc-header">
                <div className="rr-mc-recipient">
                  To: <span>Sarah M.</span> &nbsp;·&nbsp; <span>{activeTab === 'sms' ? '615-555-0182' : 'sarah@example.com'}</span>
                </div>
                <div className={`rr-mc-chip${activeTab === 'email' ? ' mail' : ''}`}>
                  {activeTab === 'sms' ? 'via iMessage' : 'via Mail'}
                </div>
              </div>

              {activeTab === 'sms' ? (
                <>
                  <div className="rr-mc-sms-body">
                    <div className="rr-mc-sms-bubble">
                      <span className="rr-ann">Sarah</span> — we really appreciated your business. Hope you love the result — but please don&apos;t hesitate to call if anything needs attention.
                      <br /><br />
                      If you have a minute, a Google review helps us more than you know:
                      <span className="rr-link">⭐ Leave us a review on Google →</span>
                      <span className="rr-link">📄 See your completed job page →</span>
                      <span className="rr-sig">Thanks!<br />Carter&apos;s Iron Doors<br />615-555-0182</span>
                    </div>
                  </div>
                  <div className="rr-mc-legend">
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot orange" />
                      Customer first name — pulled from the job record
                    </div>
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot blue" />
                      Your Google review link — set once in account settings
                    </div>
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot muted" />
                      Your business name and phone — auto-signed from your account
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="rr-mc-email-field">
                    <strong>Subject</strong>
                    We appreciated working with you — quick favor if you have a minute
                  </div>
                  <div className="rr-mc-email-body">
                    <span className="rr-ann">Sarah</span>,<br /><br />
                    We really appreciated the opportunity to work with you. Hope everything looks exactly the way you wanted — but please don&apos;t hesitate to reach out if anything needs attention.
                    <br /><br />
                    If you have a spare minute, a Google review means more than you know:
                    <span className="rr-link">⭐ Leave us a review on Google →</span>
                    <span className="rr-link">📄 View your completed job page →</span>
                    <span className="rr-sig">Thanks for trusting us with your home.<br /><br />Carter&apos;s Iron Doors<br />615-555-0182<br />cartersiron.com</span>
                  </div>
                  <div className="rr-mc-legend">
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot orange" />
                      Customer first name — pulled from the job record
                    </div>
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot blue" />
                      Your Google review link — set once in account settings
                    </div>
                    <div className="rr-legend-item">
                      <div className="rr-legend-dot muted" />
                      Your business name, phone, and website — from your account
                    </div>
                  </div>
                </>
              )}

            </div>
            <div className="rr-mc-edit-note">
              Fully editable before sending &nbsp;·&nbsp; Opens in your native Messages or Mail app
            </div>
          </div>

        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits-section">
        <div className="benefits-inner">
          <div className="section-label">What you get</div>
          <div className="section-title" style={{ marginBottom: '16px' }}>
            Why most contractors have fewer reviews than they deserve.
          </div>
          <p className="rr-benefits-sub">
            Your competitors with 4.8 stars aren&apos;t doing better work. They&apos;re asking.
          </p>

          {benefits.map((b, i) => (
            <div
              key={i}
              className={`benefit-item rr-reveal${openBenefit === i ? ' open' : ''}`}
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
        <p>The work is done. The message is written. You just tap send.</p>
        <a href="/auth/register" className="btn-primary">Start Free</a>
        <span className="hero-fine">No credit card required · Cancel anytime</span>
      </div>

      {/* STAT STRIP — 3-column */}
      <div className="stat-strip-3">
        <div className="stat-strip-3-inner">
          <div>
            <div className="stat-number"><em>81</em>%</div>
            <div className="stat-desc">
              of consumers read Google reviews before contacting a local business for the first time.
            </div>
            <div className="stat-source">BrightLocal, 2024</div>
          </div>
          <div>
            <div className="stat-number"><em>88</em>%</div>
            <div className="stat-desc">
              of people who do a local search engage with a business within 24 hours.
            </div>
            <div className="stat-source">Think with Google</div>
          </div>
          <div>
            <div className="stat-number"><em>&lt; 60</em> sec</div>
            <div className="stat-desc">
              from job published to review request sent from your own phone.
            </div>
            <div className="stat-source">ProjectCheckin</div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">Review Requests, answered.</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div
              key={i}
              className={`faq-item rr-reveal${openFaq === i ? ' open' : ''}`}
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
            <a href="/features/local-job-pages" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              Local Job Pages
            </a>
            <a href="/features/before-after" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <path d="M12 2v20" />
              </svg>
              Before &amp; After
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
        <h2>Your happiest customers have something to say.<br />Make it easy for them to say it.</h2>
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
