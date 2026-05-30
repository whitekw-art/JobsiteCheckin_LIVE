'use client'

import { useState } from 'react'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import '@/styles/features.css'

const STEPS = [
  { n: '1', title: 'Job is published', desc: 'Customer name, phone or email, and job details are on file from check-in.' },
  { n: '2', title: 'Your AI agent writes the message', desc: 'References the customer\'s name, the specific address, and what your crew actually did. Every draft is unique to that job.' },
  { n: '3', title: 'Review modal opens pre-filled', desc: 'Edit anything — or send as-is. The draft is yours. Takes about 10 seconds to review.' },
  { n: '4', title: 'Your AI agent handles replies', desc: 'Customer writes back with a question? Your AI agent answers using your job data and business profile. Complaints escalate to you immediately.' },
]

const WHAT_DIFFERENT = [
  { title: 'Customer name from your check-in data', body: 'No copy-paste, no fill-in-the-blank. The AI uses the name you captured on the job.' },
  { title: 'Job address in the message', body: 'References the actual location — the detail homeowners remember most.' },
  { title: 'Sends from your own phone or email', body: 'No third-party number. No platform fee per text. The message comes from you.' },
  { title: 'Your review link included automatically', body: 'The Google review link from your Account settings is pre-populated in every draft.' },
  { title: 'Your AI agent handles every reply', body: 'Warranty questions, job confirmation, follow-up details — answered using your actual job record and business profile, not generic scripts.' },
  { title: 'Knows when to involve you', body: 'If a customer is unhappy, your AI agent pauses, stops responding, and notifies you immediately. It knows when a human needs to take over.' },
]

const CONVO_BULLETS = [
  { title: 'Your AI agent knows the job', body: 'Pulls from the actual check-in record — date, scope, address — to answer with real specifics, not guesses.' },
  { title: 'Your AI agent knows your business', body: 'Uses your warranty terms, service area, and contact info — set once in your account, used in every conversation.' },
  { title: 'Knows when to call you in', body: 'Complaints or refund requests pause replies immediately and notify you. Your AI agent never makes a bad situation worse.' },
]

