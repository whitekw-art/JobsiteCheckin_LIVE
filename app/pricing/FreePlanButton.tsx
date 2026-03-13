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
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
    >
      {loading ? 'Setting up your account...' : 'Continue with free plan'}
    </button>
  )
}
