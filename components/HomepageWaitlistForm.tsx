'use client'

import { useState, FormEvent } from 'react'

export default function HomepageWaitlistForm({ source, dark }: { source?: string; dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')
    setErrorMessage('')

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      })

      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        const data = await res.json()
        setErrorMessage(data.error || 'Something went wrong. Try again.')
        setStatus('error')
      }
    } catch {
      setErrorMessage('Something went wrong. Try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="flex items-center gap-3 py-3">
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#059669' }}
        >
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p style={{ color: dark ? '#ffffff' : '#0C4A6E', fontWeight: 500 }}>
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          required
          disabled={status === 'loading'}
          style={{
            flex: 1,
            padding: '14px 16px',
            borderRadius: '8px',
            border: dark ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(14,165,233,0.3)',
            background: dark ? 'rgba(255,255,255,0.15)' : '#ffffff',
            color: dark ? '#ffffff' : '#0C4A6E',
            fontSize: '16px',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={status === 'loading' || !email.trim()}
          style={{
            padding: '14px 28px',
            borderRadius: '8px',
            background: '#F97316',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '16px',
            border: 'none',
            cursor: status === 'loading' || !email.trim() ? 'not-allowed' : 'pointer',
            opacity: status === 'loading' || !email.trim() ? 0.6 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Submitting...' : 'Start Free'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 text-sm" style={{ color: '#ef4444' }}>{errorMessage}</p>
      )}
    </form>
  )
}