const FAQS = [
  {
    q: 'What is an AI Review Request Agent?',
    a: 'An AI agent that reads your check-in data — customer name, address, and what was done — and writes a personalized review request message ready to send in one tap. Your agent handles customer replies automatically and escalates complaints to you immediately.',
  },
  {
    q: 'Does the message actually reference the specific job?',
    a: "Yes. Every draft is generated from the actual check-in record — the customer's name, the job address, and the scope of work. It reads like a real person wrote it about their house, because the AI knows every detail of that specific job.",
  },
  {
    q: 'What happens when a customer replies?',
    a: 'Your AI agent reads the reply and responds using your job data and business profile — warranty terms, contact info, service area, and the specifics of that job. Warranty questions, follow-up details, and general questions are handled automatically.',
  },
  {
    q: 'What if a customer is unhappy?',
    a: 'Complaints and disputes trigger an immediate escalation. Your AI agent pauses all responses and notifies you to take over. It never tries to resolve a confrontation or make a situation worse. You stay in control of anything sensitive.',
  },
  {
    q: 'Does it cost extra to send texts or emails?',
    a: 'No. The AI draft sends from your own phone via the standard SMS app or from your own email client. No third-party number, no per-message fee, no platform in the middle. The message comes from you.',
  },
  {
    q: 'Which plan includes this feature?',
    a: 'The AI Review Request Agent is included in the Titan plan. It is coming soon — start capturing customer contact info on your check-ins now so your agent has a complete contact list ready on day one.',
  },
]

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export default function AIReviewRequestAgent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <>
      <MarketingNav />

      {/* Breadcrumb */}
      <div className="breadcrumb-dark">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="current">AI Review Request Agent</span>
      </div>

      {/* Hero */}
      <section className="hero-dark">
        <div className="hero-dark-inner">
          <div>
            <h1>
              Review requests that sound like{' '}
              <em>you wrote them</em> — because they know the job.
            </h1>
            <p className="hero-dark-sub">
              Your Customer Service agent reads from ProjectCheckin&apos;s data library and your job details and writes a message that sounds like it came from you personally. Then your agent handles the replies, too. Complaints or concerns escalate to you immediately — your AI agent pauses and waits.
            </p>
            <div className="hero-define-dark">
              <strong>What is an AI Review Request Agent?</strong> An AI agent that reads your check-in data — customer name, address, and what was done — and writes a personalized review request ready to send in one tap. Handles replies automatically; escalates complaints to you immediately.
            </div>
          </div>

          {/* Hero iMessage preview */}
          <div className="imsg-wrap">
            <div className="imsg-header">
              <div className="imsg-avatar">MP</div>
              <div className="imsg-contact-name">Mike Peterson</div>
              <div className="imsg-contact-sub">Text Message · 147 Clearwater Dr</div>
            </div>
            <div className="imsg-body">
              <div className="imsg-event-bar">
                <span className="imsg-event-dot" />
                Job published — AI agent activated
              </div>
              <div className="imsg-row out">
                <div className="imsg-row-wrap">
                  <div className="imsg-sender-label">Your AI agent sent</div>
                  <div className="imsg-bubble out">
                    <strong>Mike</strong> — really appreciated the trust you put in us for the roof at Clearwater. Hope you love the result. If you have a moment: [review link]<br /><br />
                    — Ridgeline Roofing
                  </div>
                </div>
              </div>
              <div className="imsg-row in">
                <div className="imsg-row-wrap">
                  <div className="imsg-bubble in">Do you warranty this work?</div>
                </div>
              </div>
              <div className="imsg-row out">
                <div className="imsg-row-wrap">
                  <div className="imsg-bubble out">Yes — 2-year labor warranty. Your Clearwater project is fully covered.</div>
                </div>
              </div>
              <div className="imsg-agent-typing">
                <div className="imsg-agent-typing-label">Customer Service Agent is typing…</div>
                <div className="imsg-agent-typing-bub">
                  <span className="imsg-t-dot" />
                  <span className="imsg-t-dot" />
                  <span className="imsg-t-dot" />
                </div>
              </div>
            </div>
            <div className="imsg-note">
              <span className="imsg-note-icon">⚑</span>
              Complaints escalate to you immediately — your AI agent pauses and waits
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <div className="hiw-section">
        <div className="section-label">How it works</div>
        <h2 className="section-title">Personalized in seconds. Sent in one tap.</h2>
        <p className="hiw-sub">Your AI review agent reads every job on file — customer name, address, trade, and what was done — and writes a message that sounds like it came from you personally.</p>
        <div className="step-cards">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="step-card">
              <div className="sc-num">{n}</div>
              <div className="sc-title">{title}</div>
              <p className="sc-desc">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* When customers write back */}
      <section className="convo-section">
        <div className="convo-inner">
          <div>
            <div className="section-label" style={{ color: 'rgba(249,115,22,0.75)' }}>When customers write back</div>
            <h2 className="section-title" style={{ color: '#fff' }}>Your AI agent keeps the conversation going.</h2>
            <p className="hiw-sub" style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem', maxWidth: '460px', marginBottom: '36px' }}>
              When a homeowner replies with a question, your AI agent answers it — using your job record and business profile. Think of it as a customer relations employee who knows every job, never sleeps, and costs a fraction of any full-time hire.
            </p>
            <ul className="value-list">
              {CONVO_BULLETS.map(({ title, body }) => (
                <li key={title}>
                  <div className="vl-bar" />
                  <div className="vl-text" style={{ color: 'rgba(255,255,255,0.82)' }}>
                    <strong style={{ color: '#fff' }}>{title}</strong>
                    {body}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Extended iMessage thread */}
          <div className="imsg-wrap">
            <div className="imsg-header">
              <div className="imsg-avatar">MP</div>
              <div className="imsg-contact-name">Mike Peterson</div>
              <div className="imsg-contact-sub">Text Message · 147 Clearwater Dr</div>
            </div>
            <div className="imsg-body">
              <div className="imsg-event-bar">
                <span className="imsg-event-dot" />
                Job published — your AI agent handles the conversation
              </div>
              <div className="imsg-row out">
                <div className="imsg-row-wrap">
                  <div className="imsg-sender-label">Your AI agent sent</div>
                  <div className="imsg-bubble out">
                    <strong>Mike</strong> — really appreciated the trust you put in us for the roof at Clearwater. Hope you love the result. A Google review goes a long way for us: [review link]<br /><br />
                    — Ridgeline Roofing
                  </div>
                </div>
              </div>
              <div className="imsg-row in">
                <div className="imsg-row-wrap">
                  <div className="imsg-bubble in">Looks great. Do you warranty this work? Want to make sure I&apos;m covered if anything comes up.</div>
                </div>
              </div>
              <div className="imsg-row out">
                <div className="imsg-row-wrap">
                  <div className="imsg-sender-label">Your AI agent sent</div>
                  <div className="imsg-bubble out">Yes — Ridgeline Roofing offers a 2-year labor warranty on all work. Your Clearwater project is fully covered. Any issue, just call us and we&apos;ll make it right.</div>
                </div>
              </div>
              <div className="imsg-row in">
                <div className="imsg-row-wrap">
                  <div className="imsg-bubble in">Perfect. I&apos;ll go leave that review right now.</div>
                </div>
              </div>
              <div className="imsg-row out">
                <div className="imsg-row-wrap">
                  <div className="imsg-bubble out">That means a lot — thank you, Mike. It was a pleasure working with you.</div>
                  <div className="imsg-read">Read</div>
                </div>
              </div>
              <div className="imsg-agent-typing">
                <div className="imsg-agent-typing-label">Customer Service Agent is typing…</div>
                <div className="imsg-agent-typing-bub">
                  <span className="imsg-t-dot" />
                  <span className="imsg-t-dot" />
                  <span className="imsg-t-dot" />
                </div>
              </div>
            </div>
            <div className="imsg-note">
              <span className="imsg-note-icon">⚑</span>
              Complaints or disputes are flagged to you immediately — your AI agent pauses and waits for your response
            </div>
          </div>
        </div>
      </section>

      {/* What makes it different */}
      <section className="detail-section">
        <div className="detail-inner">
          <div className="detail-copy">
            <div className="section-label">What makes it different</div>
            <h2 className="section-title">Generic templates get ignored.<br />Personalized messages get reviews.</h2>
            <p className="detail-sub">
              A message that says &quot;Mike — we appreciated the trust you put in us for the roof at Clearwater&quot; lands completely differently than &quot;Hi [Name], we hope you loved your recent service.&quot; The AI writes the former, automatically, for every job.
            </p>
            <ul className="value-list">
              {WHAT_DIFFERENT.map(({ title, body }) => (
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

          {/* Message card example */}
          <div className="message-card">
            <div className="mc-header">
              <div className="mc-job">
                Exterior repaint — Lakeway, TX
                <span>Customer: Sandra L. · Painting</span>
              </div>
              <div className="mc-ai-tag">AI Draft</div>
            </div>
            <div className="mc-body">
              <div className="mc-to">Draft · To: Sandra L.</div>
              <div className="mc-bubble">
                <strong>Sandra</strong> — really glad we could get that exterior done before the summer heat. Hope the Alabaster looks exactly how you imagined it. If you have a moment, a Google review means more to a small business than most people realize: [review link]<br /><br />
                Don&apos;t hesitate to reach out if anything needs attention.<br />
                — Cedar &amp; Stone Painting
              </div>
              <div className="mc-note">
                <span className="mc-note-dot" />
                Edit anything before sending — the draft is yours. Add a photo, change the tone, or send it exactly as written.
              </div>
              <div className="mc-actions">
                <div className="mc-btn text">Send Text</div>
                <div className="mc-btn email">Send Email</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Generic vs. Personalized */}
      <div className="compare-section">
        <div className="section-label">Generic vs. personalized</div>
        <h2 className="section-title">The message that gets read<br />is the one about their job.</h2>
        <div className="compare-grid">
          <div className="compare-col generic">
            <div className="compare-col-header">Generic review request template</div>
            <div className="compare-col-body">
              <div className="compare-msg">
                Hi [Name], thank you for choosing our company for your recent service. We hope you were satisfied with our work. If you have a moment, please leave us a review on Google. We really appreciate your feedback. Thanks again for your business!
              </div>
              <div className="compare-verdict">Reads like it was sent to 500 people — because it was. Most homeowners delete it before they finish the first sentence.</div>
            </div>
          </div>
          <div className="compare-col personalized">
            <div className="compare-col-header">AI Review Request Agent</div>
            <div className="compare-col-body">
              <div className="compare-msg">
                <strong>Sandra</strong> — really glad we could get that exterior done before the summer heat. Hope the Alabaster looks exactly how you imagined it. If you have a moment, a Google review means more to a small business than most people realize: [link]<br /><br />
                Don&apos;t hesitate if anything needs attention. — Cedar &amp; Stone
              </div>
              <div className="compare-verdict">Reads like a real person wrote it about her house. Homeowners who read this actually leave reviews.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Strip */}
      <div className="stat-strip">
        <div>
          <div className="stat-number"><em>81</em>%</div>
          <div className="stat-desc">of consumers read reviews before contacting a local business for the first time.</div>
          <div className="stat-source">BrightLocal, 2024</div>
        </div>
        <div className="stat-divider" />
        <div>
          <div className="stat-number"><em>88</em>%</div>
          <div className="stat-desc">of people who search locally for a service business engage within 24 hours.</div>
          <div className="stat-source">Think with Google</div>
        </div>
      </div>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-label">Common questions</div>
        <h2 className="section-title">How does the AI Review Request Agent work?</h2>
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
            <Link href="/features/ai-copywriter" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              AI Copywriter Agent
            </Link>
            <Link href="/features/review-requests" className="explore-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              Review Requests
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
          <p>Every job you capture today becomes context your AI review agent uses from day one — customer names, job details, addresses, everything. Start now and your agent hits the ground running.</p>
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
