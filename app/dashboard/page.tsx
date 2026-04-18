'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { geocodeJobAddress } from '@/lib/geocode'
import { slugify } from '@/lib/slugify'
import OnboardingModal from '@/components/OnboardingModal'
import '@/styles/dashboard.css'

interface CheckIn {
  id: string
  timestamp: string
  installer: string
  street?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  notes: string
  latitude?: number | null
  longitude?: number | null
  locationSource?: string | null
  doorType?: string | null
  isPublic: boolean
  photoUrls?: string[]
  homeCustomerName?: string | null
  homeCustomerPhone?: string | null
  homeCustomerEmail?: string | null
}

interface EditAddr {
  street: string
  city: string
  state: string
  zip: string
}

interface EditCustomer {
  name: string
  phones: Array<{ type: string; num: string }>
  emails: Array<{ type: string; addr: string }>
}

function validateForPublish(checkIn: CheckIn): { hardBlocked: boolean; warnings: string[] } {
  if (!checkIn.city || !checkIn.state) {
    return { hardBlocked: true, warnings: [] }
  }
  const warnings: string[] = []
  if ((checkIn.photoUrls?.length ?? 0) < 3) {
    warnings.push('Add at least 3 photos for best results (before, during, and after)')
  }
  if (!checkIn.notes?.trim()) {
    warnings.push('Add a job description — it helps your page rank better in Google')
  }
  if (checkIn.locationSource === 'DEVICE') {
    warnings.push("Verify the address — location was captured from the installer's device")
  }
  if (!checkIn.doorType) {
    warnings.push("The page title will show 'Job' instead of the door type")
  }
  return { hardBlocked: false, warnings }
}

function PublishModal({
  checkIn,
  warnings,
  blockingError,
  onConfirm,
  onClose,
  isPublishing,
}: {
  checkIn: CheckIn
  warnings: string[]
  blockingError?: string
  onConfirm: () => void
  onClose: () => void
  isPublishing: boolean
}) {
  const jobLabel = [
    checkIn.doorType,
    [checkIn.city, checkIn.state].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' \u2022 ')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          {warnings.length > 0 ? 'Before you publish\u2026' : 'Publish this job?'}
        </h2>
        {jobLabel && (
          <p className="text-sm text-gray-500 mt-1">{jobLabel}</p>
        )}

        {blockingError && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {blockingError}
          </div>
        )}

        {warnings.length > 0 ? (
          <>
            <ul className="mt-4 space-y-2">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="mt-0.5 shrink-0">&#9888;</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-gray-600">
              We recommend resolving these issues before publishing for the best results.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm text-gray-600">
            This job will be publicly visible once published.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="px-4 py-2 rounded text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 min-h-[44px]"
          >
            {warnings.length > 0 ? 'Go Back' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPublishing || !!blockingError}
            className="px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 min-h-[44px]"
          >
            {isPublishing
              ? 'Publishing\u2026'
              : warnings.length > 0
              ? 'Publish Anyway'
              : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SVG icons ────────────────────────────────────────────────────────────────

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
function IcoPlus() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M6 1v10M1 6h10"/>
    </svg>
  )
}
function IcoChevron() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2.5 4.5l4 4 4-4"/>
    </svg>
  )
}
function IcoPhoto() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="1" y="2" width="8" height="6.5" rx="1.2"/>
      <circle cx="6.5" cy="4.7" r="1.1"/>
      <path d="M1 7l2.5-2 2 1.5 1.5-1.5"/>
    </svg>
  )
}
function IcoCopy() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="1" y="3.5" width="6" height="6.5" rx="1.2"/>
      <path d="M4 3.5V2A1 1 0 0 1 5 1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8"/>
    </svg>
  )
}
function IcoDownload() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5.5 1v6.5M3 5l2.5 2.5L8 5M1 9.5h9"/>
    </svg>
  )
}
function IcoGbp() {
  return (
    <span style={{ fontSize: 10, fontWeight: 800, lineHeight: 1, letterSpacing: '-0.3px' }}>
      <span style={{ color: '#4285F4' }}>G</span>
    </span>
  )
}

