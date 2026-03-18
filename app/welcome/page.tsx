'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function WelcomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1628' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Figtree:wght@400;500;600&display=swap');

        .wlc-root * { box-sizing: border-box; }

        .wlc-hero {
          background: #0B1628;
          padding: 72px 24px 64px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .wlc-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .wlc-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(245,158,11,0.12);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 100px;
          padding: 6px 16px;
          font-family: 'Figtree', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #F59E0B;
          letter-spacing: 0.02em;
          margin-bottom: 28px;
        }

        .wlc-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #F59E0B;
          flex-shrink: 0;
        }

        .wlc-h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(32px, 5vw, 52px);
          font-weight: 600;
          color: #F8FAFC;
          line-height: 1.15;
          margin: 0 0 20px;
          letter-spacing: -0.02em;
        }

        .wlc-h1 em {
          font-style: italic;
          color: #F59E0B;
        }

        .wlc-sub {
          font-family: 'Figtree', sans-serif;
          font-size: 17px;
          color: #94A3B8;
          line-height: 1.6;
          max-width: 520px;
          margin: 0 auto 40px;
        }

        .wlc-cta-primary {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #F59E0B;
          color: #0B1628;
          font-family: 'Figtree', sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 15px 32px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
          letter-spacing: -0.01em;
        }

        .wlc-cta-primary:hover {
          background: #FBBF24;
          transform: translateY(-1px);
        }

        .wlc-cta-secondary {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Figtree', sans-serif;
          font-size: 14px;
          color: #64748B;
          text-decoration: none;
          margin-top: 16px;
          transition: color 0.15s;
        }

        .wlc-cta-secondary:hover {
          color: #94A3B8;
        }

        .wlc-body {
          background: #F8FAFC;
          padding: 64px 24px 80px;
        }

        .wlc-inner {
          max-width: 720px;
          margin: 0 auto;
        }

        .wlc-section-label {
          font-family: 'Figtree', sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94A3B8;
          margin-bottom: 28px;
        }

        .wlc-steps {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 48px;
        }

        .wlc-step {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          background: #fff;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 24px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .wlc-step:hover {
          border-color: #CBD5E1;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .wlc-step-num {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #0B1628;
          color: #F59E0B;
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .wlc-step-content {
          flex: 1;
        }

        .wlc-step-title {
          font-family: 'Fraunces', serif;
          font-size: 18px;
          font-weight: 600;
          color: #0F172A;
          margin: 0 0 6px;
          letter-spacing: -0.01em;
        }

        .wlc-step-desc {
          font-family: 'Figtree', sans-serif;
          font-size: 14px;
          color: #64748B;
          line-height: 1.55;
          margin: 0;
        }

        .wlc-divider {
          border: none;
          border-top: 1px solid #E2E8F0;
          margin: 0 0 48px;
        }

        .wlc-action-row {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .wlc-action-cta {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #0B1628;
          color: #fff;
          font-family: 'Figtree', sans-serif;
          font-size: 16px;
          font-weight: 600;
          padding: 16px 36px;
          border-radius: 10px;
          text-decoration: none;
          transition: background 0.15s, transform 0.15s;
          letter-spacing: -0.01em;
        }

        .wlc-action-cta:hover {
          background: #1E293B;
          transform: translateY(-1px);
        }

        .wlc-action-links {
          display: flex;
          gap: 24px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .wlc-action-link {
          font-family: 'Figtree', sans-serif;
          font-size: 14px;
          color: #3B82F6;
          text-decoration: none;
        }

        .wlc-action-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 480px) {
          .wlc-hero { padding: 56px 20px 48px; }
          .wlc-step { padding: 18px; gap: 14px; }
          .wlc-body { padding: 48px 20px 64px; }
        }
      `}</style>

      <div className="wlc-root">
        {/* Hero */}
        <section className="wlc-hero">
          <div className="wlc-badge">
            <span className="wlc-badge-dot" />
            Account active
          </div>
          <h1 className="wlc-h1">
            Welcome, <em>{firstName}.</em><br />
            You&rsquo;re ready to go.
          </h1>
          <p className="wlc-sub">
            Every job your crew completes from here forward builds your presence on Google — automatically, without writing a word.
          </p>
          <div>
            <Link href="/dashboard" className="wlc-cta-primary">
              Get started
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="wlc-body">
          <div className="wlc-inner">
            <p className="wlc-section-label">How it works</p>

            <div className="wlc-steps">
              <div className="wlc-step">
                <div className="wlc-step-num">1</div>
                <div className="wlc-step-content">
                  <p className="wlc-step-title">Your crew checks in after each job</p>
                  <p className="wlc-step-desc">
                    Tap "New Check-In," add a few photos and the job address, and submit. Takes under 30 seconds from the job site.
                  </p>
                </div>
              </div>

              <div className="wlc-step">
                <div className="wlc-step-num">2</div>
                <div className="wlc-step-content">
                  <p className="wlc-step-title">Each job becomes a public page on Google</p>
                  <p className="wlc-step-desc">
                    Publish the check-in from your dashboard and it becomes a search-indexed page — city, service type, and photos.
                  </p>
                </div>
              </div>

              <div className="wlc-step">
                <div className="wlc-step-num">3</div>
                <div className="wlc-step-content">
                  <p className="wlc-step-title">People searching nearby find and call you</p>
                  <p className="wlc-step-desc">
                    Track page views, phone taps, and website clicks on every job from your Reporting tab. Your history builds over time — more jobs means more search coverage.
                  </p>
                </div>
              </div>
            </div>

            <hr className="wlc-divider" />

            <div className="wlc-action-row">
              <Link href="/dashboard" className="wlc-action-cta">
                Get started
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <div className="wlc-action-links">
                <Link href="/dashboard/team" className="wlc-action-link">Invite your team</Link>
                <Link href="/dashboard" className="wlc-action-link">Go to dashboard</Link>
                <Link href="/account" className="wlc-action-link">Account settings</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
