'use client'

import { FormEvent, useState, Suspense, useRef } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import '@/styles/register.css'

function getPasswordScore(pw: string): number {
  if (pw.length < 8) return 0
  const hasMixed = /[A-Z]/.test(pw) && /[a-z]/.test(pw)
  const hasNum   = /[0-9]/.test(pw)
  const hasSpec  = /[^A-Za-z0-9]/.test(pw)
  const variety  = [hasMixed, hasNum, hasSpec].filter(Boolean).length
  if (variety === 0) return 1
  if (variety === 1) return 2
  if (variety >= 2 && pw.length < 10 && !hasSpec) return 3
  return 4
}

const SCORE_CONFIG = [
  { cls: 'reg-bar--weak',   label: 'Weak — add a capital or number', color: '#DC2626' },
  { cls: 'reg-bar--fair',   label: 'Fair — add a number or symbol',  color: '#D97706' },
  { cls: 'reg-bar--good',   label: 'Good',                           color: '#0EA5E9' },
  { cls: 'reg-bar--strong', label: 'Strong',                         color: '#059669' },
]

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

function normalizeWebsite(v: string): string {
  const t = v.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('www.')) return `https://${t}`
  return `https://www.${t}`
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
      stroke="#7DD3FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function EyeOpen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function RegisterForm() {
  const [firstName,   setFirstName]   = useState('')
  const [lastName,    setLastName]    = useState('')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [phone,       setPhone]       = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [pwScore,     setPwScore]     = useState(0)
  const [pwTouched,   setPwTouched]   = useState(false)
  const [emailState,  setEmailState]  = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [error,       setError]       = useState<string | null>(null)
  const [submitting,  setSubmitting]  = useState(false)

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length === 0) return ''
    if (d.length < 4)  return `(${d}`
    if (d.length < 7)  return `(${d.slice(0,3)}) ${d.slice(3)}`
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  }

  const handlePasswordChange = (v: string) => {
    setPassword(v)
    setPwTouched(v.length > 0)
    setPwScore(getPasswordScore(v))
  }

  const handleEmailBlur = () => {
    if (!email) { setEmailState('idle'); return }
    setEmailState(isValidEmail(email.trim()) ? 'valid' : 'invalid')
  }

  const handleEmailChange = (v: string) => {
    setEmail(v)
    if (emailState === 'invalid' && isValidEmail(v.trim())) setEmailState('valid')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimFirst  = firstName.trim()
    const trimLast   = lastName.trim()
    const normEmail  = email.trim().toLowerCase()
    const trimPw     = password
    const trimPhone  = phone.trim()

    if (!trimFirst || !trimLast) {
      setError('Please enter your first and last name.')
      return
    }
    if (!normEmail || !isValidEmail(normEmail)) {
      setError('Please enter a valid email address.')
      setEmailState('invalid')
      return
    }
    if (trimPw.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: trimFirst,
          lastName:  trimLast,
          email:     normEmail,
          password:  trimPw,
          phone:     trimPhone || undefined,
        }),
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Registration failed. Please try again.')

      // Auto sign-in — password still in memory
      const result = await signIn('credentials', {
        email:    normEmail,
        password: trimPw,
        redirect: false,
      })

      if (result?.ok) {
        // Clear Stripe cache before navigating
        try {
          sessionStorage.clear()
          const stripeKeys: string[] = []
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const k = localStorage.key(i)
            if (k && /stripe|checkout|pricing/i.test(k)) stripeKeys.push(k)
          }
          stripeKeys.forEach(k => localStorage.removeItem(k))
        } catch { /* private browsing */ }
        window.location.href = '/pricing'
      } else {
        window.location.href = `/auth/signin?email=${encodeURIComponent(normEmail)}`
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.')
      setSubmitting(false)
    }
  }

  const scoreInfo = pwScore > 0 ? SCORE_CONFIG[pwScore - 1] : null

  return (
    <div className="reg-root">
      {/* ── LEFT PANEL ── */}
      <aside className="reg-left">
        <div className="reg-brand">
          <div className="reg-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="reg-brand-name">ProjectCheckin</span>
        </div>

        <h1 className="reg-headline">
          Every job your crew completes<br />
          <em>markets your business automatically.</em>
        </h1>

        <p className="reg-sub">
          Set up your account in under two minutes. Your first job page can be live on Google by end of day.
        </p>

        <ul className="reg-bullets">
          {[
            'Each completed job becomes a search-indexed page — automatically, no writing needed',
            'Your crew checks in from the field with photos — you get leads from Google',
            'Track every page view, phone tap, and website click generated from your job history',
            'Invite your entire team — unlimited workers on every plan',
          ].map((text, i) => (
            <li key={i}>
              <span className="reg-check"><CheckIcon /></span>
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div className="reg-trust">
          {[
            { icon: 'shield', label: 'No credit card required to start' },
            { icon: 'clock',  label: 'Free forever plan' },
            { icon: 'users',  label: 'Unlimited team members' },
          ].map(({ icon, label }) => (
            <div key={label} className="reg-trust-badge">
              {icon === 'shield' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#7DD3FC" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              )}
              {icon === 'clock' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#7DD3FC" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              )}
              {icon === 'users' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="#7DD3FC" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              )}
              {label}
            </div>
          ))}
        </div>

        {/* Stats bar — visible on desktop only via CSS */}
        <div className="reg-stats">
          {[
            { num: '76', pct: true,  desc: 'of local searches result in a call within 24 hours' },
            { num: '81', pct: true,  desc: 'of consumers check reviews before hiring a local business' },
            { num: '54', pct: true,  desc: 'of homeowners struggle to find a qualified contractor online' },
          ].map(({ num, pct, desc }) => (
            <div key={num} className="reg-stat">
              <div className="reg-stat-num">{num}{pct && <span>%</span>}</div>
              <div className="reg-stat-desc">{desc}</div>
            </div>
          ))}
        </div>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main className="reg-right">
        <div className="reg-form-wrap">
          <div className="reg-eyebrow">Get started free</div>
          <h2 className="reg-title">Create your account</h2>
          <p className="reg-already">Already have one? <Link href="/auth/signin">Sign in</Link></p>

          <form className="reg-form" onSubmit={handleSubmit} noValidate>

            {/* First + Last name */}
            <div className="reg-name-row">
              <div className="reg-field">
                <label className="reg-label" htmlFor="reg-first">First name</label>
                <div className="reg-input-wrap">
                  <input
                    id="reg-first"
                    type="text"
                    className="reg-input"
                    placeholder="Tom"
                    autoComplete="given-name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="reg-field">
                <label className="reg-label" htmlFor="reg-last">Last name</label>
                <div className="reg-input-wrap">
                  <input
                    id="reg-last"
                    type="text"
                    className="reg-input"
                    placeholder="Wilson"
                    autoComplete="family-name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="reg-email">Work email</label>
              <div className="reg-input-wrap">
                <input
                  id="reg-email"
                  type="email"
                  className={`reg-input ${
                    emailState === 'valid'   ? 'reg-input--success' :
                    emailState === 'invalid' ? 'reg-input--error'   : ''
                  }`}
                  style={{ paddingRight: emailState !== 'idle' ? '40px' : '14px' }}
                  placeholder="tom@wilsonsdoors.com"
                  autoComplete="email"
                  value={email}
                  onChange={e => handleEmailChange(e.target.value)}
                  onBlur={handleEmailBlur}
                  required
                />
                {emailState === 'valid' && (
                  <span className="reg-email-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#059669" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                )}
                {emailState === 'invalid' && (
                  <span className="reg-email-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#DC2626" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* Password */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="reg-pw">Password</label>
              <div className="reg-input-wrap">
                <input
                  id="reg-pw"
                  type={showPw ? 'text' : 'password'}
                  className="reg-input reg-input-pw"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="reg-pw-toggle"
                  onClick={() => setShowPw(s => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff /> : <EyeOpen />}
                </button>
              </div>
              {pwTouched && (
                <div className="reg-strength">
                  <div className="reg-strength-bars">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`reg-bar ${i <= pwScore && scoreInfo ? scoreInfo.cls : ''}`}
                      />
                    ))}
                  </div>
                  {pwScore === 0 && (
                    <span className="reg-strength-label" style={{ color: '#DC2626' }}>Too short — minimum 8 characters</span>
                  )}
                  {pwScore > 0 && scoreInfo && (
                    <span className="reg-strength-label" style={{ color: scoreInfo.color }}>{scoreInfo.label}</span>
                  )}
                </div>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="reg-field">
              <label className="reg-label" htmlFor="reg-phone">
                Phone <span className="reg-optional">Optional</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="reg-phone"
                  type="tel"
                  className="reg-input"
                  placeholder="(256) 555-0190"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                />
              </div>
              <span className="reg-hint">Never shared. Used for account notifications if provided.</span>
            </div>

            {/* Error */}
            {error && <div className="reg-error">{error}</div>}

            {/* Submit */}
            <div className="reg-submit-wrap">
              <button
                type="submit"
                className="reg-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg
                      className="reg-spinning"
                      width="18" height="18" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0110 10" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <>
                    Create Account
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="reg-footer-group">
            <p className="reg-next-step">Next: Choose your plan — Free, Pro, Elite, or Titan.</p>
            <p className="reg-no-cc">No credit card required to get started.</p>
            <p className="reg-terms">
              <em>By continuing, you agree to our{' '}
              <Link href="/terms" target="_blank">Terms of Service</Link> and{' '}
              <Link href="/privacy" target="_blank">Privacy Policy</Link>.</em>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
