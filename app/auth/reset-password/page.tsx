'use client'

export const dynamic = "force-dynamic";
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(true)

  useEffect(() => {
    let isMounted = true

    const validateToken = async () => {
      if (!token) {
        if (!isMounted) return
        setIsTokenValid(false)
        setIsValidating(false)
        return
      }

      try {
        const res = await fetch(
          `/api/auth/reset-password/validate?token=${encodeURIComponent(token)}`
        )
        const data = await res.json()

        if (!isMounted) return

        if (data?.valid && data?.email) {
          setEmail(data.email)
          setIsTokenValid(true)
        } else {
          setIsTokenValid(false)
        }
      } catch {
        if (!isMounted) return
        setIsTokenValid(false)
      } finally {
        if (!isMounted) return
        setIsValidating(false)
      }
    }

    validateToken()

    return () => {
      isMounted = false
    }
  }, [token])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setIsError(false)

    if (!token || !isTokenValid) {
      setIsError(true)
      setMessage('Missing or invalid reset token.')
      return
    }

    if (password !== confirmPassword) {
      setIsError(true)
      setMessage('Passwords do not match.')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok || !data?.success) {
        setIsError(true)
        setMessage(data?.error || 'Failed to reset password.')
      } else {
        setIsError(false)
        setMessage('Your password has been reset. You can now sign in.')
      }
    } catch {
      setIsError(true)
      setMessage('Failed to reset password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-sm text-gray-600 mb-6">
          Enter a new password for your account.
        </p>

        {isValidating ? (
          <p className="text-sm text-gray-600 mb-4">Validating reset link...</p>
        ) : !isTokenValid ? (
          <p className="text-sm text-red-600 mb-4">This reset link is invalid or expired.</p>
        ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
              {email || 'Unknown'}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        {message && (
          <p className={`text-sm mt-4 ${isError ? 'text-red-600' : 'text-green-700'}`}>
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