function GbpPostModal({
  checkIn,
  publicUrl,
  onClose,
}: {
  checkIn: CheckIn
  publicUrl: string
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)

  const location = [checkIn.city, checkIn.state].filter(Boolean).join(', ')
  const jobType = checkIn.doorType || 'Job'
  const postText = [
    `${jobType} completed${location ? ` in ${location}` : ''}.`,
    checkIn.notes?.trim() ? checkIn.notes.trim() : null,
    `See the full job details and photos: ${publicUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  function handleCopy() {
    navigator.clipboard.writeText(postText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
        backdropFilter: 'blur(3px)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 14, maxWidth: 480, width: '100%',
          padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,.22)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          border: '1px solid var(--border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>Post to Google Business</div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Copy the text below, then open your Google Business Profile to create a new post.</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 4, lineHeight: 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div style={{
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', fontSize: 13, color: 'var(--t1)',
          lineHeight: 1.6, marginBottom: 14, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {postText}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleCopy}
            className="db-shell-btn"
            style={{ flex: 1, height: 38, fontSize: 13 }}
          >
            {copied ? 'Copied!' : 'Copy post text'}
          </button>
          <a
            href="https://business.google.com"
            target="_blank"
            rel="noreferrer"
            style={{
              flex: 1, height: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              background: '#fff', color: '#3c4043', border: '1px solid #dadce0',
              borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,.06)',
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>
              <span style={{ color: '#4285F4' }}>G</span>
              <span style={{ color: '#EA4335' }}>o</span>
              <span style={{ color: '#FBBC05' }}>o</span>
              <span style={{ color: '#4285F4' }}>g</span>
              <span style={{ color: '#34A853' }}>l</span>
              <span style={{ color: '#EA4335' }}>e</span>
            </span>
            Open Google Business
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>

        <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)', fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
          Want to skip this step?{' '}
          <a href="/account" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>
            Connect your Google Business Profile
          </a>
          {' '}in Account &rsaquo; Connections to post automatically when you publish jobs.
        </div>
      </div>
    </div>
  )
}

function IcoArrow() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 9L9 2M9 2H4.5M9 2V6.5"/>
    </svg>
  )
}
function IcoSearch() {
  return (
    <svg className="db-fsearch-ico" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="5.5" cy="5.5" r="4"/>
      <path d="M9 9l2.5 2.5"/>
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

function IcoMenu() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2 4h12M2 8h12M2 12h12"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { data: session } = useSession()
  const canPublish = session?.user?.role === 'OWNER' || session?.user?.role === 'ADMIN'

  // Data
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<'all' | 'live' | 'draft'>('all')
  const [installerFilter, setInstallerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState<'all' | '30' | '90'>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'address'>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const JOBS_PER_PAGE = 20
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [gbpPostId, setGbpPostId] = useState<string | null>(null)
  const [gbpCopied, setGbpCopied] = useState(false)

  // Address editing (keyed by checkIn.id)
  const [editAddresses, setEditAddresses] = useState<Record<string, EditAddr>>({})
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  // Notes editing (keyed by checkIn.id)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

  // Customer editing (keyed by checkIn.id)
  const [editCustomers, setEditCustomers] = useState<Record<string, EditCustomer>>({})
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null)
  const [savingCustomerId, setSavingCustomerId] = useState<string | null>(null)

  // Org info (for review message)
  const [orgName, setOrgName] = useState('')
  const [gbpReviewLink, setGbpReviewLink] = useState('')

  // Review request modal
  const [reviewModalCheckIn, setReviewModalCheckIn] = useState<CheckIn | null>(null)
  const [reviewMethod, setReviewMethod] = useState<'text' | 'email'>('text')
  const [reviewShowManual, setReviewShowManual] = useState(false)
  const [reviewMessageText, setReviewMessageText] = useState('')
  const [reviewSignature, setReviewSignature] = useState('')
  const [reviewOverrideName, setReviewOverrideName] = useState('')
  const [reviewOverridePhone, setReviewOverridePhone] = useState('')
  const [reviewOverrideEmail, setReviewOverrideEmail] = useState('')
  const [reviewCopied, setReviewCopied] = useState(false)
  const [reviewTextSent, setReviewTextSent] = useState(false)
  const [reviewEmailSent, setReviewEmailSent] = useState(false)

  // Photo delete
  const [deletingPhotoKey, setDeletingPhotoKey] = useState<string | null>(null)

  // Publish
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [publishModal, setPublishModal] = useState<{
    checkIn: CheckIn
    warnings: string[]
    blockingError?: string
  } | null>(null)

  // Download
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Sync theme with localStorage so it persists across pages
  useEffect(() => {
    const saved = localStorage.getItem('db-theme') as 'light' | 'dark' | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('db-theme', theme)
  }, [theme])

  // Escape key closes publish modal
  useEffect(() => {
    if (!publishModal) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPublishModal(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [publishModal])

  // Keep sessionStorage cache in sync with any local mutations (customer save, address save, etc.)
  useEffect(() => {
    if (!loading) {
      try { sessionStorage.setItem('db-checkins', JSON.stringify(checkIns)) } catch { /* ignore */ }
    }
  }, [checkIns, loading])

  useEffect(() => {
    // Seed from cache immediately so UI isn't blank while fetch runs
    try {
      const cached = sessionStorage.getItem('db-checkins')
      if (cached) {
        setCheckIns(JSON.parse(cached))
        setLoading(false)
      }
    } catch { /* ignore */ }
    fetchCheckIns()
    fetch('/api/organization/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.organization?.name) setOrgName(d.organization.name)
        if (d.organization?.gbpReviewLink) setGbpReviewLink(d.organization.gbpReviewLink)
      })
      .catch(() => {})
  }, [])

  const fetchCheckIns = async () => {
    try {
      const res = await fetch('/api/get-checkins-supabase')
      if (res.ok) {
        const data = await res.json()
        setCheckIns(data.checkIns || [])
      }
    } catch (err) {
      console.error('Error fetching check-ins:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Filtering / sorting ────────────────────────────────────────────────────

  const uniqueInstallers = useMemo(
    () => [...new Set(checkIns.map((c) => c.installer))].sort(),
    [checkIns]
  )

  const filteredCheckIns = useMemo(() => {
    const cutoff = dateFilter !== 'all'
      ? new Date(Date.now() - Number(dateFilter) * 24 * 60 * 60 * 1000)
      : null

    let result = checkIns.filter((c) => {
      const statusMatch =
        activeFilter === 'all' ||
        (activeFilter === 'live' ? c.isPublic : !c.isPublic)
      const installerMatch =
        installerFilter === 'all' || c.installer === installerFilter
      const dateMatch =
        !cutoff || new Date(c.timestamp) >= cutoff
      const q = searchQuery.toLowerCase()
      const searchMatch =
        !q ||
        [c.street, c.city, c.state, c.doorType, c.installer]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      return statusMatch && installerMatch && dateMatch && searchMatch
    })

    if (sortOrder === 'newest')
      result = [...result].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    else if (sortOrder === 'oldest')
      result = [...result].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    else if (sortOrder === 'address')
      result = [...result].sort((a, b) =>
        (a.street || '').localeCompare(b.street || '')
      )

    return result
  }, [checkIns, activeFilter, installerFilter, dateFilter, sortOrder, searchQuery])

  const liveCount  = checkIns.filter((c) => c.isPublic).length
  const draftCount = checkIns.filter((c) => !c.isPublic).length
  const todayCount = checkIns.filter(
    (c) => new Date(c.timestamp).toDateString() === new Date().toDateString()
  ).length
  const activeInstallerCount = new Set(checkIns.map((c) => c.installer)).size

  // ── Card expand / collapse ─────────────────────────────────────────────────

  const toggleExpanded = (checkIn: CheckIn) => {
    const next = new Set(expandedIds)
    if (next.has(checkIn.id)) {
      next.delete(checkIn.id)
    } else {
      next.add(checkIn.id)
      // Seed address and notes edit fields from current data
      setEditAddresses((prev) => ({
        ...prev,
        [checkIn.id]: {
          street: checkIn.street || '',
          city: checkIn.city || '',
          state: checkIn.state || '',
          zip: checkIn.zip || '',
        },
      }))
      setEditNotes((prev) => ({ ...prev, [checkIn.id]: checkIn.notes || '' }))
      setEditCustomers((prev) => ({
        ...prev,
        [checkIn.id]: {
          name: checkIn.homeCustomerName || '',
          phones: checkIn.homeCustomerPhone
            ? checkIn.homeCustomerPhone.split('\n').filter(Boolean).map((num) => ({ type: 'Mobile', num }))
            : [{ type: 'Mobile', num: '' }],
          emails: checkIn.homeCustomerEmail
            ? checkIn.homeCustomerEmail.split('\n').filter(Boolean).map((addr) => ({ type: 'Home', addr }))
            : [{ type: 'Home', addr: '' }],
        },
      }))
    }
    setExpandedIds(next)
  }

  const updateEditAddr = (id: string, field: keyof EditAddr, value: string) => {
    setEditAddresses((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }))
  }

  const resetEditAddr = (checkIn: CheckIn) => {
    setEditAddresses((prev) => ({
      ...prev,
      [checkIn.id]: {
        street: checkIn.street || '',
        city: checkIn.city || '',
        state: checkIn.state || '',
        zip: checkIn.zip || '',
      },
    }))
    setEditingAddressId(null)
  }

  // ── Address save ───────────────────────────────────────────────────────────

  const handleEditSave = async (checkIn: CheckIn) => {
    const addr = editAddresses[checkIn.id]
    if (!addr) return
    setSavingId(checkIn.id)
    try {
      const jobAddress = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip || ''}`.trim()
      const geocoded = await geocodeJobAddress(jobAddress)
      const res = await fetch('/api/checkins/address', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checkIn.id,
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          latitude: geocoded?.lat,
          longitude: geocoded?.lng,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update address')
      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id
            ? {
                ...c,
                street: data.checkIn?.street ?? c.street,
                city: data.checkIn?.city ?? c.city,
                state: data.checkIn?.state ?? c.state,
                zip: data.checkIn?.zip ?? c.zip,
                latitude: data.checkIn?.latitude ?? c.latitude,
                longitude: data.checkIn?.longitude ?? c.longitude,
                locationSource: data.checkIn?.locationSource ?? c.locationSource,
              }
            : c
        )
      )
      setEditingAddressId(null)
    } catch (err: any) {
      alert(err.message || 'Failed to update address')
    } finally {
      setSavingId(null)
    }
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  const handleTogglePublish = async (checkIn: CheckIn) => {
    setTogglingId(checkIn.id)
    try {
      const res = await fetch('/api/checkins/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkIn.id, isPublic: !checkIn.isPublic }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to update publish state')
      }
      const data = await res.json()
      const newIsPublic = data.checkIn?.isPublic as boolean | undefined
      if (typeof newIsPublic === 'boolean') {
        setCheckIns((prev) =>
          prev.map((c) => (c.id === checkIn.id ? { ...c, isPublic: newIsPublic } : c))
        )
      }
      return true
    } catch (err: any) {
      const msg = err.message || 'Failed to update publish state'
      if (publishModal) {
        setPublishModal((prev) => (prev ? { ...prev, blockingError: msg } : prev))
      } else {
        alert(msg)
      }
      return false
    } finally {
      setTogglingId(null)
    }
  }

  const handlePublishClick = (checkIn: CheckIn) => {
    const { hardBlocked, warnings } = validateForPublish(checkIn)
    if (hardBlocked) return
    setPublishModal({ checkIn, warnings })
  }

  const handleConfirmPublish = async () => {
    if (!publishModal) return
    const success = await handleTogglePublish(publishModal.checkIn)
    if (success) setPublishModal(null)
  }

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = async (checkIn: CheckIn) => {
    if (!checkIn.photoUrls || checkIn.photoUrls.length === 0) return
    setDownloadingId(checkIn.id)
    try {
      const res = await fetch('/api/download-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoUrls: checkIn.photoUrls,
          installer: checkIn.installer,
          timestamp: checkIn.timestamp,
        }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to download photos')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const safeInstaller = (checkIn.installer || 'checkin').replace(/[^a-z0-9-]/gi, '_')
      const time = new Date(checkIn.timestamp).getTime()
      link.href = url
      link.download = `${safeInstaller}-${isNaN(time) ? Date.now() : time}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || 'Failed to download photos')
    } finally {
      setDownloadingId(null)
    }
  }

  // ── Notes save ────────────────────────────────────────────────────────────

  const handleNoteSave = async (checkIn: CheckIn) => {
    const notes = editNotes[checkIn.id] ?? ''
    setSavingNoteId(checkIn.id)
    try {
      const res = await fetch('/api/checkins/notes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkIn.id, notes }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update notes')
      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id ? { ...c, notes: data.checkIn?.notes ?? notes } : c
        )
      )
      setEditingNoteId(null)
    } catch (err: any) {
      alert(err.message || 'Failed to update notes')
    } finally {
      setSavingNoteId(null)
    }
  }

  // ── Customer info save ─────────────────────────────────────────────────────

  const handleCustomerSave = async (checkIn: CheckIn) => {
    const cust = editCustomers[checkIn.id]
    if (!cust) return
    setSavingCustomerId(checkIn.id)
    try {
      const phonesStr = cust.phones.filter((p) => p.num).map((p) => p.num).join('\n') || ''
      const emailsStr = cust.emails.filter((e) => e.addr).map((e) => e.addr).join('\n') || ''
      const res = await fetch('/api/checkins/customer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: checkIn.id,
          homeCustomerName: cust.name,
          homeCustomerPhone: phonesStr,
          homeCustomerEmail: emailsStr,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to save customer info')
      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id
            ? { ...c, homeCustomerName: cust.name, homeCustomerPhone: phonesStr, homeCustomerEmail: emailsStr }
            : c
        )
      )
      setEditingCustomerId(null)
    } catch (err: any) {
      alert(err.message || 'Failed to save customer info')
    } finally {
      setSavingCustomerId(null)
    }
  }

  const cancelCustomerEdit = (checkIn: CheckIn) => {
    setEditCustomers((prev) => ({
      ...prev,
      [checkIn.id]: {
        name: checkIn.homeCustomerName || '',
        phones: checkIn.homeCustomerPhone
          ? checkIn.homeCustomerPhone.split('\n').filter(Boolean).map((num) => ({ type: 'Mobile', num }))
          : [{ type: 'Mobile', num: '' }],
        emails: checkIn.homeCustomerEmail
          ? checkIn.homeCustomerEmail.split('\n').filter(Boolean).map((addr) => ({ type: 'Home', addr }))
          : [{ type: 'Home', addr: '' }],
      },
    }))
    setEditingCustomerId(null)
  }

  const addCustomerPhone = (id: string) => {
    setEditCustomers((prev) => ({
      ...prev,
      [id]: { ...prev[id], phones: [...prev[id].phones, { type: 'Mobile', num: '' }] },
    }))
  }

  const removeCustomerPhone = (id: string, idx: number) => {
    setEditCustomers((prev) => {
      const phones = [...prev[id].phones]
      if (phones.length > 1) phones.splice(idx, 1)
      else phones[0] = { ...phones[0], num: '' }
      return { ...prev, [id]: { ...prev[id], phones } }
    })
  }

  const updateCustomerPhone = (id: string, idx: number, field: 'type' | 'num', value: string) => {
    setEditCustomers((prev) => {
      const phones = prev[id].phones.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
      return { ...prev, [id]: { ...prev[id], phones } }
    })
  }

  const addCustomerEmail = (id: string) => {
    setEditCustomers((prev) => ({
      ...prev,
      [id]: { ...prev[id], emails: [...prev[id].emails, { type: 'Home', addr: '' }] },
    }))
  }

  const removeCustomerEmail = (id: string, idx: number) => {
    setEditCustomers((prev) => {
      const emails = [...prev[id].emails]
      if (emails.length > 1) emails.splice(idx, 1)
      else emails[0] = { ...emails[0], addr: '' }
      return { ...prev, [id]: { ...prev[id], emails } }
    })
  }

  const updateCustomerEmail = (id: string, idx: number, field: 'type' | 'addr', value: string) => {
    setEditCustomers((prev) => {
      const emails = prev[id].emails.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
      return { ...prev, [id]: { ...prev[id], emails } }
    })
  }

  // ── Review request modal ───────────────────────────────────────────────────

  const buildReviewMessage = (checkIn: CheckIn, custName: string) => {
    const firstName = custName.trim().split(' ')[0] || 'there'
    const linkLine = gbpReviewLink
      ? `\nGoogle review link: ${gbpReviewLink}`
      : '\n[paste your Google review link here]'
    const jobUrl = checkIn.isPublic ? `\nView your project photos: ${getPublicUrl(checkIn)}` : ''
    return `${firstName} — we really appreciated your business. Hope you love the result — but please don't hesitate to call if anything needs attention. If you have a minute, a Google review helps us more than you know:${linkLine}${jobUrl}`
  }

  const openReviewModal = (checkIn: CheckIn) => {
    const cust = editCustomers[checkIn.id]
    const custName = cust?.name || ''
    setReviewModalCheckIn(checkIn)
    setReviewMethod('text')
    setReviewShowManual(false)
    setReviewCopied(false)
    setReviewTextSent(false)
    setReviewEmailSent(false)
    setReviewOverrideName(custName)
    setReviewOverridePhone(cust?.phones?.find((p) => p.num)?.num || '')
    setReviewOverrideEmail(cust?.emails?.find((e) => e.addr)?.addr || '')
    setReviewMessageText(buildReviewMessage(checkIn, custName))
    setReviewSignature(`Thanks! ${orgName}`)
  }

  const getReviewRecipient = (checkIn: CheckIn) => {
    const cust = editCustomers[checkIn.id]
    if (reviewShowManual) {
      return { name: reviewOverrideName, phone: reviewOverridePhone, email: reviewOverrideEmail }
    }
    return {
      name: cust?.name || reviewOverrideName,
      phone: cust?.phones?.find((p) => p.num)?.num || reviewOverridePhone,
      email: cust?.emails?.find((e) => e.addr)?.addr || reviewOverrideEmail,
    }
  }

  const handleSendReview = () => {
    if (!reviewModalCheckIn) return
    const { phone, email } = getReviewRecipient(reviewModalCheckIn)
    const fullMessage = `${reviewMessageText}\n\n${reviewSignature}`
    const hasPhone = !!phone
    const hasEmail = !!email

    if (reviewMethod === 'text') {
      if (!phone) { alert('No phone number saved for this customer. Add it in the Customer Info section.'); return }
      window.open(`sms:${phone}?body=${encodeURIComponent(fullMessage)}`, '_blank')
      setReviewTextSent(true)
      if (!hasEmail) setReviewModalCheckIn(null)
    }

    if (reviewMethod === 'email') {
      if (!email) { alert('No email address saved for this customer. Add it in the Customer Info section.'); return }
      const subject = encodeURIComponent('We appreciated working with you — quick favor if you have a minute')
      const body = encodeURIComponent(fullMessage)
      window.open(`mailto:${email}?subject=${subject}&body=${body}`)
      setReviewEmailSent(true)
      if (!hasPhone) setReviewModalCheckIn(null)
    }
  }

  // Auto-close when both have been sent (called via useEffect watching sent state)
  useEffect(() => {
    if (!reviewModalCheckIn) return
    const { phone, email } = getReviewRecipient(reviewModalCheckIn)
    if (reviewTextSent && reviewEmailSent && phone && email) {
      setReviewModalCheckIn(null)
    }
  }, [reviewTextSent, reviewEmailSent])

  const handleCopyReview = () => {
    if (!reviewModalCheckIn) return
    navigator.clipboard.writeText(`${reviewMessageText}\n\n${reviewSignature}`).catch(() => {})
    setReviewCopied(true)
    setTimeout(() => setReviewCopied(false), 2000)
  }

  // ── Photo delete ───────────────────────────────────────────────────────────

  const handlePhotoDelete = async (checkIn: CheckIn, url: string) => {
    const key = `${checkIn.id}:${url}`
    setDeletingPhotoKey(key)
    try {
      const res = await fetch('/api/checkins/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: checkIn.id, url }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete photo')
      setCheckIns((prev) =>
        prev.map((c) =>
          c.id === checkIn.id ? { ...c, photoUrls: data.photoUrls ?? [] } : c
        )
      )
    } catch (err: any) {
      alert(err.message || 'Failed to delete photo')
    } finally {
      setDeletingPhotoKey(null)
    }
  }

  // ── User info ──────────────────────────────────────────────────────────────

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

  // ── Portfolio ──────────────────────────────────────────────────────────────

  const orgSlug = session?.user?.orgSlug
  const publishedCount = checkIns.filter((c) => c.isPublic).length
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')
  const portfolioUrl = orgSlug ? `${baseUrl}/portfolio/${orgSlug}` : null

  const needsOnboarding = (session?.user as any)?.onboardingComplete === false

  // ── Helpers ────────────────────────────────────────────────────────────────

  const getPublicUrl = (checkIn: CheckIn) => {
    const citySlug = slugify(checkIn.city || '')
    const stateSlug = slugify(checkIn.state || '')
    const doorTypeSlug = slugify(checkIn.doorType || 'job')
    const slug = orgSlug
      ? `${doorTypeSlug}-${orgSlug}-${checkIn.id}`
      : `${doorTypeSlug}-${checkIn.id}`
    return `${baseUrl}/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${slug}`
  }

  const formatDate = (ts: string) => {
    const d = new Date(ts)
    return {
      mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      dy: d.getDate().toString(),
    }
  }

  const buildAddress = (c: CheckIn) =>
    [c.street, c.city, [c.state, c.zip].filter(Boolean).join(' ')]
      .filter(Boolean)
      .join(', ') || 'Unknown address'

  const totalFiltered = filteredCheckIns.length
  const totalPages = Math.max(1, Math.ceil(totalFiltered / JOBS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedCheckIns = filteredCheckIns.slice(
    (safePage - 1) * JOBS_PER_PAGE,
    safePage * JOBS_PER_PAGE
  )

  const isFiltered =
    activeFilter !== 'all' || installerFilter !== 'all' || dateFilter !== 'all' || searchQuery.trim() !== ''
  const resultsLabel = isFiltered
    ? `${totalFiltered} job${totalFiltered !== 1 ? 's' : ''} match${totalFiltered === 1 ? 'es' : ''} your filters`
    : `All Jobs (${checkIns.length})`

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="db-root">
        {/* ── Mobile sidebar overlay ──────────────────────────────────────── */}
        <div
          className={`db-sidebar-overlay${sidebarOpen ? ' is-visible' : ''}`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className={`db-sidebar${sidebarOpen ? ' is-open' : ''}`}>
          <div className="db-sidebar-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="db-logo-img" src="/logo.png" alt="ProjectCheckin logo" />
            <span className="db-logo-name">ProjectCheckin</span>
          </div>

          <nav className="db-sidebar-nav">
            <span className="db-nav-label">Workspace</span>

            <Link className="db-nav-item" href="/check-in" onClick={() => setSidebarOpen(false)}>
              <IcoCheckin />
              Check-In
            </Link>

            <Link className="db-nav-item active" href="/dashboard" onClick={() => setSidebarOpen(false)}>
              <IcoJobs />
              Jobs
            </Link>

            {canPublish && (
              <Link className="db-nav-item" href="/dashboard/team" onClick={() => setSidebarOpen(false)}>
                <IcoTeam />
                Team
              </Link>
            )}

            <span className="db-nav-label" style={{ marginTop: 8 }}>Analytics</span>

            {session?.user?.role === 'OWNER' && (
              <Link className="db-nav-item" href="/reporting" onClick={() => setSidebarOpen(false)}>
                <IcoReporting />
                Reporting
              </Link>
            )}

            <span className="db-nav-label" style={{ marginTop: 8 }}>Settings</span>

            {session?.user?.role === 'OWNER' && (
              <Link className="db-nav-item" href="/account" onClick={() => setSidebarOpen(false)}>
                <IcoAccount />
                Account
              </Link>
            )}

            <button className="db-nav-item" onClick={() => { setSidebarOpen(false); signOut() }}>
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

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <div className="db-main">

          {/* Top bar */}
          <div className="db-topbar">
            <button
              className="db-hamburger"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <IcoMenu />
            </button>
            <h1 className="db-page-title">Jobs</h1>
            <div className="db-topbar-right">
              <Link className="db-btn-new" href="/check-in">
                <IcoPlus />
                New Check-In
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="db-stats-row">
            <div className="db-stat-cell">
              <div className="db-stat-num">{checkIns.length}</div>
              <div className="db-stat-lbl">Total Jobs</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-num">{todayCount}</div>
              <div className="db-stat-lbl">Today</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-num">{liveCount}</div>
              <div className="db-stat-lbl">Published</div>
            </div>
            <div className="db-stat-cell">
              <div className="db-stat-num">{activeInstallerCount}</div>
              <div className="db-stat-lbl">Active Installers</div>
            </div>
          </div>

          {/* Portfolio bar */}
          {portfolioUrl && publishedCount > 0 && (
            <div className="db-portfolio-bar">
              <div className="db-portfolio-left">
                <div className="db-portfolio-dot" />
                <span className="db-portfolio-txt">
                  Your public portfolio is live — {publishedCount} {publishedCount === 1 ? 'job' : 'jobs'} indexed on Google
                </span>
              </div>
              <a
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 7, textDecoration: 'none',
                  fontSize: 12, fontWeight: 700,
                  background: 'var(--green-bg)', border: '1.5px solid rgba(22,163,74,.25)',
                  color: 'var(--green)',
                }}
              >
                View Portfolio
                <IcoArrow />
              </a>
            </div>
          )}

          {/* Filter bar */}
          <div className="db-filter-bar">
            <div className="db-filter-tabs">
              {(['all', 'live', 'draft'] as const).map((f) => (
                <button
                  key={f}
                  className={`db-ftab${activeFilter === f ? ' active' : ''}`}
                  onClick={() => { setActiveFilter(f); setCurrentPage(1) }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="db-ftab-count">
                    {f === 'all' ? checkIns.length : f === 'live' ? liveCount : draftCount}
                  </span>
                </button>
              ))}
            </div>
            <div className="db-filter-controls">
              <select
                className="db-fselect"
                value={installerFilter}
                onChange={(e) => { setInstallerFilter(e.target.value); setCurrentPage(1) }}
              >
                <option value="all">All Installers</option>
                {uniqueInstallers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className="db-fselect"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value as typeof dateFilter); setCurrentPage(1) }}
              >
                <option value="all">All time</option>
                <option value="90">Last 90 days</option>
                <option value="30">Last 30 days</option>
              </select>
              <select
                className="db-fselect"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="address">Address A&ndash;Z</option>
              </select>
              <div className="db-fsearch-wrap">
                <IcoSearch />
                <input
                  className="db-fsearch"
                  type="text"
                  placeholder="Search address..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                />
              </div>
            </div>
          </div>

          {/* Jobs list */}
          <div className="db-jobs-wrap">
            <div className="db-jobs-label">{resultsLabel}</div>

            {loading ? (
              <div className="db-loading">Loading jobs&hellip;</div>
            ) : filteredCheckIns.length === 0 ? (
              <div className="db-no-results">
                <div className="db-no-results-title">
                  {checkIns.length === 0 ? 'No jobs yet' : 'No jobs match your filters'}
                </div>
                {checkIns.length === 0
                  ? 'Submit your first check-in to get started.'
                  : 'Try adjusting the status, installer, or search term.'}
              </div>
            ) : (
              <div className="db-jobs-list">
                {paginatedCheckIns.map((checkIn) => {
                  const { mo, dy } = formatDate(checkIn.timestamp)
                  const address = buildAddress(checkIn)
                  const isExpanded = expandedIds.has(checkIn.id)
                  const editAddr = editAddresses[checkIn.id] || {
                    street: checkIn.street || '',
                    city: checkIn.city || '',
                    state: checkIn.state || '',
                    zip: checkIn.zip || '',
                  }
                  const { hardBlocked } = validateForPublish(checkIn)
                  const publicUrl = getPublicUrl(checkIn)

                  return (
                    <div
                      key={checkIn.id}
                      className={`db-job-card${isExpanded ? ' open' : ''}`}
                    >
                      {/* Collapsed row */}
                      <div
                        className="db-card-row"
                        onClick={() => toggleExpanded(checkIn)}
                      >
                        <div className="db-card-date">
                          <span className="db-date-mo">{mo}</span>
                          <span className="db-date-dy">{dy}</span>
                        </div>

                        <div className="db-card-info">
                          <div className="db-card-addr">{address}</div>
                          <div className="db-card-meta">
                            {checkIn.doorType && (
                              <span className="db-meta-txt">{checkIn.doorType}</span>
                            )}
                            {checkIn.doorType && (checkIn.photoUrls?.length ?? 0) > 0 && (
                              <span className="db-meta-dot" />
                            )}
                            {(checkIn.photoUrls?.length ?? 0) > 0 ? (
                              <span className="db-photo-pill">
                                <IcoPhoto />
                                {checkIn.photoUrls!.length} photo{checkIn.photoUrls!.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="db-photo-pill-empty">No photos</span>
                            )}
                          </div>
                        </div>

                        <div className="db-card-status">
                          <span className={`db-status-chip ${checkIn.isPublic ? 'db-s-live' : 'db-s-draft'}`}>
                            <span className="db-chip-dot" />
                            {checkIn.isPublic ? 'Live' : 'Draft'}
                          </span>
                        </div>

                        <div className="db-card-action">
                          {canPublish && checkIn.isPublic ? (
                            <button
                              className="db-btn-unpub"
                              disabled={togglingId === checkIn.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTogglePublish(checkIn)
                              }}
                            >
                              {togglingId === checkIn.id ? 'Saving\u2026' : 'Unpublish'}
                            </button>
                          ) : canPublish ? (
                            <button
                              className="db-btn-publish"
                              disabled={hardBlocked || togglingId === checkIn.id}
                              title={hardBlocked ? 'Add city and state before publishing' : undefined}
                              onClick={(e) => {
                                e.stopPropagation()
                                handlePublishClick(checkIn)
                              }}
                            >
                              {togglingId === checkIn.id ? 'Saving\u2026' : 'Publish'}
                            </button>
                          ) : null}
                        </div>

                        <div className="db-card-chev">
                          <IcoChevron />
                        </div>
                      </div>

                      {/* Expanded detail */}
                      <div className="db-card-detail">
                        <div className="db-detail-grid">
                          {/* Left col: customer info + address + job info + notes */}
                          <div className="db-detail-col">

                            {/* ── Customer Info ── */}
                            {(() => {
                              const cust = editCustomers[checkIn.id]
                              const isEditing = editingCustomerId === checkIn.id
                              const hasData = cust?.name || cust?.phones?.some((p) => p.num) || cust?.emails?.some((e) => e.addr)
                              return (
                                <>
                                  <div className="cust-section-hdr">
                                    <span className="cust-section-title">Customer Info</span>
                                    {!isEditing && hasData && (
                                      <button className="db-btn-note-edit" onClick={() => setEditingCustomerId(checkIn.id)}>Edit</button>
                                    )}
                                  </div>

                                  {isEditing ? (
                                    <div>
                                      <input
                                        className="db-field"
                                        value={cust?.name ?? ''}
                                        placeholder="Customer name"
                                        style={{ marginBottom: 10 }}
                                        onChange={(e) => setEditCustomers((prev) => ({ ...prev, [checkIn.id]: { ...prev[checkIn.id], name: e.target.value } }))}
                                      />
                                      <div className="cust-field-section-lbl">Phone</div>
                                      {cust?.phones.map((phone, idx) => (
                                        <div key={idx} className="cust-entry-row">
                                          <select
                                            className="cust-type-select"
                                            value={phone.type}
                                            onChange={(e) => updateCustomerPhone(checkIn.id, idx, 'type', e.target.value)}
                                          >
                                            <option>Mobile</option>
                                            <option>Home</option>
                                            <option>Work</option>
                                            <option>Other</option>
                                          </select>
                                          <input
                                            className="db-field cust-entry-input"
                                            type="tel"
                                            value={phone.num}
                                            placeholder="Phone number"
                                            onChange={(e) => updateCustomerPhone(checkIn.id, idx, 'num', e.target.value)}
                                          />
                                          <button className="cust-remove-btn" onClick={() => removeCustomerPhone(checkIn.id, idx)}>−</button>
                                        </div>
                                      ))}
                                      <button className="cust-add-link" onClick={() => addCustomerPhone(checkIn.id)}>+ add phone</button>

                                      <div className="cust-field-section-lbl">Email</div>
                                      {cust?.emails.map((email, idx) => (
                                        <div key={idx} className="cust-entry-row">
                                          <select
                                            className="cust-type-select"
                                            value={email.type}
                                            onChange={(e) => updateCustomerEmail(checkIn.id, idx, 'type', e.target.value)}
                                          >
                                            <option>Home</option>
                                            <option>Work</option>
                                            <option>Other</option>
                                          </select>
                                          <input
                                            className="db-field cust-entry-input"
                                            type="email"
                                            value={email.addr}
                                            placeholder="Email address"
                                            onChange={(e) => updateCustomerEmail(checkIn.id, idx, 'addr', e.target.value)}
                                          />
                                          <button className="cust-remove-btn" onClick={() => removeCustomerEmail(checkIn.id, idx)}>−</button>
                                        </div>
                                      ))}
                                      <button className="cust-add-link" onClick={() => addCustomerEmail(checkIn.id)}>+ add email</button>

                                      <div className="db-edit-actions">
                                        <button
                                          className="db-btn-save"
                                          disabled={savingCustomerId === checkIn.id}
                                          onClick={() => handleCustomerSave(checkIn)}
                                        >
                                          {savingCustomerId === checkIn.id ? 'Saving\u2026' : 'Save'}
                                        </button>
                                        <button className="db-btn-cancel" onClick={() => cancelCustomerEdit(checkIn)}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : hasData ? (
                                    <div style={{ marginBottom: 4 }}>
                                      {cust.name && (
                                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 5 }}>{cust.name}</div>
                                      )}
                                      {cust.phones.filter((p) => p.num).map((p, i) => (
                                        <div key={i} className="cust-read-contact">
                                          <span className="cust-read-type">{p.type}</span>
                                          <span className="cust-read-val">{p.num}</span>
                                        </div>
                                      ))}
                                      {cust.emails.filter((e) => e.addr).map((e, i) => (
                                        <div key={i} className="cust-read-contact" style={{ marginTop: 1 }}>
                                          <span className="cust-read-type">{e.type}</span>
                                          <span className="cust-read-val">{e.addr}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <button
                                      className="db-btn-note-edit"
                                      style={{ padding: 0, marginBottom: 4 }}
                                      onClick={() => setEditingCustomerId(checkIn.id)}
                                    >
                                      + Add customer info
                                    </button>
                                  )}
                                </>
                              )
                            })()}

                            {/* Address */}
                            <div style={{ marginTop: 14 }}>
                              <div className="db-notes-header">
                                <span className="db-d-label">Address</span>
                                {editingAddressId !== checkIn.id && (
                                  <button className="db-btn-note-edit" onClick={() => setEditingAddressId(checkIn.id)}>Edit</button>
                                )}
                              </div>
                              {editingAddressId === checkIn.id ? (
                                <>
                                  <input
                                    className="db-field"
                                    value={editAddr.street}
                                    placeholder="Street"
                                    onChange={(e) => updateEditAddr(checkIn.id, 'street', e.target.value)}
                                  />
                                  <div className="db-field-row">
                                    <input
                                      className="db-field"
                                      style={{ flex: 2 }}
                                      value={editAddr.city}
                                      placeholder="City"
                                      onChange={(e) => updateEditAddr(checkIn.id, 'city', e.target.value)}
                                    />
                                    <input
                                      className="db-field"
                                      style={{ flex: 0.8 }}
                                      value={editAddr.state}
                                      placeholder="State"
                                      onChange={(e) => updateEditAddr(checkIn.id, 'state', e.target.value)}
                                    />
                                    <input
                                      className="db-field"
                                      style={{ flex: 1.5 }}
                                      value={editAddr.zip}
                                      placeholder="ZIP"
                                      onChange={(e) => updateEditAddr(checkIn.id, 'zip', e.target.value)}
                                    />
                                  </div>
                                  <div className="db-edit-actions">
                                    <button
                                      className="db-btn-save"
                                      disabled={savingId === checkIn.id}
                                      onClick={() => handleEditSave(checkIn)}
                                    >
                                      {savingId === checkIn.id ? 'Saving\u2026' : 'Save'}
                                    </button>
                                    <button className="db-btn-cancel" onClick={() => resetEditAddr(checkIn)}>Cancel</button>
                                  </div>
                                </>
                              ) : (
                                <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 4 }}>
                                  {[checkIn.street, [checkIn.city, checkIn.state, checkIn.zip].filter(Boolean).join(', ')].filter(Boolean).join(', ') || <span style={{ color: 'var(--t4)' }}>No address saved</span>}
                                </div>
                              )}
                              {(() => {
                                const mapsUrl = checkIn.latitude && checkIn.longitude
                                  ? `https://maps.google.com/?q=${checkIn.latitude},${checkIn.longitude}`
                                  : [checkIn.street, checkIn.city, checkIn.state, checkIn.zip].filter(Boolean).length > 0
                                    ? `https://maps.google.com/?q=${encodeURIComponent([checkIn.street, checkIn.city, checkIn.state, checkIn.zip].filter(Boolean).join(', '))}`
                                    : null
                                return mapsUrl ? (
                                  <a
                                    href={mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--sky-text)', textDecoration: 'none', marginTop: 2 }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    View on Google Maps
                                  </a>
                                ) : null
                              })()}
                              {checkIn.locationSource === 'DEVICE' && (
                                <div className="db-location-warning">
                                  Device location — please verify address
                                </div>
                              )}
                            </div>

                            {/* ── Job Info ── */}
                            <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                            <span className="cust-section-title" style={{ display: 'block', marginBottom: 10 }}>Job Info</span>

                            <div className="job-info-row">
                              <span className="db-d-label">Installer</span>
                              <span className="job-info-val">{checkIn.installer}</span>
                            </div>
                            {checkIn.doorType && (
                              <div className="job-info-row">
                                <span className="db-d-label">Job Type</span>
                                <span className="job-info-val">{checkIn.doorType}</span>
                              </div>
                            )}
                            <div className="job-info-row" style={{ marginBottom: 12 }}>
                              <span className="db-d-label">Job Date</span>
                              <span className="job-info-val">
                                {new Date(checkIn.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Notes */}
                            <div>
                              <div className="db-notes-header">
                                <span className="db-d-label">Notes</span>
                                {editingNoteId !== checkIn.id && (
                                  <button
                                    className="db-btn-note-edit"
                                    onClick={() => setEditingNoteId(checkIn.id)}
                                  >
                                    Edit
                                  </button>
                                )}
                              </div>
                              {editingNoteId === checkIn.id ? (
                                <>
                                  <textarea
                                    className="db-notes-textarea"
                                    value={editNotes[checkIn.id] ?? ''}
                                    placeholder="Add job notes..."
                                    onChange={(e) =>
                                      setEditNotes((prev) => ({
                                        ...prev,
                                        [checkIn.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <div className="db-edit-actions">
                                    <button
                                      className="db-btn-save"
                                      disabled={savingNoteId === checkIn.id}
                                      onClick={() => handleNoteSave(checkIn)}
                                    >
                                      {savingNoteId === checkIn.id ? 'Saving\u2026' : 'Save'}
                                    </button>
                                    <button
                                      className="db-btn-cancel"
                                      onClick={() => {
                                        setEditingNoteId(null)
                                        setEditNotes((prev) => ({
                                          ...prev,
                                          [checkIn.id]: checkIn.notes || '',
                                        }))
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </>
                              ) : (
                                <div className="db-d-val">
                                  {checkIn.notes || <span className="db-notes-empty">No notes added</span>}
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Right col: photos + actions */}
                          <div className="db-detail-col">
                            <div className="db-d-label">
                              Photos ({checkIn.photoUrls?.length ?? 0})
                            </div>
                            {(checkIn.photoUrls?.length ?? 0) > 0 ? (
                              <div className="db-photo-grid">
                                {checkIn.photoUrls!.map((url, idx) => {
                                  const photoKey = `${checkIn.id}:${url}`
                                  return (
                                    <div key={idx} className="db-photo-thumb-wrap">
                                      <a
                                        className="db-photo-thumb"
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={url} alt={`Photo ${idx + 1}`} />
                                      </a>
                                      <button
                                        className="db-photo-delete"
                                        disabled={deletingPhotoKey === photoKey}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handlePhotoDelete(checkIn, url)
                                        }}
                                        aria-label="Delete photo"
                                      >
                                        {deletingPhotoKey === photoKey ? '\u2026' : '\u00d7'}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="db-photo-empty">No photos attached</div>
                            )}

                            <div className="db-detail-btns">
                              {checkIn.isPublic && (
                                <>
                                  <button
                                    className="db-btn-ghost"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      navigator.clipboard.writeText(publicUrl)
                                      setCopiedId(checkIn.id)
                                      setTimeout(() => setCopiedId(null), 2000)
                                    }}
                                  >
                                    <IcoCopy />
                                    Copy Link
                                  </button>
                                  {copiedId === checkIn.id && (
                                    <span className="db-copied-msg">Copied!</span>
                                  )}
                                </>
                              )}
                              {(checkIn.photoUrls?.length ?? 0) > 0 && (
                                <button
                                  className="db-btn-ghost"
                                  disabled={downloadingId === checkIn.id}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDownload(checkIn)
                                  }}
                                >
                                  <IcoDownload />
                                  {downloadingId === checkIn.id ? 'Preparing\u2026' : 'Download All'}
                                </button>
                              )}
                              {checkIn.isPublic && (
                                <button
                                  className="db-btn-ghost"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setGbpPostId(checkIn.id)
                                    setGbpCopied(false)
                                  }}
                                >
                                  <IcoGbp />
                                  Post to Google Business
                                </button>
                              )}
                              <button
                                className="db-btn-ghost db-btn-review"
                                data-tooltip="Texts and/or emails your customer a personalized message and link to leave you a Google review"
                                onClick={(e) => { e.stopPropagation(); openReviewModal(checkIn) }}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                </svg>
                                Request Google Review
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 8px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                  Page {safePage} of {totalPages} &middot; {totalFiltered} jobs
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="db-btn-ghost"
                    disabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{ opacity: safePage === 1 ? 0.4 : 1 }}
                  >
                    &larr; Prev
                  </button>
                  <button
                    className="db-btn-ghost"
                    disabled={safePage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{ opacity: safePage === totalPages ? 0.4 : 1 }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals rendered outside db-root so they stack above z-index:10 */}
      {needsOnboarding && (
        <OnboardingModal
          planTier={(session?.user as any)?.planTier}
          orgSlug={session?.user?.orgSlug ?? undefined}
        />
      )}
      {publishModal && (
        <PublishModal
          checkIn={publishModal.checkIn}
          warnings={publishModal.warnings}
          blockingError={publishModal.blockingError}
          onConfirm={handleConfirmPublish}
          onClose={() => setPublishModal(null)}
          isPublishing={togglingId === publishModal.checkIn.id}
        />
      )}
      {gbpPostId && (() => {
        const ci = checkIns.find((c) => c.id === gbpPostId)
        if (!ci) return null
        return (
          <GbpPostModal
            checkIn={ci}
            publicUrl={getPublicUrl(ci)}
            onClose={() => setGbpPostId(null)}
          />
        )
      })()}

      {/* ── Review Request Modal ── */}
      {reviewModalCheckIn && (() => {
        const ci = reviewModalCheckIn
        const { name, phone, email } = getReviewRecipient(ci)
        const savedCust = editCustomers[ci.id]
        const hasCustomer = !!(savedCust?.name || savedCust?.phones?.find((p) => p.num)?.num)
        const subLine = [ci.street || ci.city, ci.doorType, ci.timestamp ? new Date(ci.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''].filter(Boolean).join(' · ')
        return (
          <div className="rrm-overlay" onClick={() => setReviewModalCheckIn(null)}>
            <div className="rrm-box" onClick={(e) => e.stopPropagation()}>

              <div className="rrm-header">
                <div>
                  <div className="rrm-title">Request a Google Review</div>
                  {subLine && <div className="rrm-sub">{subLine}</div>}
                </div>
                <button className="rrm-close" onClick={() => setReviewModalCheckIn(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Customer display / manual fields */}
              {hasCustomer && !reviewShowManual ? (
                <div className="rrm-cust-display">
                  <div>
                    <div className="rrm-cust-name">{name || '—'}</div>
                    <div className="rrm-cust-phone">{phone || 'No phone saved'}</div>
                  </div>
                  <button className="rrm-change-btn" onClick={() => setReviewShowManual(true)}>Change</button>
                </div>
              ) : (
                <div>
                  <div className="rrm-field-group">
                    <div className="rrm-label">Customer Name <span style={{ color: 'var(--red)' }}>*</span></div>
                    <input
                      className="rrm-input"
                      type="text"
                      placeholder="e.g. Sarah Johnson"
                      value={reviewOverrideName}
                      onChange={(e) => {
                        const val = e.target.value
                        setReviewOverrideName(val)
                        const firstName = val.trim().split(' ')[0] || 'there'
                        setReviewMessageText((prev) => prev.replace(/^\S+/, firstName || 'there'))
                      }}
                    />
                  </div>
                  <div className="rrm-field-group">
                    <div className="rrm-label">Mobile Number <span style={{ color: 'var(--red)' }}>*</span></div>
                    <input
                      className="rrm-input"
                      type="tel"
                      placeholder="(615) 555-0192"
                      value={reviewOverridePhone}
                      onChange={(e) => setReviewOverridePhone(e.target.value)}
                    />
                  </div>
                  <div className="rrm-field-group">
                    <div className="rrm-label">Email <span style={{ color: 'var(--t3)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></div>
                    <input
                      className="rrm-input"
                      type="email"
                      placeholder="sarah@email.com"
                      value={reviewOverrideEmail}
                      onChange={(e) => setReviewOverrideEmail(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Send method */}
              <div style={{ marginBottom: 14 }}>
                <div className="rrm-label" style={{ marginBottom: 8 }}>Send via</div>
                <div className="rrm-method-row">
                  <button className={`rrm-method-btn${reviewMethod === 'text' ? ' active' : ''}${reviewTextSent ? ' rrm-method-sent' : ''}`} onClick={() => setReviewMethod('text')}>
                    {reviewTextSent ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    )}
                    {reviewTextSent ? 'Text Sent!' : 'Text'}
                  </button>
                  <button className={`rrm-method-btn${reviewMethod === 'email' ? ' active' : ''}${reviewEmailSent ? ' rrm-method-sent' : ''}`} onClick={() => setReviewMethod('email')}>
                    {reviewEmailSent ? (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    )}
                    {reviewEmailSent ? 'Email Sent!' : 'Email'}
                  </button>
                </div>
              </div>

              {/* Message preview */}
              <div className="rrm-preview-label">
                Message
                <span className="rrm-preview-hint">edit before sending</span>
              </div>
              <textarea
                className="rrm-preview-textarea"
                value={reviewMessageText}
                onChange={(e) => setReviewMessageText(e.target.value)}
                rows={4}
              />
              {reviewMessageText.includes('[review link]') && (
                <div className="rrm-link-warn">
                  Add your Google review link in Account &rarr; Connections to auto-fill this.
                </div>
              )}

              {/* Signature */}
              <div className="rrm-preview-label" style={{ marginTop: 10 }}>
                Signature
                <span className="rrm-preview-hint">edit before sending</span>
              </div>
              <input
                className="rrm-input"
                type="text"
                value={reviewSignature}
                onChange={(e) => setReviewSignature(e.target.value)}
                placeholder="Thanks! Your Company Name"
              />

              {/* Footer */}
              <div className="rrm-footer">
                <button
                  className="rrm-btn-send"
                  onClick={handleSendReview}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {reviewMethod === 'text' ? 'Send via Text' : 'Send via Email'}
                </button>
                <button className="rrm-btn-copy" onClick={handleCopyReview}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <rect x="1" y="3.5" width="6" height="6.5" rx="1.2"/><path d="M4 3.5V2A1 1 0 0 1 5 1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H8"/>
                  </svg>
                  {reviewCopied ? 'Copied!' : 'Copy text'}
                </button>
              </div>
              <div className="rrm-footer-note">
                {reviewMethod === 'text'
                  ? 'Opens your messaging app — tap Send to deliver.'
                  : 'Opens your email app — tap Send to deliver.'}
              </div>

            </div>
          </div>
        )
      })()}
    </>
  )
}
