'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterClosedPage() {
  const router = useRouter()
  const [seconds, setSeconds] = useState(25)

  useEffect(() => {
    if (seconds <= 0) {
      router.push('/?modal=waitlist')
      return
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F9FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(14,165,233,0.1)',
        padding: '48px 40px',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
      }}>
        {/* Logo */}
        <Link href="/" style={{ fontWeight: 700, fontSize: '20px', color: '#0C4A6E', textDecoration: 'none', display: 'block', marginBottom: '32px' }}>
          ProjectCheckin
        </Link>

        {/* Heading */}
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0C4A6E', marginBottom: '12px', lineHeight: 1.2 }}>
          We&rsquo;re waitlist-only right now.
        </h1>
        <p style={{ fontSize: '16px', color: '#4A7FA0', marginBottom: '28px', lineHeight: 1.7 }}>
          ProjectCheckin isn&rsquo;t open for self-registration yet. Join the waitlist and you&rsquo;ll get exclusive insider updates as we approach launch — including a 72-hour window to lock in founding member pricing before anyone else.
        </p>

        {/* Waitlist CTA */}
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/?modal=waitlist"
            style={{
              display: 'inline-block',
              background: '#F97316',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              padding: '14px 28px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Join the Waitlist
          </Link>
        </div>

        {/* Redirect countdown */}
        <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px' }}>
          Redirecting to homepage in {seconds} second{seconds !== 1 ? 's' : ''}...
        </p>
        <Link href="/" style={{ fontSize: '14px', color: '#0EA5E9', textDecoration: 'underline' }}>
          or click here to go now
        </Link>
      </div>
    </div>
  )
}
