"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const token = searchParams.get("token")
  const [status, setStatus] = useState<"loading" | "invalid" | "valid">("loading")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState("")

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
        setStatus("valid")
      }
    }

    validateInvite()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const res = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, firstName, lastName }),
    })

    const data = await res.json()

    if (!data.success) {
      setError(data.error || "Failed to accept invitation")
      return
    }

    // Auto sign-in and redirect
    const login = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (!login?.error) {
      router.push("/dashboard")
    } else {
      setError("Account created but failed to sign in. Please try signing in manually.")
    }
  }

  if (status === "loading") return <p className="text-center mt-10">Checking invitation...</p>
  if (status === "invalid") return <p className="text-center mt-10">Invalid or expired invitation.</p>

  return (
    <main className="flex justify-center mt-10">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold text-center">Invitation Status</h2>
        <p className="text-center">Invitation found for {email}</p>

        <label className="text-sm font-medium">Email</label>
        <input
          type="email"
          className="w-full p-3 border rounded bg-gray-100"
          value={email ? email.toLowerCase() : ''}
          readOnly
        />

        <label className="text-sm font-medium">First Name</label>
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <label className="text-sm font-medium">Last Name</label>
        <input
          type="text"
          className="w-full p-3 border rounded"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <label className="text-sm font-medium">Password</label>
        <input
          type="password"
          className="w-full p-3 border rounded"
          placeholder="Create password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label className="text-sm font-medium">Confirm Password</label>
        <input
          type="password"
          className="w-full p-3 border rounded"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded-lg">
          Create Account
        </button>

        {error && <p className="text-center text-red-600">{error}</p>}
      </form>
    </main>
  )
}