'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

type State =
  | { kind: 'working' }
  | { kind: 'done'; purpose: 'primary' | 'backup'; email: string }
  | { kind: 'failed'; message: string }

function VerifyEmailInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [state, setState] = useState<State>({ kind: 'working' })
  // React runs effects twice in development. Without this the second pass
  // would consume a single-use token that the first pass had already spent,
  // and the page would report a valid link as invalid.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    if (!token) {
      setState({ kind: 'failed', message: 'This link is missing its confirmation code.' })
      return
    }

    ;(async () => {
      try {
        const res = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => null)
        if (!res.ok) {
          setState({ kind: 'failed', message: data?.error || 'This link is not valid.' })
          return
        }
        setState({ kind: 'done', purpose: data.purpose, email: data.email })
      } catch {
        setState({ kind: 'failed', message: 'Something went wrong confirming that address.' })
      }
    })()
  }, [token])

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F7FA', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ background: '#fff', border: '1px solid #E8ECF1', borderRadius: 14, padding: '32px 28px', maxWidth: 440, width: '100%', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        {state.kind === 'working' && (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-.2px' }}>Confirming your address…</h1>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: 0 }}>This only takes a moment.</p>
          </>
        )}

        {state.kind === 'done' && state.purpose === 'primary' && (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-.2px' }}>Sign-in email updated</h1>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>
              You now sign in with <strong style={{ color: '#0F172A' }}>{state.email}</strong>.
            </p>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your previous address has been kept as a backup, so it can still be used to reset your password.
              You will need to sign in again with the new address.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: 8, border: 'none', background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}
            >
              Sign in again
            </button>
          </>
        )}

        {state.kind === 'done' && state.purpose === 'backup' && (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-.2px' }}>Backup email added</h1>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
              <strong style={{ color: '#0F172A' }}>{state.email}</strong> can now be used to reset your password,
              so losing access to your main inbox will not lock you out.
            </p>
            <Link
              href="/account"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Back to your account
            </Link>
          </>
        )}

        {state.kind === 'failed' && (
          <>
            <h1 style={{ fontSize: 19, fontWeight: 700, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-.2px' }}>We could not confirm that address</h1>
            <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>{state.message}</p>
            <Link
              href="/account"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 20px', borderRadius: 8, background: '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
            >
              Back to your account
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  )
}
