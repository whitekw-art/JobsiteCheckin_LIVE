'use client'

import { useState } from 'react'
import Link from 'next/link'

export function GuideBreadcrumb() {
  return (
    <Link href="/help" style={{ fontSize: 12.5, color: 'var(--sky-text)', marginBottom: 16, display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none' }}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
      </svg>
      Help &amp; Support
    </Link>
  )
}

function Chev({ open, size = 16 }: { open: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginLeft: 'auto', color: 'var(--t3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Top-level collapsible section (h2-level) for guide pages.
export function GuideSection({
  title, defaultOpen = false, children,
}: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 22, paddingTop: 22 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)' }}>{title}</span>
        <Chev open={open} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: 16 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

// Nested collapsible subsection (h3-level) — used for per-platform breakdowns.
export function GuideSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0, margin: '18px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{title}</span>
        <Chev open={open} size={12} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .22s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: 8 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 12 }}>
      <span style={{ color: 'var(--t3)', fontWeight: 700, flexShrink: 0 }}>{n}.</span>
      <div>{children}</div>
    </div>
  )
}

export const guideP: React.CSSProperties = { fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 14px' }
export const guidePLast: React.CSSProperties = { ...guideP, marginBottom: 0 }
export const guideLink: React.CSSProperties = { color: 'var(--sky-text)', textDecoration: 'underline' }
export const guideStrong: React.CSSProperties = { color: 'var(--t1)' }
export const guideHint: React.CSSProperties = { fontSize: 12.5, color: 'var(--t3)', fontStyle: 'italic', marginTop: 4 }
