'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

const MAX_ATTEMPTS = 12 // ~18 seconds total

export default function PaymentSuccessPage() {
  const { data: session, update } = useSession()
  const [attempts, setAttempts] = useState(0)

  // Kick off first refresh immediately on mount
  useEffect(() => {
    update()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const planTier = (session?.user as any)?.planTier

    if (planTier) {
      window.location.href = '/dashboard'
      return
    }

    if (attempts >= MAX_ATTEMPTS) {
      // Webhook too slow — go to dashboard anyway; onboarding modal handles the rest
      window.location.href = '/dashboard'
      return
    }

    const timer = setTimeout(async () => {
      await update()
      setAttempts(prev => prev + 1)
    }, 1500)

    return () => clearTimeout(timer)
  }, [session, attempts]) // eslint-disable-line react-hooks/exhaustive-deps

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
