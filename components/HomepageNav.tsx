'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomepageNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-200"
      style={{
        background: scrolled ? 'rgba(255,255,255,0.96)' : '#ffffff',
        backdropFilter: scrolled ? 'blur(8px)' : 'none',
        boxShadow: '0 1px 0 rgba(14,165,233,0.12)',
      }}
    >
      <div className="max-w-[1160px] mx-auto px-12 py-4 flex items-center justify-between">
        <Link href="/" style={{ color: '#0C4A6E', fontWeight: 700, fontSize: '20px', textDecoration: 'none' }}>
          ProjectCheckin
        </Link>
        <div className="flex items-center gap-6">
          <Link href="#how" style={{ color: '#4A7FA0', fontSize: '15px', textDecoration: 'none' }}>
            How It Works
          </Link>
          <Link href="#pricing" style={{ color: '#4A7FA0', fontSize: '15px', textDecoration: 'none' }}>
            Pricing
          </Link>
          <Link href="/auth/signin" style={{ color: '#4A7FA0', fontSize: '15px', textDecoration: 'none' }}>
            Sign In
          </Link>
          <Link
            href="/auth/register"
            style={{
              background: '#F97316',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '15px',
              padding: '10px 20px',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Start Free
          </Link>
        </div>
      </div>
    </nav>
  )
}
