'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

const POLL_INTERVAL_MS = 2000
const MAX_ATTEMPTS = 10 // ~20 seconds

export default function PaymentSuccessPage() {
  const { update } = useSession()
  const attempts = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    async function checkPlanTier() {
      try {
        const res = await fetch('/api/billing/plan-status')
        const data = await res.json()

        if (data.planTier) {
          // planTier confirmed in DB — refresh JWT then navigate
          await update()
          window.location.href = '/dashboard'
          return
        }
      } catch {
        // ignore fetch errors, keep polling
      }

      attempts.current += 1

      if (attempts.current >= MAX_ATTEMPTS) {
        // Give up waiting — go anyway, middleware will re-evaluate
        await update()
        window.location.href = '/dashboard'
        return
      }

      timerRef.current = setTimeout(checkPlanTier, POLL_INTERVAL_MS)
    }

    // Start first check after a short delay to give webhook time to fire
    timerRef.current = setTimeout(checkPlanTier, 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
