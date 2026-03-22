"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

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
  { label: 'Weak — add a capital or number',  color: '#DC2626', bars: 1 },
  { label: 'Fair — add a number or symbol',   color: '#D97706', bars: 2 },
  { label: 'Good',                             color: '#0EA5E9', bars: 3 },
  { label: 'Strong',                           color: '#059669', bars: 4 },
]

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

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "invalid" | "valid">("loading")
  const [email, setEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("USER")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [pwScore, setPwScore] = useState(0)
  const [pwTouched, setPwTouched] = useState(false)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setStatus("invalid")
        return
      }

      const res = await fetch(`/api/invitations/validate?token=${token}`)
      const data = await res.json()

      if (!data.valid) {
        setStatus("invalid")
      } else {
        setEmail(data.email)
        setInviteRole(data.role || "USER")
        setStatus("valid")
      }
    }

    validateInvite()
  }, [token])

  const handlePasswordChange = (v: string) => {
    setPassword(v)
    setPwTouched(v.length > 0)
    setPwScore(getPasswordScore(v))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName.trim() || !lastName.trim()) {
      setError("Please enter your first and last name.")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, firstName: firstName.trim(), lastName: lastName.trim() }),
    })

    const data = await res.json()

    if (!data.success) {
      setError(data.error || "Failed to accept invitation.")
      setSubmitting(false)
      return
    }

    // Auto sign-in and redirect based on role
    const login = await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirect: false,
    })

    if (!login?.error) {
      const destination = inviteRole === "USER" ? "/check-in" : "/dashboard"
      router.push(destination)
    } else {
      setError("Account created but sign-in failed. Please sign in manually.")
      setSubmitting(false)
    }
  }

  if (status === "loading") {
    return <p className="text-center mt-10 text-gray-500">Checking invitation...</p>
  }
  if (status === "invalid") {
    return (
      <main className="flex justify-center mt-16 px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-lg font-semibold text-gray-900 mb-2">Invitation not found</p>
          <p className="text-sm text-gray-500">This link may have expired or already been used.</p>
        </div>
      </main>
    )
  }

  const scoreInfo = pwScore > 0 ? SCORE_CONFIG[pwScore - 1] : null

  return (
    <main className="flex justify-center mt-10 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-6 bg-white rounded-lg shadow" noValidate>
        <div className="mb-2">
          <h2 className="text-xl font-bold text-gray-900">Set up your account</h2>
          <p className="text-sm text-gray-500 mt-1">You were invited to join. Create a password to get started.</p>
        </div>

        {/* Email — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            className="w-full p-3 border rounded bg-gray-100 text-gray-500 text-sm"
            value={email ? email.toLowerCase() : ''}
            readOnly
          />
        </div>

        {/* Name row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              className="w-full p-3 border rounded text-sm"
              placeholder="Tom"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              className="w-full p-3 border rounded text-sm"
              placeholder="Wilson"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full p-3 pr-11 border rounded text-sm"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>

          {pwTouched && (
            <div className="mt-2">
              {/* Strength bars */}
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors"
                    style={{
                      backgroundColor: (scoreInfo && i <= scoreInfo.bars)
                        ? scoreInfo.color
                        : '#E5E7EB',
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: pwScore === 0 ? '#DC2626' : (scoreInfo?.color ?? '#6B7280') }}>
                {pwScore === 0
                  ? 'Too short — minimum 8 characters'
                  : scoreInfo?.label}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            className="w-full p-3 border rounded text-sm"
            placeholder="Re-enter password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 min-h-[44px]"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </main>
  )
}
