'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import '@/styles/dashboard.css'

function IcoCheckin() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/>
    </svg>
  )
}
function IcoJobs() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 3h12M2 8h12M2 13h7"/>
    </svg>
  )
}
function IcoTeam() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="5" r="2.5"/>
      <path d="M1 14c0-2.8 2.2-5 5-5M12 9v5M9.5 11.5h5"/>
    </svg>
  )
}
function IcoReporting() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 14V9M6 14V5M10 14V9M14 14V3"/>
    </svg>
  )
}
function IcoAccount() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/>
    </svg>
  )
}
function IcoSignOut() {
  return (
    <svg className="db-nav-ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M11 10l4-4-4-4M15 6H6M7 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4"/>
    </svg>
  )
}
function IcoMoon() {
  return (
    <svg className="db-icon-moon" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 9a6 6 0 1 1-7-7 4.5 4.5 0 0 0 7 7z"/>
    </svg>
  )
}
function IcoSun() {
  return (
    <svg className="db-icon-sun" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="7" cy="7" r="3"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M3.05 3.05l1.06 1.06M9.89 9.89l1.06 1.06M3.05 10.95l1.06-1.06M9.89 4.11l1.06-1.06"/>
    </svg>
  )
}

interface Props {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export default function DashboardShell({ title, children, action }: Props) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  // Sync theme with localStorage so it persists across pages
  useEffect(() => {
    const saved = localStorage.getItem('db-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('db-theme', theme)
  }, [theme])

  const userName = session?.user?.name || session?.user?.email || 'User'
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
  const planTier = (session?.user as any)?.planTier as string | undefined
  const planLabel = planTier
    ? planTier.charAt(0).toUpperCase() + planTier.slice(1) + ' Plan'
    : 'Free Plan'

  const isOwner = session?.user?.role === 'OWNER'
  const canPublish = isOwner || session?.user?.role === 'ADMIN'

  const navItem = (href: string) =>
    `db-nav-item${pathname === href || pathname?.startsWith(href + '/') ? ' active' : ''}`

  return (
    <div className="db-root">
      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="db-logo-img" src="/logo.png" alt="ProjectCheckin logo" />
          <span className="db-logo-name">ProjectCheckin</span>
        </div>

        <nav className="db-sidebar-nav">
          <span className="db-nav-label">Workspace</span>

          <Link className="db-nav-item" href="/check-in">
            <IcoCheckin />
            Check-In
          </Link>

          <Link className={navItem('/dashboard')} href="/dashboard">
            <IcoJobs />
            Jobs
          </Link>

          {canPublish && (
            <Link className={navItem('/dashboard/team')} href="/dashboard/team">
              <IcoTeam />
              Team
            </Link>
          )}

          <span className="db-nav-label" style={{ marginTop: 8 }}>Analytics</span>

          {isOwner && (
            <Link className={navItem('/reporting')} href="/reporting">
              <IcoReporting />
              Reporting
            </Link>
          )}

          <span className="db-nav-label" style={{ marginTop: 8 }}>Settings</span>

          {isOwner && (
            <Link className={navItem('/account')} href="/account">
              <IcoAccount />
              Account
            </Link>
          )}

          <button className="db-nav-item" onClick={() => signOut()}>
            <IcoSignOut />
            Sign Out
          </button>
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-avatar">{userInitials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="db-avatar-name">{userName}</div>
            <div className="db-avatar-plan">{planLabel}</div>
          </div>
          <button
            className="db-theme-toggle"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            title="Toggle theme"
          >
            <IcoMoon />
            <IcoSun />
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────────────────────── */}
      <div className="db-main">
        <div className="db-topbar">
          <h1 className="db-page-title">{title}</h1>
          {action && <div className="db-topbar-right">{action}</div>}
        </div>
        <div className="db-shell-content">
          {children}
        </div>
      </div>
    </div>
  )
}
