'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const featLinks = [
  { href: '/features/local-job-pages',    label: 'Local Job Pages' },
  { href: '/features/gbp-post-generator', label: 'GBP Post Generator' },
  { href: '/features/before-after',       label: 'Before & After' },
  { href: '/features/review-requests',    label: 'Review Requests' },
  { href: '/features/portfolio',          label: 'Portfolio & Dashboard' },
]

export default function MarketingNav() {
  const [navOpen, setNavOpen]   = useState(false)
  const [featOpen, setFeatOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!navOpen && !featOpen) return
    const onClick = (e: MouseEvent) => {
      const nav = document.getElementById('nav-root')
      if (nav && !nav.contains(e.target as Node)) {
        setNavOpen(false)
        setFeatOpen(false)
      }
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [navOpen, featOpen])

  const closeAll = () => { setNavOpen(false); setFeatOpen(false) }

  return (
    <nav
      id="nav-root"
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E5E7EB',
      }}
    >
      <div className="nav-inner">
        <Link href="/" className="logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" className="logo-img" alt="ProjectCheckin logo" />
          ProjectCheckin
        </Link>

        <ul className={`nav-links${navOpen ? ' open' : ''}`}>
          <li>
            <Link href="/" className="nav-link" onClick={closeAll}>
              Home
            </Link>
          </li>
          <li className={`nav-feat-wrap${featOpen ? ' feat-open' : ''}`}>
            <button
              className="nav-feat-btn nav-link"
              onClick={() => setFeatOpen((o) => !o)}
              aria-expanded={featOpen}
            >
              Features
              <svg className="feat-arrow" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="2,3.5 5,6.5 8,3.5" />
              </svg>
            </button>
            <div className="feat-drop">
              <div className="feat-section-label">Features</div>
              {featLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`feat-item${pathname.startsWith(href) ? ' active' : ''}`}
                  onClick={closeAll}
                >
                  {label}
                </Link>
              ))}
              <div className="feat-divider" />
              <div className="feat-section-label">
                AI Agents <span className="feat-soon">Soon</span>
              </div>
              <Link href="/features/ai-copywriter" className="feat-item sub" onClick={closeAll}>
                AI Copywriter Agent
              </Link>
              <Link href="/features/ai-review-request" className="feat-item sub" onClick={closeAll}>
                AI Review Request Agent
              </Link>
            </div>
          </li>
          <li>
            <Link href="/pricing" className="nav-link" onClick={closeAll}>Pricing</Link>
          </li>
        </ul>

        <div className={`nav-right${navOpen ? ' open' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Link href="/auth/signin" className="btn-ghost nav-signin" onClick={closeAll}>Sign In /</Link>
          <Link href="/auth/register" className="btn-ghost" onClick={closeAll}>Register</Link>
          <a
            href="https://calendly.com/projectcheckin-/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-sm-link"
            onClick={closeAll}
          >
            Book a Demo
          </a>
        </div>

        <button
          className={`nav-hamburger${navOpen ? ' open' : ''}`}
          aria-label={navOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen((o) => !o)}
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  )
}
