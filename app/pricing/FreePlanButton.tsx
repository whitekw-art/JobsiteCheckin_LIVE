'use client'

import { useState } from 'react'

export default function FreePlanButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/select-free-plan', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.redirect) {
        // Force NextAuth to reissue the JWT cookie with updated planTier before navigating,
        // otherwise middleware still sees the old null planTier and redirects back to /pricing
        await fetch('/api/auth/session')
        window.location.href = data.redirect
      } else if (res.status === 401) {
        // Not signed in — send to register
        window.location.href = '/auth/register'
      } else {
        setLoading(false)
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="mt-2">
      <button
        onClick={handleClick}
        disabled={loading}
        style={{ background: 'linear-gradient(135deg, #F97316 0%, #EA6C0A 100%)', border: 'none' }}
        className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white font-semibold text-sm shadow-md hover:shadow-lg hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
              <path d="M12 2a10 10 0 0110 10"/>
            </svg>
            Setting up your account…
          </>
        ) : (
          'Continue with free plan'
        )}
      </button>
      <p className="text-xs text-gray-400 mt-2">No credit card required. Up to 5 published job pages.</p>
    </div>
  )
}
