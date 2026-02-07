'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
    } catch {
      // Always show success to avoid revealing account existence.
    } finally {
      setSubmitted(true)
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter your email. If it exists, we’ll send a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="you@example.com"
              required
              disabled={submitted}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || submitted}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-60"
          >
            {isSubmitting ? 'Sending...' : submitted ? 'Email Sent' : 'Send Reset Link'}
          </button>
        </form>

        {submitted && (
          <p className="text-sm text-green-700 mt-4">
            If the email exists, we sent a reset link.
          </p>
        )}
      </div>
    </main>
  )
}
