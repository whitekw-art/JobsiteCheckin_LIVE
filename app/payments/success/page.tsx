'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

const POLL_INTERVAL_MS = 2000
const MAX_ATTEMPTS = 10 // ~20 seconds

function PaymentSuccessInner() {
  const { update, status } = useSession()
  const searchParams = useSearchParams()
  const attempts = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated' && !restoredRef.current) {
      const sessionId = searchParams.get('session_id')

      if (sessionId) {
        restoredRef.current = true
        fetch(`/api/auth/restore?session_id=${encodeURIComponent(sessionId)}`)
          .then(async (res) => {
            if (res.ok) {
              await update()
              // status changes to 'authenticated', re-triggers this effect
            } else {
              window.location.href = '/auth/signin?callbackUrl=/dashboard'
            }
          })
          .catch(() => {
            window.location.href = '/auth/signin?callbackUrl=/dashboard'
          })
      } else {
        timerRef.current = setTimeout(() => {
          window.location.href = '/auth/signin?callbackUrl=/dashboard'
        }, 3000)
      }

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }

    if (status !== 'authenticated') return

    async function checkPlanTier() {
      try {
        const res = await fetch('/api/billing/plan-status')
        const data = await res.json()

        if (data.planTier) {
          await update()
          window.location.href = '/dashboard'
          return
        }
      } catch {
        // ignore fetch errors, keep polling
      }

      attempts.current += 1

      if (attempts.current >= MAX_ATTEMPTS) {
        await update()
        window.location.href = '/dashboard'
        return
      }

      timerRef.current = setTimeout(checkPlanTier, POLL_INTERVAL_MS)
    }

    timerRef.current = setTimeout(checkPlanTier, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>
      <div style={{ textAlign: 'center', padding: '24px' }}>
        <p style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
          Setting up your account…
        </p>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          This takes just a moment.
        </p>
      </div>
    </main>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
      }}>
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <p style={{ fontSize: '18px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' }}>
            Setting up your account…
          </p>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            This takes just a moment.
          </p>
        </div>
      </main>
    }>
      <PaymentSuccessInner />
    </Suspense>
  )
}
