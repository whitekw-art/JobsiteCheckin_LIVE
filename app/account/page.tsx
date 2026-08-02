'use client'

import { useEffect, useState, FormEvent } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'
import { tierHasFeature } from '@/lib/planVersions'

type Tab = 'general' | 'team' | 'billing' | 'connections'

interface OrganizationProfile {
  name: string
  slug: string | null
  phone: string | null
  website: string | null
  email: string | null
  gbpReviewLink: string | null
  portfolioPageUrl: string | null
  portfolioIntro: string | null
  businessContext: string | null
  businessContextUpdatedAt: string | null
  websiteScanHistory: string[] | null
}

interface WidgetJobsSummary {
  introDefault: string | null
  primaryType: string | null
  primaryCity: string | null
  primaryState: string | null
  types: string[]
  cities: string[]
}

const WIDGET_PLATFORM_INSTRUCTIONS: Record<string, string> = {
  WordPress: '1. Log into WordPress and open the page where you want your work to show up (or create a new page).\n2. Click the + button to add a new block.\n3. Type "Custom HTML" in the search box and select it.\n4. Paste the code below into that block.\n5. Click Update (or Publish) in the top right to save your page.',
  Squarespace: '1. Log into Squarespace and open the page where you want your work to show up.\n2. Click Edit on that page.\n3. Click the + icon where you want the widget to appear, scroll down, and choose Code.\n4. Paste the code below into the box that opens, then click Apply.\n5. Click Save, then Publish, in the top right.',
  Webflow: '1. Open your site in the Webflow Designer and go to the page where you want your work to show up.\n2. In the left panel, find the Embed element and drag it onto the page.\n3. Double-click the Embed box you just added.\n4. Paste the code below into the box, then click Save & Close.\n5. Click Publish in the top right to make it live.',
  'Plain HTML': '1. Find the HTML file for the page where you want your work to show up. If someone else built your site, ask them for it — or log into your hosting account (GoDaddy, Bluehost, Netlify, etc.) and look for "File Manager" or "Site Files."\n2. Right-click that file and choose Open With → Notepad (Windows) or TextEdit (Mac). Don’t use Microsoft Word — it can break the file.\n3. Press Ctrl+F (Cmd+F on Mac) and search for </body>. That’s a marker near the end of the file.\n4. Click right before </body> and paste the code below.\n5. Save the file, then upload it back to your host the same way you found it. Most hosts show a Save or Publish button.\n6. Stuck? Your web host’s live chat can usually paste one snippet for you in a few minutes — just say "I need to add one HTML snippet before </body> on this page."',
}

// Instructions shown when a customer already has the widget installed and needs to
// swap the old snippet for a fresh one (per platform). Mirrors the install map above.
const WIDGET_PLATFORM_UPDATE_INSTRUCTIONS: Record<string, string> = {
  WordPress: '1. Log into WordPress, click Pages, and open the page where your work currently shows up, then click into it to edit.\n2. Find the Custom HTML block that holds your widget — it’s the one containing the pc-widget code. Can’t spot it? Click the list-view (outline) icon at the top left and look for "Custom HTML."\n3. Select everything inside that block and delete it, then paste the fresh code below in its place. Don’t retype or edit anything inside it — just swap the whole block, old for new.\n4. Click Update (or Publish) in the top right to save.',
  Squarespace: '1. Log into Squarespace, open the page where your work currently shows up, and click Edit.\n2. Click the Code block that holds your widget — it shows your pc-widget code — to open it.\n3. Select everything in the box and delete it, then paste the fresh code below in its place. Don’t retype or edit anything inside it — just swap the whole block. Then click Apply.\n4. Click Save, then Publish, in the top right.',
  Webflow: '1. Open your site in the Webflow Designer and go to the page where your work currently shows up.\n2. Click the Embed element that holds your widget — the box showing your pc-widget code — then double-click it to open the code editor.\n3. Select everything in the box and delete it, then paste the fresh code below in its place. Don’t retype or edit anything inside it — just swap the whole block. Then click Save & Close.\n4. Click Publish in the top right to make the change live.',
  'Plain HTML': '1. Find the same HTML file you originally added the widget to.\n2. Open it with Notepad (Windows) or TextEdit (Mac) — not Microsoft Word, it can break the file.\n3. Press Ctrl+F (Cmd+F on Mac) and search for pc-widget. That’s your existing snippet — three lines: a comment, a <div id="pc-widget"…>, and a <script src="…">.\n4. Select all three lines and delete them, then paste in the fresh code below in their place. Don’t retype or edit anything inside it — just swap the whole block, old for new.\n5. Save the file, then upload it back to your host the same way you found it.\n6. Stuck? Your host’s live chat can usually swap one snippet for another in a few minutes — just say "I need to replace an existing HTML snippet with a new one on this page."',
}

function formatPhone(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length < 4)  return `(${d}`
  if (d.length < 7)  return `(${d.slice(0,3)}) ${d.slice(3)}`
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function byFrequency(values: string[]): string[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}

const PLAN_LABELS: Record<string, string> = {
  free:  'Free Starter',
  pro:   'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

function subTabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    background: 'transparent',
    border: 'none',
    color: active ? 'var(--sky-text)' : 'var(--t3)',
    cursor: 'pointer',
    borderBottom: active ? '2px solid var(--sky)' : '2px solid transparent',
    marginBottom: -1,
  }
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        flexShrink: 0,
        background: checked ? 'var(--sky)' : 'var(--border-2)',
        borderRadius: 10,
        cursor: 'pointer',
        transition: 'background .2s',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 14,
        height: 14,
        top: 3,
        left: checked ? 19 : 3,
        background: '#fff',
        borderRadius: '50%',
        transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.25)',
      }} />
    </div>
  )
}

// Google G icon for the card header icon box (compact — just the G)
const GoogleGIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
    <path d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.2-.1-2.5-.4-3.5z" fill="#FFC107"/>
    <path d="M6.3 14.7l6.6 4.8C14.6 16 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" fill="#FF3D00"/>
    <path d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.5 16.3 44 24 44z" fill="#4CAF50"/>
    <path d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.2 5.2C41.1 35.6 44 30.2 44 24c0-1.2-.1-2.5-.4-3.5z" fill="#1976D2"/>
  </svg>
)

// Full Google wordmark for the connect button
const GoogleWordmark = () => (
  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1 }}>
    <span style={{ color: '#4285F4' }}>G</span>
    <span style={{ color: '#EA4335' }}>o</span>
    <span style={{ color: '#FBBC05' }}>o</span>
    <span style={{ color: '#4285F4' }}>g</span>
    <span style={{ color: '#34A853' }}>l</span>
    <span style={{ color: '#EA4335' }}>e</span>
  </span>
)

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

// Connections status indicator — dot + text, no bubble (Coming soon / Active / Disabled)
type ConnState = 'coming' | 'active' | 'disabled'
function StatusDot({ state, label }: { state: ConnState; label: string }) {
  const color = state === 'active' ? 'var(--green)' : state === 'disabled' ? 'var(--red)' : 'var(--t3)'
  const dot   = state === 'coming' ? 'var(--t4)' : color
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color, whiteSpace: 'nowrap', flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
      {label}
    </span>
  )
}

// Soft, monochrome Good/Better/Best label for the website-integration family
function TierLabel({ label }: { label: string }) {
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{label}</span>
  )
}

// Small accent "Active" chip used only on the currently-active website-integration option
function ActiveTag() {
  return (
    <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', background: 'var(--sky-dim)', color: 'var(--sky-text)', whiteSpace: 'nowrap' }}>Active</span>
  )
}

