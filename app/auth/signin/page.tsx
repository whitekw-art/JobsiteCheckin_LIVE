'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import '@/styles/register.css'

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

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(155deg, #0C4A6E 0%, #075985 40%, #0369A1 70%, #0EA5E9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      position: 'relative',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          radial-gradient(circle at 18% 18%, rgba(56,189,248,0.18) 0%, transparent 48%),
          radial-gradient(circle at 85% 75%, rgba(249,115,22,0.13) 0%, transparent 42%),
          repeating-linear-gradient(-45deg, transparent, transparent 28px, rgba(255,255,255,0.025) 28px, rgba(255,255,255,0.025) 29px)
        `,
        pointerEvents: 'none',
      }} />

      <div style={{
        background: '#fff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '460px',
        padding: '40px 36px 36px',
        boxShadow: '0 24px 80px rgba(12,74,110,0.3)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#0EA5E9',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#0C4A6E', letterSpacing: '-0.01em' }}>
            ProjectCheckin
          </span>
        </div>

        {/* Header */}
        <div className="reg-eyebrow">Welcome back</div>
        <h1 className="reg-title">Sign in to ProjectCheckin</h1>
        <p className="reg-already">
          Need an account?{' '}
          <Link href="/auth/register">Create one now</Link>
        </p>

        <form className="reg-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="reg-field">
            <label className="reg-label" htmlFor="si-email">Work email</label>
            <div className="reg-input-wrap">
              <input
                id="si-email"
                type="email"
                className="reg-input"
                placeholder="tom@wilsonsdoors.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="reg-field">
            <label className="reg-label" htmlFor="si-pw">Password</label>
            <div className="reg-input-wrap">
              <input
                id="si-pw"
                type={showPw ? 'text' : 'password'}
                className="reg-input reg-input-pw"
                placeholder="Your password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
          </div>

          {error && <div className="reg-error">{error}</div>}

          {/* Submit */}
          <div className="reg-submit-wrap">
            <button type="submit" className="reg-btn" disabled={loading}>
              {loading ? (
                <>
                  <svg className="reg-spinning" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0110 10" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Forgot password */}
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <Link
              href="/auth/forgot-password"
              style={{ fontSize: '13px', color: '#4B7A94', textDecoration: 'none' }}
            >
              Forgot password?
            </Link>
          </div>
        </form>

        <p className="reg-terms" style={{ marginTop: '24px' }}>
          <em>By signing in, you agree to our{' '}
          <Link href="/terms" target="_blank">Terms of Service</Link> and{' '}
          <Link href="/privacy" target="_blank">Privacy Policy</Link>.</em>
        </p>
      </div>
    </div>
  )
}
