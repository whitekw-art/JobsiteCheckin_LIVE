'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import '@/styles/dashboard.css'

interface CheckIn {
  id: string
  installer: string
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  doorType?: string | null
  notes?: string | null
  timestamp: string
  isPublic: boolean
  photoUrls?: string[]
  beforePhotoUrl?: string | null
  afterPhotoUrl?: string | null
}

export default function MyJobsPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/my-jobs')
      .then((r) => r.json())
      .then((data) => {
        setCheckIns(data.checkIns || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <DashboardShell title="My Jobs">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {loading ? (
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Loading...</p>
        ) : checkIns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
            <p style={{ fontSize: '0.95rem' }}>
              No jobs yet. Submit your first check-in to see it here.
            </p>
            <Link
              href="/check-in"
              style={{
                marginTop: 16,
                display: 'inline-block',
                color: 'var(--accent)',
                fontWeight: 600,
              }}
            >
              Go to Check-In
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {checkIns.map((c) => (
              <div
                key={c.id}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                {c.photoUrls && c.photoUrls.length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photoUrls[0]}
                    alt="Job photo"
                    style={{
                      width: 64,
                      height: 64,
                      objectFit: 'cover',
                      borderRadius: 6,
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 6,
                      flexShrink: 0,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--muted)',
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    >
                      <rect x="3" y="5" width="18" height="15" rx="2" />
                      <circle cx="14" cy="11" r="2" />
                      <path d="M3 17l4-4 3 3 3-3 5 5" />
                    </svg>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '0.92rem',
                      marginBottom: 2,
                      color: 'var(--fg)',
                    }}
                  >
                    {[c.street, c.city, c.state].filter(Boolean).join(', ') || 'No address'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 3 }}>
                    {c.doorType || 'No product'} &middot;{' '}
                    {new Date(c.timestamp).toLocaleDateString()}
                  </div>
                  {c.photoUrls && c.photoUrls.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {c.photoUrls.length} photo{c.photoUrls.length !== 1 ? 's' : ''}
                      {c.beforePhotoUrl && c.afterPhotoUrl
                        ? ' · Before & After'
                        : c.beforePhotoUrl
                        ? ' · Before tagged'
                        : c.afterPhotoUrl
                        ? ' · After tagged'
                        : ''}
                    </div>
                  )}
                </div>

                <Link
                  href={`/check-in?id=${c.id}`}
                  style={{
                    flexShrink: 0,
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid var(--border)',
                    color: 'var(--fg)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    background: 'var(--card)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