// Collapsible connections card. Header (icon + title + sub + status) toggles the body.
function ConnCard({
  icon, iconBg = 'var(--surface-3)', title, titleExtra, sub, status, open, onToggle,
  locked = false, accent = false, cardStyle, children,
}: {
  icon: React.ReactNode
  iconBg?: string
  title: React.ReactNode
  titleExtra?: React.ReactNode
  sub: React.ReactNode
  status?: React.ReactNode
  open: boolean
  onToggle: () => void
  locked?: boolean
  accent?: boolean
  cardStyle?: React.CSSProperties
  children: React.ReactNode
}) {
  return (
    <div
      className="db-shell-card"
      style={{
        padding: 0, overflow: 'hidden', opacity: locked ? 0.72 : 1,
        ...(accent ? { borderColor: 'var(--sky)', boxShadow: '0 0 0 1px var(--sky)' } : {}),
        ...cardStyle,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 9, background: iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{title}{titleExtra}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
        </div>
        {status}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .26s ease' }}>
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <div style={{ borderTop: '1px solid var(--border)' }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage() {
  const { data: session } = useSession()
  const planTier = (session?.user as any)?.planTier as string | null | undefined

  const [activeTab, setActiveTab] = useState<Tab>('general')

  // Connections cards collapse state — all collapsed by default
  const [openCards, setOpenCards] = useState<Record<string, boolean>>({})
  const toggleCard = (id: string) => setOpenCards((prev) => ({ ...prev, [id]: !prev[id] }))
  // Widget instructions: first-time install vs. update an already-installed widget
  const [widgetMode, setWidgetMode] = useState<'install' | 'update'>('install')

  // General tab state
  const [portalLoading, setPortalLoading] = useState(false)
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)
  const [profile, setProfile] = useState<OrganizationProfile | null>(null)
  const [orgName, setOrgName] = useState('')
  const [orgEmail, setOrgEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Controlled via NEXT_PUBLIC_GBP_API_READY env var
  // Local: add NEXT_PUBLIC_GBP_API_READY=true to .env.local
  // Vercel: add to staging/prod when Google API application is approved
  const GBP_API_READY = process.env.NEXT_PUBLIC_GBP_API_READY === 'true'

  // Portfolio link state
  const [linkCopied, setLinkCopied] = useState(false)
  const [showPortfolioDisc, setShowPortfolioDisc] = useState(false)

  // GBP Review Link state
  const [gbpReviewLinkInput, setGbpReviewLinkInput] = useState('')
  const [gbpReviewLinkSaving, setGbpReviewLinkSaving] = useState(false)
  const [gbpReviewLinkSaved, setGbpReviewLinkSaved] = useState(false)
  const [editingReviewLink, setEditingReviewLink] = useState(false)
  const [showReviewLinkDisc, setShowReviewLinkDisc] = useState(false)

  // AI Business Profile state (Titan only)
  const [aiServices,       setAiServices]       = useState('')
  const [aiProducts,       setAiProducts]       = useState('')
  const [aiServiceArea,    setAiServiceArea]     = useState('')
  const [aiAbout,          setAiAbout]           = useState('')
  const [aiRescanning,     setAiRescanning]      = useState(false)
  const [aiRescanError,    setAiRescanError]     = useState<string | null>(null)
  const [aiRescanSuccess,  setAiRescanSuccess]   = useState(false)
  const isTitan = (planTier ?? '').toLowerCase() === 'titan'

  function parseScanCap(history: string[] | null | undefined): { used: number; daysRemaining: number; nextAvailableAt: Date | null } {
    const now = Date.now()
    const WINDOW = 7 * 24 * 60 * 60 * 1000
    const recent = (history ?? []).filter((ts) => now - new Date(ts).getTime() < WINDOW)
    if (recent.length < 2) return { used: recent.length, daysRemaining: 0, nextAvailableAt: null }
    const oldest = Math.min(...recent.map((ts) => new Date(ts).getTime()))
    const availableAt = new Date(oldest + WINDOW)
    const daysRemaining = Math.ceil((availableAt.getTime() - now) / (24 * 60 * 60 * 1000))
    return { used: recent.length, daysRemaining, nextAvailableAt: availableAt }
  }

  async function handleRescan() {
    setAiRescanning(true)
    setAiRescanError(null)
    setAiRescanSuccess(false)
    try {
      const res = await fetch('/api/agents/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => null)
      if (res.status === 429) {
        setAiRescanError(`Re-scan available in ${data?.daysRemaining ?? '?'} day(s).`)
        return
      }
      if (!res.ok) {
        setAiRescanError('Re-scan failed. Try again or update fields manually.')
        return
      }
      setAiServices(data.services ?? '')
      setAiProducts(data.products ?? '')
      setAiServiceArea(data.serviceArea ?? '')
      setAiAbout(data.businessDescription ?? '')
      // Update profile in state so scan history re-renders
      const profileRes = await fetch('/api/organization/profile')
      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile(profileData.organization)
      }
      setAiRescanSuccess(true)
      setTimeout(() => setAiRescanSuccess(false), 3000)
    } catch {
      setAiRescanError('Re-scan failed. Try again or update fields manually.')
    } finally {
      setAiRescanning(false)
    }
  }

  function handleCopyPortfolioLink() {
    const slug = profile?.slug
    if (!slug) return
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')
    const url = `${baseUrl}/portfolio/${slug}?utm_source=gbp&utm_medium=profile`
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }

  // Website Integration (widget) card state — Titan only
  const hasWebsiteIntegration = tierHasFeature(planTier, 'website_integration')
  const [portfolioUrlInput,   setPortfolioUrlInput]   = useState('')
  const [portfolioUrlSaving,  setPortfolioUrlSaving]  = useState(false)
  const [portfolioUrlError,   setPortfolioUrlError]   = useState<string | null>(null)
  const [portfolioUrlEditing, setPortfolioUrlEditing] = useState(false)
  const [showUrlInstructions, setShowUrlInstructions] = useState(false)
  const [showEmbedInstructions, setShowEmbedInstructions] = useState(false)
  const [widgetPlatform,      setWidgetPlatform]      = useState<string>('WordPress')
  const [embedCopied,         setEmbedCopied]         = useState(false)
  const [introEditing,        setIntroEditing]        = useState(false)
  const [introText,           setIntroText]           = useState('')
  const [introSaving,         setIntroSaving]         = useState(false)
  const [titleCopied,         setTitleCopied]         = useState(false)
  const [metaCopied,          setMetaCopied]          = useState(false)
  const [widgetJobs,          setWidgetJobs]          = useState<WidgetJobsSummary | null>(null)

  // Load recent published jobs summary (drives intro preview + title/meta templates).
  // Reuses the public embed API so the preview always matches what the widget renders.
  useEffect(() => {
    if (!hasWebsiteIntegration || !profile?.slug) return
    fetch(`/api/embed/${profile.slug}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.jobs) return
        const jobs = d.jobs as Array<{ jobType: string; city: string | null; state: string | null }>
        const types = byFrequency(jobs.map((j) => (j.jobType || '').trim()).filter(Boolean))
        const cities = byFrequency(jobs.map((j) => (j.city || '').trim()).filter(Boolean))
        const primaryCityJob = jobs.find((j) => (j.city || '').trim() === cities[0])
        setWidgetJobs({
          introDefault: d.org?.introDefault ?? null,
          primaryType: types[0] ?? null,
          primaryCity: cities[0] ?? null,
          primaryState: primaryCityJob?.state?.trim() || null,
          types,
          cities,
        })
      })
      .catch(() => {})
  }, [hasWebsiteIntegration, profile?.slug])

  async function handleSavePortfolioUrl() {
    const url = portfolioUrlInput.trim()
    setPortfolioUrlError(null)
    if (url) {
      let valid = false
      try {
        const parsed = new URL(url)
        valid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch { valid = false }
      if (!valid) {
        setPortfolioUrlError('Enter a full URL starting with https:// (e.g. https://yourwebsite.com/our-work)')
        return
      }
    }
    setPortfolioUrlSaving(true)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioPageUrl: url || null }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setProfile((prev) => prev ? { ...prev, portfolioPageUrl: data.organization.portfolioPageUrl } : prev)
      setPortfolioUrlEditing(false)
    } catch (err: any) {
      setPortfolioUrlError(err.message || 'Failed to save')
    } finally {
      setPortfolioUrlSaving(false)
    }
  }

  async function handleRemovePortfolioUrl() {
    setPortfolioUrlError(null)
    setPortfolioUrlSaving(true)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioPageUrl: null }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to remove')
      setProfile((prev) => prev ? { ...prev, portfolioPageUrl: data.organization.portfolioPageUrl } : prev)
      setPortfolioUrlInput('')
      setPortfolioUrlEditing(false)
    } catch (err: any) {
      setPortfolioUrlError(err.message || 'Failed to remove')
    } finally {
      setPortfolioUrlSaving(false)
    }
  }

  async function handleSaveIntro(value: string | null) {
    setIntroSaving(true)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioIntro: value }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setProfile((prev) => prev ? { ...prev, portfolioIntro: data.organization.portfolioIntro } : prev)
      setIntroEditing(false)
    } catch {
      // keep editor open so the user can retry
    } finally {
      setIntroSaving(false)
    }
  }

  function handleCopyEmbedCode() {
    if (!profile?.slug) return
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')
    const snippet = `<!-- ProjectCheckin: Website Integration for Local SEO -->\n<div id="pc-widget" data-org="${profile.slug}"></div>\n<script src="${baseUrl}/widget.v1.js" defer></script>`
    navigator.clipboard.writeText(snippet).then(() => {
      setEmbedCopied(true)
      setTimeout(() => setEmbedCopied(false), 2000)
    })
  }

  // Hosted subdomain (CNAME) card state — Titan only
  const [sdLabel,        setSdLabel]        = useState('our-work')
  const [sdHost,         setSdHost]         = useState<string | null>(null)
  const [sdStatus,       setSdStatus]       = useState<string | null>(null)
  const [sdApex,         setSdApex]         = useState<string | null>(null)
  const [sdCnameTarget,  setSdCnameTarget]  = useState('cname.vercel-dns.com')
  const [sdSaving,       setSdSaving]       = useState(false)
  const [sdError,        setSdError]        = useState<string | null>(null)
  const [sdEditing,      setSdEditing]      = useState(false)
  const [showSdSteps,    setShowSdSteps]    = useState(false)
  const [sdTargetCopied, setSdTargetCopied] = useState(false)
  const [sdHomepageLinked, setSdHomepageLinked] = useState<boolean | null>(null)
  const [sdCheckingLink,   setSdCheckingLink]   = useState(false)
  const [showSdLinkSteps,  setShowSdLinkSteps]  = useState(false)

  useEffect(() => {
    if (!hasWebsiteIntegration) return
    fetch('/api/organization/subdomain')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setSdHost(d.customSubdomain ?? null)
        setSdStatus(d.subdomainStatus ?? null)
        setSdApex(d.apexDomain ?? null)
        setSdHomepageLinked(d.homepageLinked ?? null)
        if (d.cnameTarget) setSdCnameTarget(d.cnameTarget)
        if (d.customSubdomain && d.apexDomain) {
          setSdLabel(d.customSubdomain.replace(`.${d.apexDomain}`, ''))
        }
      })
      .catch(() => {})
  }, [hasWebsiteIntegration])

  function handleRecheckHomepageLink() {
    setSdCheckingLink(true)
    fetch('/api/organization/subdomain')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setSdHomepageLinked(d.homepageLinked ?? null) })
      .catch(() => {})
      .finally(() => setSdCheckingLink(false))
  }

  // While pending, re-check every 30s — the API promotes to verified once
  // the CNAME resolves and Vercel confirms the domain
  useEffect(() => {
    if (sdStatus !== 'pending') return
    const t = setInterval(() => {
      fetch('/api/organization/subdomain')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!d?.subdomainStatus) return
          setSdStatus(d.subdomainStatus)
          setSdHomepageLinked(d.homepageLinked ?? null)
        })
        .catch(() => {})
    }, 30000)
    return () => clearInterval(t)
  }, [sdStatus])

  async function handleSaveSubdomain() {
    setSdError(null)
    setSdSaving(true)
    try {
      const res = await fetch('/api/organization/subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: sdLabel }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setSdHost(data.customSubdomain)
      setSdStatus(data.subdomainStatus)
      setSdApex(data.apexDomain)
      setSdHomepageLinked(null)
      if (data.cnameTarget) setSdCnameTarget(data.cnameTarget)
      setSdEditing(false)
    } catch (err: any) {
      setSdError(err.message || 'Failed to save')
    } finally {
      setSdSaving(false)
    }
  }

  async function handleRemoveSubdomain() {
    if (!confirm('Removing takes your branded page offline and frees the subdomain. Your jobs and data stay safe in ProjectCheckin — you can set it up again anytime. Continue?')) return
    setSdError(null)
    setSdSaving(true)
    try {
      const res = await fetch('/api/organization/subdomain', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setSdHost(null)
      setSdStatus(null)
      setSdHomepageLinked(null)
      setSdEditing(false)
      setSdLabel('our-work')
    } catch (err: any) {
      setSdError(err.message || 'Could not remove right now. Please try again.')
    } finally {
      setSdSaving(false)
    }
  }

  function handleCopyCnameTarget() {
    navigator.clipboard.writeText(sdCnameTarget).then(() => {
      setSdTargetCopied(true)
      setTimeout(() => setSdTargetCopied(false), 1500)
    })
  }

  // WordPress native publishing card state — Titan only
  const [wpSiteUrl,      setWpSiteUrl]      = useState('')
  const [wpUsername,     setWpUsername]     = useState('')
  const [wpPassword,     setWpPassword]     = useState('')
  const [wpStatus,       setWpStatus]       = useState<string | null>(null)
  const [wpConnectedUrl, setWpConnectedUrl] = useState<string | null>(null)
  const [wpSyncedCount,  setWpSyncedCount]  = useState(0)
  const [wpFailedCount,  setWpFailedCount]  = useState(0)
  const [wpSaving,       setWpSaving]       = useState(false)
  const [wpError,        setWpError]        = useState<string | null>(null)
  const [wpDisconnecting, setWpDisconnecting] = useState(false)
  const [showWpSteps,    setShowWpSteps]    = useState(false)

  // WordPress existing-page injection (Phase 3b)
  type PageMapping = {
    id: string
    matchCity: string | null
    matchState: string | null
    matchService: string | null
    wpPageUrl: string
    wpPageType: string
    builderBlocked: boolean
    markerMode: string
  }
  type LocationOpt = { city: string; state: string | null }
  const [wpMappings,       setWpMappings]       = useState<PageMapping[]>([])
  const [wpCreateNewPosts, setWpCreateNewPosts] = useState(true)
  const [wpLocations,      setWpLocations]      = useState<LocationOpt[]>([])
  const [wpServices,       setWpServices]       = useState<string[]>([])
  const [wpAddOpen,        setWpAddOpen]        = useState(false)
  const [wpAddLocation,    setWpAddLocation]    = useState('') // "city|state", '' = any
  const [wpAddService,     setWpAddService]     = useState('') // service, '' = any
  const [wpAddUrl,         setWpAddUrl]         = useState('')
  const [wpAddSaving,      setWpAddSaving]      = useState(false)
  const [wpAddError,       setWpAddError]       = useState<string | null>(null)
  const [wpNotice,         setWpNotice]         = useState<string | null>(null)
  const [wpMarkerCopied,   setWpMarkerCopied]   = useState(false)
  const [wpMarkerHowToOpen, setWpMarkerHowToOpen] = useState(false)
  const [wpDisableModalOpen, setWpDisableModalOpen] = useState(false)
  const WP_MARKER = '<!-- projectcheckin:start --><!-- projectcheckin:end -->'

  useEffect(() => {
    if (!hasWebsiteIntegration) return
    fetch('/api/organization/wordpress')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setWpStatus(d.wpConnectionStatus ?? null)
        setWpConnectedUrl(d.wpSiteUrl ?? null)
        setWpUsername(d.wpUsername ?? '')
        setWpSyncedCount(d.syncedCount ?? 0)
        setWpFailedCount(d.failedCount ?? 0)
        if (d.wpSiteUrl) setWpSiteUrl(d.wpSiteUrl)
      })
      .catch(() => {})
  }, [hasWebsiteIntegration])

  async function handleConnectWordPress() {
    setWpError(null)
    setWpSaving(true)
    try {
      const res = await fetch('/api/organization/wordpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteUrl: wpSiteUrl,
          username: wpUsername,
          applicationPassword: wpPassword,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Connection failed — double-check your site address and Application Password, then try again.')
      setWpStatus('connected')
      setWpConnectedUrl(data.wpSiteUrl)
      setWpPassword('') // never keep the credential in component state after use
    } catch (err: any) {
      setWpError(err.message)
      setWpStatus('failed')
    } finally {
      setWpSaving(false)
    }
  }

  async function handleDisconnectWordPress() {
    setWpDisconnecting(true)
    try {
      const res = await fetch('/api/organization/wordpress', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to disconnect')
      setWpStatus(null)
      setWpConnectedUrl(null)
      setWpPassword('')
      setWpSyncedCount(0)
      setWpFailedCount(0)
    } catch {
      setWpError('Could not disconnect right now. Please try again.')
    } finally {
      setWpDisconnecting(false)
    }
  }

  // Existing-page mappings load once the WordPress connection is live.
  async function reloadWpMappings() {
    try {
      const r = await fetch('/api/organization/wordpress/pages')
      if (!r.ok) return
      const d = await r.json()
      setWpMappings(d.mappings ?? [])
      setWpCreateNewPosts(d.wpCreateNewPosts ?? true)
      setWpLocations(d.locations ?? [])
      setWpServices(d.services ?? [])
    } catch {}
  }

  useEffect(() => {
    if (!hasWebsiteIntegration || wpStatus !== 'connected') return
    reloadWpMappings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWebsiteIntegration, wpStatus])

  async function applyWpCreateNewPosts(next: boolean) {
    setWpCreateNewPosts(next) // optimistic
    try {
      const r = await fetch('/api/organization/wordpress/pages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpCreateNewPosts: next }),
      })
      if (!r.ok) setWpCreateNewPosts(!next) // revert on failure
    } catch {
      setWpCreateNewPosts(!next)
    }
  }

  function toggleWpCreateNewPosts() {
    // Turning OFF is discouraged — warn first. Turning back ON is immediate.
    if (wpCreateNewPosts) {
      setWpDisableModalOpen(true)
    } else {
      applyWpCreateNewPosts(true)
    }
  }

  async function handleAddMapping() {
    setWpAddError(null)
    setWpNotice(null)
    if (!wpAddUrl.trim()) {
      setWpAddError('Paste the URL of your existing page.')
      return
    }
    setWpAddSaving(true)
    try {
      const [city, state] = wpAddLocation ? wpAddLocation.split('|') : ['', '']
      const r = await fetch('/api/organization/wordpress/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: wpAddUrl.trim(),
          matchCity: city || null,
          matchState: state || null,
          matchService: wpAddService || null,
        }),
      })
      const d = await r.json().catch(() => null)
      if (!r.ok) throw new Error(d?.error || 'Could not save that page.')
      await reloadWpMappings()
      setWpAddOpen(false)
      setWpAddUrl('')
      setWpAddLocation('')
      setWpAddService('')
      if (d?.builderNotice) {
        setWpNotice("That page was built with a page builder, so we'll create new posts for those jobs instead. No action needed.")
      } else if (d?.overlapWarning) {
        setWpNotice('Heads up: another page already targets the same location and service. The most specific match wins.')
      }
    } catch (err: any) {
      setWpAddError(err.message)
    } finally {
      setWpAddSaving(false)
    }
  }

  async function handleRemoveMapping(id: string) {
    if (!confirm('Remove this page? Your recent work will no longer be added to it. Your page itself is never changed or deleted.')) return
    try {
      const r = await fetch(`/api/organization/wordpress/pages?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (r.ok) await reloadWpMappings()
    } catch {}
  }

  // Connections tab state (localStorage-backed, Phase 1)
  const [gbpConnected, setGbpConnected] = useState(false)
  const [postMode, setPostMode] = useState<'draft' | 'auto'>('draft')
  const [servicesSync, setServicesSync] = useState(false)
  const [showServicesTip, setShowServicesTip] = useState(false)

  // ── Google Search Console (Elite + Titan) ──
  // Status mirrors Organization.gscConnectionStatus:
  //   'connected' | 'select_property' | 'no_properties' | null (never connected)
  const hasGsc = tierHasFeature(planTier, 'gsc_integration')
  const [gscStatus, setGscStatus] = useState<string | null>(null)
  const [gscPropertyUrl, setGscPropertyUrl] = useState<string | null>(null)
  const [gscProperties, setGscProperties] = useState<string[]>([])
  const [gscChoice, setGscChoice] = useState('')
  const [gscBusy, setGscBusy] = useState(false)
  const [gscError, setGscError] = useState<string | null>(null)

  async function reloadGscStatus() {
    try {
      const res = await fetch('/api/organization/gsc')
      if (!res.ok) return
      const data = await res.json()
      setGscStatus(data.status ?? null)
      setGscPropertyUrl(data.propertyUrl ?? null)
      // The picker is only meaningful mid-handshake, so the property list is
      // fetched on demand rather than on every Account page load.
      if (data.status === 'select_property') {
        const listRes = await fetch('/api/organization/gsc/properties')
        if (listRes.ok) {
          const list = await listRes.json()
          setGscProperties(list.properties ?? [])
          setGscChoice(list.properties?.[0] ?? '')
        }
      }
    } catch { /* leave prior status visible rather than flashing an error */ }
  }

  async function handleGscConnect() {
    setGscBusy(true)
    setGscError(null)
    try {
      const res = await fetch('/api/organization/gsc', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.consentUrl) {
        setGscError(data?.error || 'Could not start the connection. Please try again.')
        setGscBusy(false)
        return
      }
      // Full navigation, not a router push — this leaves the app for Google.
      window.location.assign(data.consentUrl)
    } catch {
      setGscError('Could not start the connection. Please try again.')
      setGscBusy(false)
    }
  }

  async function handleGscSelectProperty() {
    if (!gscChoice) return
    setGscBusy(true)
    setGscError(null)
    try {
      const res = await fetch('/api/organization/gsc', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyUrl: gscChoice }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGscError(data?.error || 'Could not save your selection.')
      } else {
        setGscStatus('connected')
        setGscPropertyUrl(data.propertyUrl)
      }
    } catch {
      setGscError('Could not save your selection.')
    } finally {
      setGscBusy(false)
    }
  }

  async function handleGscDisconnect() {
    if (!confirm('Disconnect Google Search Console? Your search data will stop showing in Reporting.')) return
    setGscBusy(true)
    setGscError(null)
    try {
      const res = await fetch('/api/organization/gsc', { method: 'DELETE' })
      if (res.ok) {
        setGscStatus(null)
        setGscPropertyUrl(null)
        setGscProperties([])
      } else {
        setGscError('Could not disconnect. Please try again.')
      }
    } catch {
      setGscError('Could not disconnect. Please try again.')
    } finally {
      setGscBusy(false)
    }
  }

  // Re-check after returning from Google's consent screen. The callback route
  // redirects to /account?gsc=<outcome>; the param is stripped afterwards so a
  // refresh doesn't replay a stale outcome message.
  useEffect(() => {
    if (!hasGsc) return
    const outcome = new URLSearchParams(window.location.search).get('gsc')
    if (outcome === 'denied') {
      setGscError('You cancelled the Google connection. Nothing was changed.')
    } else if (outcome === 'failed') {
      setGscError('We could not finish connecting to Google. Please try again.')
    }
    if (outcome) {
      setActiveTab('connections')
      setOpenCards((prev) => ({ ...prev, gsc: true }))
      window.history.replaceState({}, '', '/account')
    }
    reloadGscStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGsc])

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/organization/profile')
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Failed to load profile')
        }
        const data = await res.json()
        const org: OrganizationProfile = data.organization
        setProfile(org)
        setOrgName(org.name || '')
        setOrgEmail(org.email || '')
        setPhone(org.phone || '')
        setWebsite(org.website || '')
        setGbpReviewLinkInput(org.gbpReviewLink || '')
        setPortfolioUrlInput(org.portfolioPageUrl || '')
        // Parse AI business context if present
        if (org.businessContext) {
          try {
            const ctx = JSON.parse(org.businessContext)
            setAiServices(ctx.services ?? '')
            setAiProducts(ctx.products ?? '')
            setAiServiceArea(ctx.serviceArea ?? '')
            setAiAbout(ctx.businessDescription ?? '')
          } catch { /* ignore malformed */ }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    loadProfile()

    // Load GBP preferences from localStorage
    setGbpConnected(localStorage.getItem('gbp_connected') === 'true')
    setPostMode((localStorage.getItem('gbp_post_mode') as 'draft' | 'auto') || 'draft')
    setServicesSync(localStorage.getItem('gbp_services_sync') === 'true')
  }, [])

  function handlePostModeChange(mode: 'draft' | 'auto') {
    setPostMode(mode)
    localStorage.setItem('gbp_post_mode', mode)
  }

  function handleServicesSyncToggle() {
    const next = !servicesSync
    setServicesSync(next)
    localStorage.setItem('gbp_services_sync', String(next))
  }

  function handleGbpConnect() {
    // Phase 1: localStorage-only. Phase 2: real OAuth flow.
    const next = !gbpConnected
    setGbpConnected(next)
    localStorage.setItem('gbp_connected', String(next))
    if (!next) {
      // Reset controls on disconnect
      setPostMode('draft')
      setServicesSync(false)
      localStorage.removeItem('gbp_post_mode')
      localStorage.removeItem('gbp_services_sync')
    }
  }

  async function handleSaveGbpReviewLink() {
    const link = gbpReviewLinkInput.trim()
    setGbpReviewLinkSaving(true)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gbpReviewLink: link || null }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save')
      setProfile((prev) => prev ? { ...prev, gbpReviewLink: data.organization.gbpReviewLink } : prev)
      setEditingReviewLink(false)
      setGbpReviewLinkSaved(true)
      setTimeout(() => setGbpReviewLinkSaved(false), 2000)
    } catch {
      // no-op — input stays open so user can retry
    } finally {
      setGbpReviewLinkSaving(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        window.location.href = '/subscribe'
        return
      }
      window.location.href = data.url
    } catch {
      window.location.href = '/subscribe'
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName.trim() || undefined,
          email: orgEmail.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          ...(isTitan && {
            services: aiServices,
            products: aiProducts,
            serviceArea: aiServiceArea,
            businessDescription: aiAbout,
          }),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to update profile')
      const updated: OrganizationProfile = data.organization
      setProfile(updated)
      setOrgName(updated.name || '')
      setOrgEmail(updated.email || '')
      setPhone(updated.phone || '')
      setWebsite(updated.website || '')
      setMessage('Business profile updated.')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardShell title="Account">

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {(['general', 'team', 'billing', 'connections'] as Tab[]).map((tab) => (
          <button key={tab} style={subTabStyle(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── GENERAL TAB ── */}
      {activeTab === 'general' && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Business Profile</div>

          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--t3)' }}>Loading...</p>
          ) : error && !profile ? (
            <p className="db-shell-alert-error">{error}</p>
          ) : !profile ? (
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>No organization profile linked to this account.</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="business-name" className="db-shell-label">Business Name</label>
                <input
                  id="business-name"
                  type="text"
                  className="db-shell-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Your Company Name"
                  required
                />
              </div>

              <div>
                <label htmlFor="business-email" className="db-shell-label">Company Email</label>
                <input
                  id="business-email"
                  type="email"
                  className="db-shell-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={orgEmail}
                  onChange={(e) => setOrgEmail(e.target.value)}
                  placeholder="info@yourcompany.com"
                />
              </div>

              <div>
                <label htmlFor="business-phone" className="db-shell-label">Company Phone</label>
                <input
                  id="business-phone"
                  type="tel"
                  className="db-shell-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="business-website" className="db-shell-label">Business Website</label>
                <input
                  id="business-website"
                  type="text"
                  className="db-shell-input"
                  style={{ width: '100%', minWidth: 0 }}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="yourwebsite.com"
                />
              </div>

              {/* \u2500\u2500 AI Business Profile (Titan only) \u2500\u2500 */}
              {isTitan && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 18, marginTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>AI Business Profile</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 10.5, fontWeight: 700, background: '#FFF7ED', color: '#C2410C', border: '1px solid #FED7AA' }}>Titan</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.55, marginBottom: 16 }}>
                      Used by the AI copywriting agent to write accurate job descriptions. Populated automatically from your website {'\u2014'} edit anytime.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                      <div>
                        <label htmlFor="ai-services" className="db-shell-label">Services offered</label>
                        <input id="ai-services" type="text" className="db-shell-input" style={{ width: '100%', minWidth: 0 }} value={aiServices} onChange={(e) => setAiServices(e.target.value)} placeholder="e.g. Door installation, garage doors, storm doors" />
                      </div>
                      <div>
                        <label htmlFor="ai-products" className="db-shell-label">Products / brands</label>
                        <input id="ai-products" type="text" className="db-shell-input" style={{ width: '100%', minWidth: 0 }} value={aiProducts} onChange={(e) => setAiProducts(e.target.value)} placeholder="e.g. Therma-Tru, Pella, Emtek hardware" />
                      </div>
                      <div>
                        <label htmlFor="ai-service-area" className="db-shell-label">Service area</label>
                        <input id="ai-service-area" type="text" className="db-shell-input" style={{ width: '100%', minWidth: 0 }} value={aiServiceArea} onChange={(e) => setAiServiceArea(e.target.value)} placeholder="e.g. Huntsville, AL and surrounding areas" />
                      </div>
                      <div>
                        <label htmlFor="ai-about" className="db-shell-label">About your business</label>
                        <textarea id="ai-about" className="db-shell-input" style={{ width: '100%', minWidth: 0, height: 'auto', padding: '9px 13px', resize: 'vertical' }} rows={3} value={aiAbout} onChange={(e) => setAiAbout(e.target.value)} placeholder="1\u20132 sentences about what you do and who you serve." />
                      </div>
                    </div>

                    {/* Re-scan button */}
                    {(() => {
                      const { used, daysRemaining, nextAvailableAt } = parseScanCap(profile?.websiteScanHistory)
                      const capped = used >= 2
                      const lastScanned = profile?.businessContextUpdatedAt
                        ? new Date(profile.businessContextUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : null
                      return (
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
                            <button
                              type="button"
                              onClick={handleRescan}
                              disabled={capped || aiRescanning}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: capped || aiRescanning ? 'not-allowed' : 'pointer', background: aiRescanSuccess ? 'var(--green)' : 'var(--surface-3)', color: aiRescanSuccess ? '#fff' : 'var(--t2)', border: '1px solid var(--border)', opacity: capped ? 0.55 : 1, transition: 'background .15s, color .15s' }}
                            >
                              {aiRescanning ? (
                                <>
                                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/><path d="M12 2a10 10 0 0110 10"/></svg>
                                  Scanning\u2026
                                </>
                              ) : aiRescanSuccess ? (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                  Scanned!
                                </>
                              ) : (
                                <>
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
                                  Re-scan my website
                                </>
                              )}
                            </button>
                            {lastScanned && <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>Last scanned {lastScanned}</span>}
                          </div>
                          {capped && nextAvailableAt && (
                            <span style={{ fontSize: 11.5, color: '#B45309' }}>
                              Re-scan available in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} ({nextAvailableAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                            </span>
                          )}
                          {!capped && (
                            <span style={{ fontSize: 11.5, color: 'var(--t3)' }}>{2 - used} of 2 re-scans available this week</span>
                          )}
                          {aiRescanError && <span style={{ fontSize: 12, color: 'var(--red)' }}>{aiRescanError}</span>}
                        </div>
                      )
                    })()}
                  </div>
                </>
              )}

              {message && <div className="db-shell-alert-success">{message}</div>}
              {error && <div className="db-shell-alert-error">{error}</div>}

              <button
                type="submit"
                disabled={saving}
                className="db-shell-btn"
                style={{ alignSelf: 'flex-start', minWidth: 120 }}
              >
                {saving ? 'Saving\u2026' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ── TEAM TAB ── */}
      {activeTab === 'team' && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Team Members</div>
          <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
            Manage your team members and their access levels.
          </p>
          <a
            href="/dashboard/team"
            className="db-shell-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
          >
            Manage Team
            <ChevronRight />
          </a>
        </div>
      )}

      {/* ── BILLING TAB ── */}
      {activeTab === 'billing' && (
        <div className="db-shell-card" style={{ maxWidth: 520 }}>
          <div className="db-shell-card-title">Subscription</div>

          {planTier ? (
            <>
              <p style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 16 }}>
                Current plan: <strong style={{ color: 'var(--t1)' }}>{PLAN_LABELS[planTier] ?? planTier}</strong>
              </p>

              {planTier === 'free' ? (
                <a
                  href="/subscribe"
                  className="db-shell-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                >
                  Upgrade Plan
                  <ChevronRight />
                </a>
              ) : (
                <button
                  onClick={() => setShowDowngradeWarning(true)}
                  disabled={portalLoading}
                  className="db-shell-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  {portalLoading ? 'Opening\u2026' : 'Manage Subscription'}
                  {!portalLoading && <ChevronRight />}
                </button>
              )}
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 10 }}>
                {planTier === 'free'
                  ? 'Upgrade anytime. No contracts.'
                  : 'Change or cancel your plan anytime through the billing portal.'}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>No active subscription found.</p>
          )}
        </div>
      )}

      {/* ── CONNECTIONS TAB ── */}
      {activeTab === 'connections' && (
        <div style={{ maxWidth: 560 }}>

          {/* ── Connect Your Google Business Profile ── */}
          <ConnCard
            icon={<GoogleGIcon />}
            title="Connect Your Google Business Profile"
            sub="Publish job updates to your Google listing"
            status={!GBP_API_READY ? <StatusDot state="coming" label="Coming soon" /> : gbpConnected ? <StatusDot state="active" label="Active" /> : <StatusDot state="disabled" label="Disabled" />}
            open={!!openCards['gbp']}
            onToggle={() => toggleCard('gbp')}
            locked={!GBP_API_READY}
          >
            <div style={{ padding: '16px 20px', borderBottom: GBP_API_READY && !gbpConnected ? '1px solid var(--border)' : undefined }}>
              <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                Businesses with active GBP posts get <strong style={{ color: 'var(--t1)' }}>42% more direction requests</strong> and <strong style={{ color: 'var(--t1)' }}>35% more website clicks</strong>. — Google
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                {[
                  'Every published job creates a Google Business post automatically',
                  'Posts include your job photo, location, and work description',
                  'Keeps your profile active — Google rewards consistent posting',
                ].map((txt, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
                    <div style={{ width: 20, height: 20, background: 'var(--sky-dim)', color: 'var(--sky-text)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    {txt}
                  </div>
                ))}
              </div>
              {!GBP_API_READY ? (
                <button disabled style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: 'var(--surface-3)', color: 'var(--t3)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'not-allowed' }}>
                  <GoogleWordmark />
                  Connect Google Business — Coming Soon
                </button>
              ) : !gbpConnected ? (
                <button onClick={handleGbpConnect} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 8, background: '#fff', color: '#3c4043', border: '1px solid #dadce0', boxShadow: '0 1px 2px rgba(0,0,0,.08)', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer' }}>
                  <GoogleWordmark />
                  Connect Google Business Profile
                </button>
              ) : null}
            </div>
            {GBP_API_READY && gbpConnected && (
              <>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Posting mode</div>
                  <div style={{ display: 'flex', gap: 18, marginBottom: 6 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                      <input type="radio" name="postMode" value="auto" checked={postMode === 'auto'} onChange={() => handlePostModeChange('auto')} />
                      Auto-publish
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--t2)', cursor: 'pointer' }}>
                      <input type="radio" name="postMode" value="draft" checked={postMode === 'draft'} onChange={() => handlePostModeChange('draft')} />
                      Review before posting
                    </label>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                    {postMode === 'auto' ? 'Posts go live on Google immediately when you publish a job.' : 'You approve each post from the job card before it goes live on Google.'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Sync services list</span>
                      <div style={{ position: 'relative', display: 'inline-flex' }}>
                        <button onMouseEnter={() => setShowServicesTip(true)} onMouseLeave={() => setShowServicesTip(false)} onFocus={() => setShowServicesTip(true)} onBlur={() => setShowServicesTip(false)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center' }} aria-label="What does sync services list do?">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        </button>
                        {showServicesTip && (
                          <div style={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8, width: 260, background: 'var(--t1)', color: 'var(--surface)', borderRadius: 8, padding: '10px 12px', fontSize: 12, lineHeight: 1.55, boxShadow: '0 4px 16px rgba(0,0,0,.2)', zIndex: 100, pointerEvents: 'none' }}>
                            Your Google Business Profile has a &ldquo;Services&rdquo; section that lists what you do — like <em>Door Installation</em> or <em>Garage Doors</em>. When this is on, ProjectCheckin automatically keeps that list updated to match the trade types in your account.
                            <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 10, height: 10, background: 'var(--t1)', clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3, lineHeight: 1.5 }}>Auto-update your GBP services to match your trade types.</div>
                  </div>
                  <Toggle checked={servicesSync} onChange={handleServicesSyncToggle} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Disconnect</div>
                    <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 3 }}>Remove ProjectCheckin&apos;s access to your Google Business Profile.</div>
                  </div>
                  <button onClick={handleGbpConnect} style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(220,38,38,.2)', flexShrink: 0 }}>
                    Disconnect
                  </button>
                </div>
              </>
            )}
          </ConnCard>

          {/* ── Enable Google Business Review Requests ── */}
          <ConnCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="var(--amber)" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
            title="Enable Google Business Review Requests"
            sub="Send customers directly to your Google Business Review page"
            status={profile?.gbpReviewLink ? <StatusDot state="active" label="Active" /> : <StatusDot state="disabled" label="Disabled" />}
            open={!!openCards['review']}
            onToggle={() => toggleCard('review')}
          >
            <div style={{ padding: '16px 20px' }}>
              {profile?.gbpReviewLink && !editingReviewLink ? (
                /* Saved state */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                      Review link active
                    </span>
                    <button
                      onClick={() => { setEditingReviewLink(true); setGbpReviewLinkInput(profile?.gbpReviewLink || '') }}
                      style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      Edit
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'monospace', letterSpacing: '-0.2px' }}>
                    {profile.gbpReviewLink}
                  </div>
                </>
              ) : (
                /* Input state */
                <>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 12 }}>
                    Paste your Google Business review link below and click save — you&apos;ll have full control over when, how, and who your review requests are sent to in your Dashboard.
                  </p>
                  <input
                    type="url"
                    value={gbpReviewLinkInput}
                    onChange={(e) => setGbpReviewLinkInput(e.target.value)}
                    placeholder="https://g.page/r/XXXXXXXXXXXXXXXX/review"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none', marginBottom: 10 }}
                  />
                  <button
                    onClick={handleSaveGbpReviewLink}
                    disabled={gbpReviewLinkSaving || !gbpReviewLinkInput.trim()}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: gbpReviewLinkSaving || !gbpReviewLinkInput.trim() ? 'not-allowed' : 'pointer', background: gbpReviewLinkSaved ? 'var(--green)' : 'var(--sky-text)', color: '#fff', border: 'none', transition: 'background .15s', opacity: !gbpReviewLinkInput.trim() ? 0.5 : 1 }}
                  >
                    {gbpReviewLinkSaving ? 'Saving\u2026' : gbpReviewLinkSaved ? 'Saved!' : 'Save'}
                  </button>
                </>
              )}

              {/* Collapsible: how to find */}
              <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
                <button
                  onClick={() => setShowReviewLinkDisc(!showReviewLinkDisc)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    How to find your Google review link
                  </span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: showReviewLinkDisc ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showReviewLinkDisc && (
                  <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                    {([
                      'Go to business.google.com and sign in.',
                      'Select your business, then click Ask for reviews in the left menu (or Home page).',
                    ] as const).map((txt, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                        <div>{txt}</div>
                      </div>
                    ))}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>3</div>
                      <div>Copy the link that appears — it looks like <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--t1)' }}>g.page/r/&hellip;/review</span>. Paste it above.</div>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                      This link sends homeowners straight to the 5-star review form — no searching required.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ConnCard>

          {/* ── Website Integration for Local SEO — family: mutually exclusive, Good/Better/Best ── */}
          {hasWebsiteIntegration && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'var(--surface)', padding: '16px 16px 4px', marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '2px 4px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--t3)' }}>Website Integration for Local SEO</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', marginTop: 5 }}>Put your jobs on your own website</div>
                </div>
                <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: 'var(--surface-3)', color: 'var(--t2)' }}>Titan</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginTop: 6 }}>Three ways to show your published jobs on your own site and build local SEO. You only need <strong style={{ color: 'var(--t1)', fontWeight: 700 }}>one at a time</strong> — at onboarding we set you up with the strongest option your website supports, and you can switch whenever you like.</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 9 }}>Listed weakest to strongest for SEO: Good, Better, Best.</div>
            </div>

            {/* GOOD · Embed widget (works on any website) */}
            <ConnCard
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
              title="Add a Jobs Gallery to Any Website"
              titleExtra={<TierLabel label="Good" />}
              sub="Paste one snippet — your published jobs appear automatically in a gallery on your site. Works anywhere."
              status={profile?.portfolioPageUrl ? <ActiveTag /> : undefined}
              accent={!!profile?.portfolioPageUrl}
              open={!!openCards['widget']}
              onToggle={() => toggleCard('widget')}
              cardStyle={{ marginBottom: 12 }}
            >

              {/* Section 1: Portfolio page URL */}
              <div style={{ padding: '14px 20px' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Paste your portfolio page URL here</div>
                <button
                  onClick={() => setShowUrlInstructions(!showUrlInstructions)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Instructions
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: showUrlInstructions ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showUrlInstructions && (
                  <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 12 }}>
                    Create a page on your website (e.g. yourwebsite.com/our-work) and paste its URL here. This is where your new portfolio of work will show up on your website and will automatically start generating local SEO for your page. You can always opt out at any time if you&apos;d like, and remove the page.
                  </div>
                )}
                {(profile?.portfolioPageUrl && !portfolioUrlEditing) ? (
                  /* Saved state — Edit / Remove */
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                        Saved
                      </span>
                      <span style={{ display: 'inline-flex', gap: 14, marginLeft: 'auto' }}>
                        <button
                          onClick={() => { setPortfolioUrlInput(profile?.portfolioPageUrl || ''); setPortfolioUrlEditing(true); setPortfolioUrlError(null) }}
                          style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit
                        </button>
                        <button
                          onClick={handleRemovePortfolioUrl}
                          disabled={portfolioUrlSaving}
                          style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--red)', cursor: portfolioUrlSaving ? 'default' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                          Remove
                        </button>
                      </span>
                    </div>
                    <a href={profile.portfolioPageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11.5, color: 'var(--sky-text)', fontFamily: 'monospace', letterSpacing: '-0.2px', wordBreak: 'break-all', textDecoration: 'none' }}>{profile.portfolioPageUrl}</a>
                  </>
                ) : (
                  /* Input state (empty or editing) */
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="url"
                      value={portfolioUrlInput}
                      onChange={(e) => { setPortfolioUrlInput(e.target.value); setPortfolioUrlError(null) }}
                      placeholder="https://yourwebsite.com/our-work"
                      style={{ flex: 1, minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none' }}
                    />
                    <button
                      onClick={handleSavePortfolioUrl}
                      disabled={portfolioUrlSaving || !portfolioUrlInput.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', height: 34, borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", border: 'none', cursor: portfolioUrlSaving || !portfolioUrlInput.trim() ? 'default' : 'pointer', background: 'var(--sky-text)', color: '#fff', flexShrink: 0, opacity: !portfolioUrlInput.trim() ? 0.5 : 1 }}
                    >
                      {portfolioUrlSaving ? 'Saving…' : 'Save'}
                    </button>
                    {portfolioUrlEditing && (
                      <button onClick={() => { setPortfolioUrlEditing(false); setPortfolioUrlError(null) }} style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer', flexShrink: 0 }}>Cancel</button>
                    )}
                  </div>
                )}
                {portfolioUrlError && <div style={{ fontSize: 12, color: 'var(--red, #DC2626)', marginTop: 8 }}>{portfolioUrlError}</div>}
              </div>

              {/* Section 2: Embed code */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 8 }}>Add the widget to your website</div>
                <button
                  onClick={() => setShowEmbedInstructions(!showEmbedInstructions)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 10, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Instructions
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: showEmbedInstructions ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showEmbedInstructions && (
                  <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 12 }}>
                    After you create a new page on your website (e.g., yourwebsite.com/our-work), select the website builder by clicking one of the options below. Then, paste the code below into that new page you created. Your published jobs will appear automatically — no updates needed.
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
                  {Object.keys(WIDGET_PLATFORM_INSTRUCTIONS).map((p) => (
                    <button
                      key={p}
                      onClick={() => setWidgetPlatform(p)}
                      style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", border: widgetPlatform === p ? '1px solid rgba(14,165,233,.3)' : '1px solid var(--border)', color: widgetPlatform === p ? 'var(--sky-text)' : 'var(--t3)', background: widgetPlatform === p ? 'var(--sky-dim)' : 'var(--surface)' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'inline-flex', gap: 3, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: 3, marginBottom: 10 }}>
                  {(['install', 'update'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setWidgetMode(m)}
                      style={{ border: 'none', background: widgetMode === m ? 'var(--surface-3)' : 'none', color: widgetMode === m ? 'var(--t1)' : 'var(--t3)', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, padding: '5px 11px', borderRadius: 6, cursor: 'pointer' }}
                    >
                      {m === 'install' ? 'First-time install' : 'Update an installed widget'}
                    </button>
                  ))}
                </div>
                {widgetMode === 'update' && (
                  <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>
                    <strong style={{ color: 'var(--t1)' }}>Already added the widget?</strong> Swap your old snippet for a fresh one — old block out, new block in.
                  </div>
                )}
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 10, whiteSpace: 'pre-line' }}>
                  {(widgetMode === 'update' ? WIDGET_PLATFORM_UPDATE_INSTRUCTIONS : WIDGET_PLATFORM_INSTRUCTIONS)[widgetPlatform]}
                </div>
                <div style={{ background: 'var(--t1)', color: '#7DD3FC', borderRadius: 8, padding: '12px 14px', fontFamily: "'Courier New', monospace", fontSize: 11.5, lineHeight: 1.6, marginBottom: 10, overflowX: 'auto', whiteSpace: 'pre' }}>
                  <span style={{ color: '#4B6378' }}>&lt;!-- ProjectCheckin: Website Integration for Local SEO --&gt;</span>{'\n'}
                  <span style={{ color: '#86EFAC' }}>&lt;div</span> <span style={{ color: '#FCA5A5' }}>id</span>=<span style={{ color: '#FDE68A' }}>&quot;pc-widget&quot;</span> <span style={{ color: '#FCA5A5' }}>data-org</span>=<span style={{ color: '#FDE68A' }}>&quot;{profile?.slug || 'your-business'}&quot;</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/div&gt;</span>{'\n'}
                  <span style={{ color: '#86EFAC' }}>&lt;script</span> <span style={{ color: '#FCA5A5' }}>src</span>=<span style={{ color: '#FDE68A' }}>&quot;{(process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')}/widget.v1.js&quot;</span> <span style={{ color: '#FCA5A5' }}>defer</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/script&gt;</span>
                </div>
                <button
                  onClick={handleCopyEmbedCode}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: 'var(--surface-3)', color: embedCopied ? 'var(--green)' : 'var(--t2)', border: '1px solid var(--border)' }}
                >
                  {embedCopied ? 'Copied!' : 'Copy code'}
                </button>
              </div>

              {/* Section 3: Portfolio page intro */}
              <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--t1)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Portfolio page intro
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--t3)', background: 'var(--surface-3)', padding: '2px 7px', borderRadius: 10 }}>Optional</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 10, lineHeight: 1.55 }}>
                  This paragraph appears at the top of your portfolio page, above your jobs. It&apos;s auto-generated from your business profile. Override it with your own text if you&apos;d like.
                </div>

                {!introEditing ? (
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                      {profile?.portfolioIntro ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: '#D97706', background: '#FFFBEB', border: '1px solid rgba(217,119,6,.2)', borderRadius: 20, padding: '2px 8px' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#D97706' }} />Custom
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 700, color: 'var(--green)', background: 'var(--green-bg)', border: '1px solid rgba(22,163,74,.15)', borderRadius: 20, padding: '2px 8px' }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--green)' }} />Auto-generated
                        </span>
                      )}
                      <button
                        onClick={() => { setIntroText(profile?.portfolioIntro || widgetJobs?.introDefault || ''); setIntroEditing(true) }}
                        style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer' }}
                      >
                        Edit
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65 }}>
                      {profile?.portfolioIntro || widgetJobs?.introDefault || 'Publish your first job and your intro will be generated automatically from your business profile.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: 10 }}>
                    <textarea
                      value={introText}
                      onChange={(e) => setIntroText(e.target.value)}
                      placeholder="Write a short intro for your portfolio page. Keep it under 200 words. Use your city and trade names naturally."
                      style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '10px 12px', fontSize: 12.5, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', resize: 'vertical', minHeight: 80, lineHeight: 1.6, outline: 'none' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <button onClick={() => setIntroEditing(false)} style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer' }}>Cancel</button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button onClick={() => handleSaveIntro(null)} disabled={introSaving} style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer' }}>Reset to auto-generated</button>
                        <button
                          onClick={() => handleSaveIntro(introText.trim() || null)}
                          disabled={introSaving}
                          style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: 'var(--sky-text)', color: '#fff', border: 'none' }}
                        >
                          {introSaving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Title tag + meta description templates */}
                {widgetJobs?.primaryType && widgetJobs?.primaryCity && (
                  <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '11px 13px', marginTop: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 6 }}>Recommended page title tag</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t1)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px 9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span>{`${widgetJobs.primaryType} in ${widgetJobs.primaryCity}${widgetJobs.primaryState ? `, ${widgetJobs.primaryState}` : ''} — ${profile?.name || ''} Portfolio`}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${widgetJobs.primaryType} in ${widgetJobs.primaryCity}${widgetJobs.primaryState ? `, ${widgetJobs.primaryState}` : ''} — ${profile?.name || ''} Portfolio`).then(() => {
                            setTitleCopied(true); setTimeout(() => setTitleCopied(false), 2000)
                          })
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, color: titleCopied ? 'var(--green)' : 'var(--sky-text)', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {titleCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', margin: '10px 0 6px' }}>Recommended meta description</div>
                    <div style={{ fontSize: 11.5, color: 'var(--t1)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 5, padding: '5px 9px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5 }}>
                      <span style={{ lineHeight: 1.5 }}>{`See completed ${joinList(widgetJobs.types.slice(0, 3).map((t) => t.toLowerCase()))} jobs across ${joinList(widgetJobs.cities.slice(0, 3))} — with photos from every project.`}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`See completed ${joinList(widgetJobs.types.slice(0, 3).map((t) => t.toLowerCase()))} jobs across ${joinList(widgetJobs.cities.slice(0, 3))} — with photos from every project.`).then(() => {
                            setMetaCopied(true); setTimeout(() => setMetaCopied(false), 2000)
                          })
                        }}
                        style={{ background: 'none', border: 'none', padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11.5, fontWeight: 600, color: metaCopied ? 'var(--green)' : 'var(--sky-text)', cursor: 'pointer', alignSelf: 'flex-end' }}
                      >
                        {metaCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>Paste these into your page settings in your website builder. They tell Google exactly what your page is about.</div>
                  </div>
                )}
              </div>
            </ConnCard>

            {/* BETTER · Hosted subdomain via CNAME */}
            <ConnCard
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
              title="Host a Branded Page on Your Domain (CNAME)"
              titleExtra={<TierLabel label="Better" />}
              sub="Add one CNAME record — we serve your jobs on your own domain. No code, no plugin."
              status={sdStatus === 'verified' ? <ActiveTag /> : undefined}
              accent={sdStatus === 'verified'}
              open={!!openCards['cname']}
              onToggle={() => toggleCard('cname')}
              cardStyle={{ marginBottom: 12 }}
            >

              {/* State: verified & live */}
              {sdStatus === 'verified' && !sdEditing ? (
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                      Live
                    </span>
                    <span style={{ display: 'inline-flex', gap: 14, marginLeft: 'auto' }}>
                      <button
                        onClick={() => setSdEditing(true)}
                        style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', padding: 0 }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={handleRemoveSubdomain}
                        disabled={sdSaving}
                        style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--red)', cursor: sdSaving ? 'default' : 'pointer', padding: 0 }}
                      >
                        Remove
                      </button>
                    </span>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'monospace', letterSpacing: '-0.2px', marginTop: 7 }}>
                    <a href={`https://${sdHost}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sky-text)' }}>{sdHost}</a>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
                    Your jobs are now live on your own domain — visible to Google and AI search immediately, no delay.
                  </p>

                  {/* One last step: make sure people can actually find this new page from the homepage */}
                  <div style={{ background: sdHomepageLinked === true ? 'var(--green-bg)' : 'var(--surface-3)', border: `1px solid ${sdHomepageLinked === true ? 'rgba(22,163,74,.25)' : 'var(--border)'}`, borderRadius: 8, padding: '12px 14px', marginTop: 14 }}>
                    {sdHomepageLinked === true ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: 'var(--green)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        Your homepage links to this page
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontWeight: 700, color: sdHomepageLinked === false ? '#D97706' : 'var(--t2)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          {sdHomepageLinked === false ? "One more step: add a link on your homepage" : "We couldn't check this automatically"}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, margin: '8px 0 0' }}>
                          Right now this new page has no link pointing to it from your main website. Add one link — like "Our Work" in your menu — so visitors (and Google) can actually find it. This page already links back to your homepage on its own; this is just the other direction.
                        </p>
                        <button
                          onClick={() => setShowSdLinkSteps(!showSdLinkSteps)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginTop: 10 }}
                        >
                          How do I add this link?
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: showSdLinkSteps ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {showSdLinkSteps && (
                          <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.65, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                            Add a menu link with a label like "Our Work" pointing to <span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>https://{sdHost}</span>. Where to do this depends on how your site is built:
                            <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                              <li><strong>WordPress:</strong> Appearance → Menus → Add Custom Link</li>
                              <li><strong>Squarespace:</strong> Pages → click + next to your navigation</li>
                              <li><strong>Wix:</strong> Editor → Manage Menu → + Add Item → Link</li>
                              <li><strong>Webflow:</strong> Designer → your navbar → add a Nav Link</li>
                              <li><strong>Plain HTML site:</strong> add a link in your page's navigation section, then re-upload the file</li>
                            </ul>
                            Not sure how your site works? Tell whoever manages it: <em>&quot;Please add a menu link labeled &apos;Our Work&apos; pointing to https://{sdHost}.&quot;</em>
                          </div>
                        )}
                        <button
                          onClick={handleRecheckHomepageLink}
                          disabled={sdCheckingLink}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: sdCheckingLink ? 'default' : 'pointer', background: 'var(--sky-text)', color: '#fff', border: 'none', marginTop: 10 }}
                        >
                          {sdCheckingLink ? 'Checking…' : "I've Added It — Check Again"}
                        </button>
                        {sdHomepageLinked === null && (
                          <p style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, margin: '8px 0 0' }}>
                            This check only looks at your homepage's basic code and can occasionally miss fancy drag-and-drop menus. If you've already added the link, you're all set either way.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : sdStatus === 'pending' && !sdEditing ? (
                /* State: pending DNS */
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: '#FFFBEB', color: '#D97706' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                      Waiting on DNS…
                    </span>
                    <button
                      onClick={() => setSdEditing(true)}
                      style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', padding: 0 }}
                    >
                      Edit
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'monospace', letterSpacing: '-0.2px', marginTop: 7 }}>{sdHost}</div>
                  <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '12px 14px', marginTop: 12 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>Add this record at your domain provider</div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0' }}><span style={{ color: 'var(--t3)', width: 44, flexShrink: 0, fontWeight: 600 }}>Type</span><span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>CNAME</span></div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0' }}><span style={{ color: 'var(--t3)', width: 44, flexShrink: 0, fontWeight: 600 }}>Host</span><span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>{sdHost && sdApex ? sdHost.replace(`.${sdApex}`, '') : sdLabel}</span></div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 12, padding: '4px 0', alignItems: 'center' }}>
                      <span style={{ color: 'var(--t3)', width: 44, flexShrink: 0, fontWeight: 600 }}>Value</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--t1)', wordBreak: 'break-all' }}>{sdCnameTarget}</span>
                      <button
                        onClick={handleCopyCnameTarget}
                        style={{ marginLeft: 'auto', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: sdTargetCopied ? 'var(--green)' : 'var(--sky-text)', color: '#fff', border: 'none' }}
                      >
                        {sdTargetCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
                    DNS changes can take up to 48 hours to fully take effect. This page checks automatically — you don&apos;t need to keep refreshing.
                  </p>
                </div>
              ) : (
                /* State: not set up (or editing) */
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 14, marginTop: 0 }}>
                    This gives your job pages their own address on your domain — like <span style={{ fontFamily: 'monospace', color: 'var(--t1)' }}>our-work.{sdApex || 'yourdomain.com'}</span> — with no code to paste and no plugin to install. Just one setting at your domain provider.
                  </p>
                  {!sdApex ? (
                    <div style={{ background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 13px', fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
                      Add your website in Account → General first — your subdomain is built from your domain.
                    </div>
                  ) : (
                    <>
                      <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Choose your subdomain</label>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <input
                          type="text"
                          value={sdLabel}
                          onChange={(e) => { setSdLabel(e.target.value.toLowerCase()); setSdError(null) }}
                          placeholder="our-work"
                          style={{ flex: 1, minWidth: 0, background: 'var(--surface)', border: '1px solid var(--border-2)', borderRight: 'none', borderRadius: '8px 0 0 8px', padding: '9px 13px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none' }}
                        />
                        <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border-2)', borderRadius: '0 8px 8px 0', padding: '9px 13px', fontSize: 13, color: 'var(--t3)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          .{sdApex}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          onClick={handleSaveSubdomain}
                          disabled={sdSaving}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: sdSaving ? 'default' : 'pointer', background: 'var(--sky-text)', color: '#fff', border: 'none' }}
                        >
                          {sdSaving ? 'Saving…' : 'Get My DNS Record'}
                        </button>
                        {sdEditing && (
                          <button
                            onClick={() => { setSdEditing(false); setSdError(null) }}
                            style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--t3)', cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                      {sdError && <div style={{ fontSize: 12, color: 'var(--red, #DC2626)', marginTop: 8 }}>{sdError}</div>}

                      {/* Collapsible: how to add the record */}
                      <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
                        <button
                          onClick={() => setShowSdSteps(!showSdSteps)}
                          style={{ width: '100%', background: 'none', border: 'none', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            How to add a DNS record (GoDaddy, Namecheap, Cloudflare, etc.)
                          </span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: showSdSteps ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        {showSdSteps && (
                          <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                            {[
                              'Log in to whoever you bought your domain from (GoDaddy, Namecheap, Cloudflare, etc.) — not your website builder.',
                              'Find DNS Settings or Manage DNS for your domain.',
                              'Click "Get My DNS Record" above, then add a new record using the exact Type, Host, and Value shown, and save.',
                            ].map((txt, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                                <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                                <div>{txt}</div>
                              </div>
                            ))}
                            <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                              Don&apos;t see DNS settings at all? Some website builder plans don&apos;t allow this — if that&apos;s you, keep using the embed widget above instead. No action needed on your end.
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </ConnCard>

            {/* BEST · WordPress native publish */}
            <ConnCard
              icon={<svg width="19" height="19" viewBox="0 0 24 24" fill="#21759B" stroke="none"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 1.4a8.6 8.6 0 0 1 4.86 1.49h-.1a1.2 1.2 0 0 0-1.16 1.23c0 .57.33 1.05.68 1.62.27.45.58 1.03.58 1.87 0 .58-.22 1.26-.52 2.2l-.68 2.26-2.45-7.3c.41-.02.78-.06.78-.06.36-.05.32-.58-.05-.56 0 0-1.1.09-1.82.09-.67 0-1.8-.09-1.8-.09-.36-.02-.4.54-.05.56 0 0 .35.04.72.06l1.06 2.9-1.49 4.46-2.48-7.36c.41-.02.78-.06.78-.06.36-.05.32-.58-.05-.56 0 0-1.1.09-1.82.09-.13 0-.28 0-.44-.01A8.6 8.6 0 0 1 12 3.4zM4.3 8.9l3.77 10.32A8.6 8.6 0 0 1 4.3 8.9zm8.2 3.62l2.28 6.24a.7.7 0 0 0 .06.1 8.6 8.6 0 0 1-5.1.06l1.9-5.5.86-.9zm5.9-2.05a8.6 8.6 0 0 1-2.42 8.5l2.35-6.8c.3-.9.44-1.62.44-2.27 0-.24-.02-.46-.05-.68.28.52.44 1.13.44 1.79z"/></svg>}
              title="Publish Into Your WordPress Site"
              titleExtra={<TierLabel label="Best" />}
              sub="Real posts in your own theme — the deepest local-SEO integration we offer."
              status={wpStatus === 'connected' ? <ActiveTag /> : undefined}
              accent={wpStatus === 'connected'}
              open={!!openCards['wordpress']}
              onToggle={() => toggleCard('wordpress')}
              cardStyle={{ marginBottom: 0 }}
            >

              {wpStatus === 'connected' ? (
                /* State: connected */
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', flexShrink: 0 }} />
                      Connected
                    </span>
                    <button
                      onClick={() => {
                        if (confirm('Disconnecting removes the job posts and photos we published from your WordPress site. Nothing is deleted from ProjectCheckin. Continue?')) {
                          handleDisconnectWordPress()
                        }
                      }}
                      disabled={wpDisconnecting}
                      style={{ background: 'none', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'var(--red, #DC2626)', cursor: wpDisconnecting ? 'default' : 'pointer', padding: 0 }}
                    >
                      {wpDisconnecting ? 'Disconnecting…' : 'Disconnect'}
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'monospace', letterSpacing: '-0.2px', marginTop: 7 }}>{wpConnectedUrl}</div>

                  <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginTop: 10, marginBottom: 0 }}>
                    {wpSyncedCount > 0
                      ? `${wpSyncedCount} ${wpSyncedCount === 1 ? 'job is' : 'jobs are'} live on your site. New jobs you publish appear automatically.`
                      : 'New jobs you publish will appear on your site automatically. Jobs published before you connected are not included.'}
                  </p>

                  {wpFailedCount > 0 && (
                    <div style={{ background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 13px', marginTop: 12, fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
                      {wpFailedCount} {wpFailedCount === 1 ? 'job' : 'jobs'} couldn&apos;t be published to your site. Reconnect below with a new Application Password and we&apos;ll try again automatically.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--sky-dim)', border: '1px solid rgba(14,165,233,.25)', borderRadius: 8, padding: '12px 14px', marginTop: 14, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Reminder: if you ever need to downgrade or cancel, nothing will be deleted from ProjectCheckin, but job content will no longer be displayed on your site. Everything is restored to your site automatically the moment you resubscribe to Titan.</span>
                  </div>

                  {/* ── Existing-page injection (Phase 3b) ── */}
                  <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 18 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-0.1px' }}>Feed jobs into pages you already have</div>
                    <p style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.6, marginTop: 6, marginBottom: 16 }}>
                      Every job you publish becomes its own permanent post on your site. On top of that, if you have pages that rank — like an &ldquo;areas we serve&rdquo; or a service page — point ProjectCheckin at them and your recent matching jobs appear there as a linked highlight, sending visitors and search authority to each job&apos;s post.
                    </p>

                    {wpNotice && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: '#92400E', lineHeight: 1.55 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>{wpNotice}</span>
                        <button onClick={() => setWpNotice(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }} aria-label="Dismiss">×</button>
                      </div>
                    )}

                    {/* Master switch: create new posts for unmatched jobs */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px', marginBottom: 18 }}>
                      <div>
                        <div style={{ fontSize: 12.5, color: 'var(--t1)', fontWeight: 600 }}>Auto-post every job to your site</div>
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginTop: 3, maxWidth: 340 }}>On (recommended): every job becomes its own permanent post — the engine behind your SEO growth. Off: jobs that don&apos;t match a page below won&apos;t get their own post.</div>
                      </div>
                      <button
                        onClick={toggleWpCreateNewPosts}
                        aria-label="Toggle new posts for unmatched jobs"
                        style={{ position: 'relative', width: 40, height: 23, flexShrink: 0, border: 'none', borderRadius: 20, background: wpCreateNewPosts ? 'var(--sky-text)' : 'var(--border-2)', cursor: 'pointer', padding: 0, transition: 'background .18s' }}
                      >
                        <span style={{ position: 'absolute', top: 2.5, left: 2.5, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.25)', transition: 'transform .18s', transform: wpCreateNewPosts ? 'translateX(17px)' : 'translateX(0)' }} />
                      </button>
                    </div>

                    {/* Saved mappings */}
                    {wpMappings.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                        {wpMappings.map((m) => (
                          <div key={m.id} style={{ border: '1px solid var(--border)', borderRadius: 9, padding: '12px 14px', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: m.matchCity ? 700 : 600, background: m.matchCity ? 'var(--sky-dim)' : 'var(--surface-3)', color: m.matchCity ? 'var(--sky-text)' : 'var(--t3)' }}>
                                  {m.matchCity ? `${m.matchCity}${m.matchState ? ', ' + m.matchState : ''}` : 'Any location'}
                                </span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 6, fontSize: 11.5, fontWeight: m.matchService ? 700 : 600, background: m.matchService ? 'var(--sky-dim)' : 'var(--surface-3)', color: m.matchService ? 'var(--sky-text)' : 'var(--t3)' }}>
                                  {m.matchService || 'Any service'}
                                </span>
                              </div>
                              <button onClick={() => handleRemoveMapping(m.id)} title="Remove" style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              </button>
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--t2)', fontFamily: 'monospace', letterSpacing: '-0.2px', marginTop: 9, wordBreak: 'break-all' }}>{m.wpPageUrl}</div>
                            {m.builderBlocked ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 12px', marginTop: 10, fontSize: 11.5, color: '#92400E', lineHeight: 1.55 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                <span>This page was built with a page builder, which we can&apos;t reliably add content to yet. We&apos;ll follow best practice to create a new page. No action required.</span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add-a-page form */}
                    {wpAddOpen ? (
                      <div style={{ border: '1px dashed var(--border-2)', borderRadius: 9, padding: 16, background: 'var(--surface-2)', marginBottom: 14 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Location</label>
                            <select value={wpAddLocation} onChange={(e) => setWpAddLocation(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none', cursor: 'pointer' }}>
                              <option value="">Any location</option>
                              {wpLocations.map((l) => {
                                const val = `${l.city}|${l.state ?? ''}`
                                return <option key={val} value={val}>{l.city}{l.state ? `, ${l.state}` : ''}</option>
                              })}
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Service</label>
                            <select value={wpAddService} onChange={(e) => setWpAddService(e.target.value)} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none', cursor: 'pointer' }}>
                              <option value="">Any service</option>
                              {wpServices.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                        <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Paste the URL of your existing page</label>
                        <input type="text" value={wpAddUrl} onChange={(e) => setWpAddUrl(e.target.value)} placeholder="https://yourbusiness.com/areas-served/city/" style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: 'monospace', color: 'var(--t1)', outline: 'none' }} />
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55, margin: '8px 0 14px' }}>
                          <strong>Pick a page you already have, even if it only matches the location OR the service, not both.</strong> An existing page with real history almost always outranks a brand-new page, even one built for the exact combination. Building a brand-new city+service page starts at zero authority and can take months to catch up — only worth doing for a keyword valuable enough to wait for.
                        </div>

                        {wpAddError && (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12, color: 'var(--red, #DC2626)', lineHeight: 1.5, marginBottom: 12 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            <span>{wpAddError}</span>
                          </div>
                        )}

                        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                          <button
                            onClick={() => setWpMarkerHowToOpen((v) => !v)}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: 'var(--t1)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                              Optional: choose exactly where it lands
                            </span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: wpMarkerHowToOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {wpMarkerHowToOpen && (
                            <>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', marginTop: 10 }}>
                                <code style={{ fontFamily: 'monospace', fontSize: 11.5, color: 'var(--t1)', letterSpacing: '-0.2px', wordBreak: 'break-all' }}>{WP_MARKER}</code>
                                <button
                                  onClick={() => { navigator.clipboard?.writeText(WP_MARKER); setWpMarkerCopied(true); setTimeout(() => setWpMarkerCopied(false), 1600) }}
                                  style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: wpMarkerCopied ? 'var(--green)' : 'var(--sky-text)', color: '#fff', border: 'none', flexShrink: 0, whiteSpace: 'nowrap' }}
                                >
                                  {wpMarkerCopied ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.55, marginTop: 9 }}>
                                <strong>Pasting this directly into the normal page editor often fails silently</strong> — WordPress strips bare HTML comments when it parses pasted content. Use the <strong>Code editor</strong> instead:
                                <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                                  <li>Open the page in your WordPress editor.</li>
                                  <li>Click the three-dot menu (top-right of the toolbar) and choose <strong>&quot;Code editor&quot;</strong>.</li>
                                  <li>The whole page becomes plain text. Click at the exact spot where you want the jobs to appear.</li>
                                  <li>Paste the marker pair above.</li>
                                  <li>Click the three-dot menu again and choose <strong>&quot;Exit code editor&quot;</strong> to go back to the normal view.</li>
                                  <li>Click <strong>Update</strong>.</li>
                                </ol>
                                <div style={{ marginTop: 6 }}>We only ever write between these two tags — the rest of your page is never touched. Skip this and your jobs are added to the bottom of the page.</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                          <button onClick={handleAddMapping} disabled={wpAddSaving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: wpAddSaving ? 'default' : 'pointer', background: 'var(--sky-text)', color: '#fff', border: 'none' }}>
                            {wpAddSaving ? 'Saving…' : 'Save page'}
                          </button>
                          <button onClick={() => { setWpAddOpen(false); setWpAddError(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: 'none', color: 'var(--t2)', border: '1px solid var(--border-2)' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setWpAddOpen(true); setWpNotice(null) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center', width: '100%', fontSize: 12.5, fontWeight: 700, color: 'var(--sky-text)', background: 'none', border: '1px dashed var(--border-2)', borderRadius: 9, padding: '11px 14px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add a page
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--sky-dim)', border: '1px solid rgba(14,165,233,.25)', borderRadius: 8, padding: '12px 14px', marginTop: 16, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>Pages you connect here follow the same Titan rule: if you downgrade or cancel, the ProjectCheckin content is removed from these pages — but your pages themselves are never changed or deleted, and everything restores automatically when you return to Titan.</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* State: not connected (also covers a failed attempt) */
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginTop: 0, marginBottom: 14 }}>
                    Connect your WordPress site and every job you publish from now on becomes a real post on your own site — in your own theme, at your own address. Nothing to install.
                  </p>

                  {wpError && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'var(--red, #DC2626)', lineHeight: 1.5, marginBottom: 12 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span>{wpError}</span>
                    </div>
                  )}

                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Your WordPress site address</label>
                  <input
                    type="text"
                    value={wpSiteUrl}
                    onChange={(e) => setWpSiteUrl(e.target.value)}
                    placeholder="https://yourbusiness.com"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: 'monospace', color: 'var(--t1)', outline: 'none', marginBottom: 14 }}
                  />

                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>WordPress username</label>
                  <input
                    type="text"
                    value={wpUsername}
                    onChange={(e) => setWpUsername(e.target.value)}
                    placeholder="your-wordpress-username"
                    autoComplete="off"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--t1)', outline: 'none', marginBottom: 14 }}
                  />

                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Application Password</label>
                  <input
                    type="password"
                    value={wpPassword}
                    onChange={(e) => setWpPassword(e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                    autoComplete="new-password"
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontSize: 13, fontFamily: 'monospace', color: 'var(--t1)', outline: 'none', marginBottom: 14 }}
                  />

                  {/* Collapsible: how to generate an Application Password */}
                  <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginBottom: 14 }}>
                    <button
                      onClick={() => setShowWpSteps(!showWpSteps)}
                      style={{ width: '100%', background: 'none', border: 'none', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        How to generate an Application Password
                      </span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: showWpSteps ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    {showWpSteps && (
                      <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                        {[
                          'Log in to your WordPress admin area — usually yoursite.com/wp-admin.',
                          'Go to Users → Profile.',
                          'Scroll down to Application Passwords, type "ProjectCheckin" as the name, and click Add New Application Password.',
                          "Copy the password it shows you — it's only displayed once — and paste it above with your username and site address.",
                        ].map((txt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                            <div>{txt}</div>
                          </div>
                        ))}
                        <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                          Don&apos;t see Application Passwords on your profile page? Some websites have this turned off by default — reach out to ProjectCheckin support and we&apos;ll help you get it turned on.
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--sky-dim)', border: '1px solid rgba(14,165,233,.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, fontSize: 12, color: 'var(--t2)', lineHeight: 1.6 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Jobs you publish while connected stay live on your WordPress site as long as you&apos;re on the Titan plan. If you ever need to downgrade or cancel, nothing will be deleted from ProjectCheckin, but job content will no longer be displayed on your site. Everything is restored to your site automatically the moment you resubscribe to Titan.</span>
                  </div>

                  <button
                    onClick={handleConnectWordPress}
                    disabled={wpSaving}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: wpSaving ? 'default' : 'pointer', background: 'var(--sky-text)', color: '#fff', border: 'none' }}
                  >
                    {wpSaving ? 'Connecting…' : 'Connect WordPress'}
                  </button>
                </div>
              )}
            </ConnCard>
          </div>
          )}

          {/* ── Share Your Project Check-In Portfolio ── */}
          {profile?.slug && (
          <ConnCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--sky-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>}
            title="Share Your Project Check-In Portfolio"
            sub="Share your work and track visits from any source"
            status={<StatusDot state="active" label="Active" />}
            open={!!openCards['share']}
            onToggle={() => toggleCard('share')}
          >
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    onClick={handleCopyPortfolioLink}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: linkCopied ? 'var(--green)' : 'var(--sky-text)', color: '#fff', border: 'none', transition: 'background .15s' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      {linkCopied ? <polyline points="20 6 9 17 4 12"/> : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
                    </svg>
                    {linkCopied ? 'Copied!' : 'Copy portfolio link'}
                  </button>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
                    tracking on
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: 'monospace', letterSpacing: '-0.2px', marginTop: 7 }}>
                  projectcheckin.com/portfolio/{profile.slug}
                </div>

                {/* Collapsible: how to use */}
                <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', marginTop: 12 }}>
                  <button
                    onClick={() => setShowPortfolioDisc(!showPortfolioDisc)}
                    style={{ width: '100%', background: 'none', border: 'none', padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--t2)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      How to use this link
                    </span>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: showPortfolioDisc ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {showPortfolioDisc && (
                    <div style={{ padding: '0 14px 12px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>1</div>
                        <div>Copy your link using the button above.</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>2</div>
                        <div>
                          Paste it wherever your customers find you:
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
                            {['Google Business Profile', 'Facebook', 'Instagram bio', 'Nextdoor', 'Email signature', 'Text messages'].map((p) => (
                              <span key={p} style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--surface)', color: 'var(--t2)', border: '1px solid var(--border)' }}>{p}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--t2)', lineHeight: 1.55, marginTop: 10 }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sky-dim)', color: 'var(--sky-text)', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>3</div>
                        <div>When a homeowner clicks the link, their visit is recorded. Check Reporting to see how many people have viewed your portfolio.</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--t3)', lineHeight: 1.55, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                        Go to <strong>business.google.com</strong> → Edit profile → Contact → Website → paste your link to put your portfolio in front of homeowners on Google Maps.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ConnCard>
          )}

          {/* ── Connect Google Search Console (Elite + Titan) ── */}
          <ConnCard
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={hasGsc ? '#4285F4' : 'var(--t3)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>}
            title="Connect Google Search Console"
            titleExtra={!hasGsc ? (
              <span style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 20, fontSize: 10.5, fontWeight: 700, background: 'var(--surface-3)', color: 'var(--t2)' }}>Elite &amp; Titan</span>
            ) : undefined}
            sub="See your search impressions and clicks inside your Reporting tab"
            status={
              !hasGsc ? <StatusDot state="coming" label="Elite & Titan only" />
              : gscStatus === 'connected' ? <StatusDot state="active" label="Active" />
              : gscStatus === 'select_property' ? <StatusDot state="disabled" label="Almost done" />
              : gscStatus === 'no_properties' ? <StatusDot state="disabled" label="Action needed" />
              : <StatusDot state="disabled" label="Not connected" />
            }
            open={!!openCards['gsc']}
            onToggle={() => toggleCard('gsc')}
            locked={!hasGsc}
          >
            <div style={{ padding: '16px 20px' }}>
              {gscError && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(220,38,38,.25)', borderRadius: 8, padding: '10px 13px', fontSize: 12, color: 'var(--red)', lineHeight: 1.55, marginBottom: 14 }}>
                  {gscError}
                </div>
              )}

              {!hasGsc ? (
                <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>
                  Upgrade to Elite or Titan to connect Google Search Console and see real search performance data for your business right inside ProjectCheckin.
                </p>
              ) : gscStatus === 'connected' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 7 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'var(--green-bg)', color: 'var(--green)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                      Connected
                    </span>
                    <button
                      onClick={handleGscDisconnect}
                      disabled={gscBusy}
                      style={{ marginLeft: 'auto', background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--red)', cursor: gscBusy ? 'not-allowed' : 'pointer', padding: 0 }}
                    >
                      Disconnect
                    </button>
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--t3)', fontFamily: "'Courier New', monospace", letterSpacing: '-.2px', wordBreak: 'break-all' }}>
                    {gscPropertyUrl}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: '12px 0 0' }}>
                    Your search data now shows up in your <a href="/reporting" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>Reporting tab</a>.
                  </p>
                </>
              ) : gscStatus === 'select_property' ? (
                <>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: '0 0 14px' }}>
                    We found more than one website connected to your Google account. Pick the one you want ProjectCheckin to show data for.
                  </p>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--t2)', textTransform: 'uppercase', letterSpacing: '.04em', display: 'block', marginBottom: 6 }}>Your website</label>
                  <select
                    value={gscChoice}
                    onChange={(e) => setGscChoice(e.target.value)}
                    style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border-2)', borderRadius: 8, padding: '9px 13px', fontFamily: 'inherit', fontSize: 13, color: 'var(--t1)', outline: 'none', marginBottom: 14 }}
                  >
                    {gscProperties.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <button
                    onClick={handleGscSelectProperty}
                    disabled={gscBusy || !gscChoice}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, fontFamily: 'inherit', fontSize: 12, fontWeight: 700, background: 'var(--sky-text)', color: '#fff', border: 'none', cursor: gscBusy || !gscChoice ? 'not-allowed' : 'pointer', opacity: gscBusy || !gscChoice ? 0.5 : 1 }}
                  >
                    {gscBusy ? 'Saving…' : 'Save selection'}
                  </button>
                </>
              ) : gscStatus === 'no_properties' ? (
                <>
                  <div style={{ background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 13px', fontSize: 12, color: 'var(--amber)', lineHeight: 1.55 }}>
                    Your Google account isn&apos;t verified for any website in Search Console yet, so there&apos;s no data for us to show. This is a one-time setup on Google&apos;s side, not something wrong with ProjectCheckin.
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: '12px 0 10px' }}>You have two options:</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href="/help/guides/gsc-setup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--surface-3)', color: 'var(--t2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                      Read the setup guide
                    </a>
                    <a href="/help" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 13px', borderRadius: 8, fontSize: 12, fontWeight: 700, background: 'var(--surface-3)', color: 'var(--t2)', border: '1px solid var(--border)', textDecoration: 'none' }}>
                      Contact support for help
                    </a>
                  </div>
                  <button
                    onClick={reloadGscStatus}
                    style={{ marginTop: 12, background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: 'var(--sky-text)', cursor: 'pointer', padding: 0 }}
                  >
                    Check again
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 9 }}>
                    <span style={{ width: 20, height: 20, background: 'var(--sky-dim)', color: 'var(--sky-text)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    See real clicks, impressions, and average ranking position from Google
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 14 }}>
                    <span style={{ width: 20, height: 20, background: 'var(--sky-dim)', color: 'var(--sky-text)', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    See which searches and pages are bringing customers to your site
                  </div>
                  <button
                    onClick={handleGscConnect}
                    disabled={gscBusy}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: 'var(--sky-text)', color: '#fff', border: 'none', cursor: gscBusy ? 'not-allowed' : 'pointer', opacity: gscBusy ? 0.6 : 1 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                    {gscBusy ? 'Opening Google…' : 'Connect Google Search Console'}
                  </button>
                  <p style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.6, margin: '12px 0 0' }}>
                    You&apos;ll pick your own Google account and approve read-only access — we never see your password.{' '}
                    <a href="/help/guides/gsc-connect" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>Read the guide</a>
                    {' · '}
                    <a href="/help/guides/gsc-setup" style={{ color: 'var(--sky-text)', fontWeight: 600, textDecoration: 'none' }}>Don&apos;t have Search Console yet?</a>
                  </p>
                </>
              )}
            </div>
          </ConnCard>

        </div>
      )}

      {/* Downgrade warning modal — rendered outside tabs so it always overlays */}
      {showDowngradeWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          backdropFilter: 'blur(3px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 14, maxWidth: 460, width: '100%',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 10 }}>
              Before you continue
            </h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 10 }}>
              If you <strong>cancel or downgrade</strong>:
            </p>
            <ul style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.7, paddingLeft: 18, marginBottom: 14 }}>
              <li>Higher-tier features will be turned off</li>
              {wpStatus === 'connected' && (
                <li>
                  Job posts and photos published to <strong>{wpConnectedUrl}</strong> will no longer be
                  displayed on your site
                </li>
              )}
              <li>Your data is preserved — resubscribing restores everything instantly</li>
              <li>If you have a discounted or promotional rate, re-enrolling later is priced at whatever&apos;s being offered at that time — your current rate isn&apos;t guaranteed to still be available</li>
            </ul>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setShowDowngradeWarning(false); handleManageSubscription() }}
                disabled={portalLoading}
                className="db-shell-btn"
                style={{ flex: 1, height: 40 }}
              >
                {portalLoading ? 'Opening\u2026' : 'Continue to billing portal'}
              </button>
              <button
                onClick={() => setShowDowngradeWarning(false)}
                style={{
                  flex: 1, height: 40, background: 'var(--surface-3)', color: 'var(--t1)',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Keep my plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disable auto-posting warning — discourages turning the switch off */}
      {wpDisableModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)',
          backdropFilter: 'blur(3px)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 14, maxWidth: 460, width: '100%',
            padding: '28px 24px', boxShadow: '0 20px 60px rgba(0,0,0,.2)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'var(--amber-bg)', border: '1px solid rgba(217,119,6,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--t1)', marginBottom: 10 }}>
              Are you sure?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, marginBottom: 16 }}>
              Disabling auto-posting could slow your SEO and page growth. Remember, you can always
              unpublish individual jobs from your ProjectCheckin dashboard if you&apos;d like them
              removed from public view.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setWpDisableModalOpen(false)}
                className="db-shell-btn"
                style={{ flex: 1, height: 40 }}
              >
                Keep auto-posting on
              </button>
              <button
                onClick={() => { setWpDisableModalOpen(false); applyWpCreateNewPosts(false) }}
                style={{
                  flex: 1, height: 40, background: 'var(--surface-3)', color: 'var(--t1)',
                  border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Disable anyway
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardShell>
  )
}
