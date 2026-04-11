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
}

interface EditAddr {
  street: string
  city: string
  state: string
  zip: string
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
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'address'>('newest')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Address editing (keyed by checkIn.id)
  const [editAddresses, setEditAddresses] = useState<Record<string, EditAddr>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  // Notes editing (keyed by checkIn.id)
  const [editNotes, setEditNotes] = useState<Record<string, string>>({})
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchCheckIns()
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
    let result = checkIns.filter((c) => {
      const statusMatch =
        activeFilter === 'all' ||
        (activeFilter === 'live' ? c.isPublic : !c.isPublic)
      const installerMatch =
        installerFilter === 'all' || c.installer === installerFilter
      const q = searchQuery.toLowerCase()
      const searchMatch =
        !q ||
        [c.street, c.city, c.state, c.doorType, c.installer]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      return statusMatch && installerMatch && searchMatch
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
  }, [checkIns, activeFilter, installerFilter, sortOrder, searchQuery])

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

  const isFiltered =
    activeFilter !== 'all' || installerFilter !== 'all' || searchQuery.trim() !== ''
  const resultsLabel = isFiltered
    ? `Showing ${filteredCheckIns.length} of ${checkIns.length} jobs`
    : 'Recent Jobs'

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
                  Portfolio live at <strong>{portfolioUrl.replace(/^https?:\/\//, '')}</strong>
                </span>
              </div>
              <a
                className="db-portfolio-link"
                href={portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View public page
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
                  onClick={() => setActiveFilter(f)}
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
                onChange={(e) => setInstallerFilter(e.target.value)}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                {filteredCheckIns.map((checkIn) => {
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
                          {/* Left col: address + installer + notes */}
                          <div className="db-detail-col">
                            <div className="db-d-label">Address</div>
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
                              <button
                                className="db-btn-cancel"
                                onClick={() => resetEditAddr(checkIn)}
                              >
                                Cancel
                              </button>
                            </div>

                            {checkIn.locationSource === 'DEVICE' && (
                              <div className="db-location-warning">
                                Device location — please verify address
                              </div>
                            )}

                            <div className="db-installer-row">
                              <span className="db-d-label">Installer</span>
                              <span className="db-installer-name">{checkIn.installer}</span>
                            </div>

                            <div style={{ marginTop: 12 }}>
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
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
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
    </>
  )
}
