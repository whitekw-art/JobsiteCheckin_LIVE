'use client'

import { useState, useEffect, useCallback } from 'react'

/* ── Types ────────────────────────────────────────────────────── */

interface Stats {
  totalOrgs: number
  activeSubs: number
  totalPublishedJobs: number
  totalPortfolioViews: number
  pendingFollowUps: number
}

interface Org {
  id: string
  name: string
  slug: string | null
  email: string | null
  planTier: string | null
  subscriptionStatus: string | null
  createdAt: string
  _count: { checkIns: number }
}

interface WaitlistEntry {
  id: string
  name: string | null
  email: string
  businessName: string | null
  trade: string | null
  planInterest: string | null
  createdAt: string
}

interface EmailConfig {
  followUpEmailDays: string
  followUpEmailSubject: string
  followUpEmailBody: string
}

/* ── Helpers ──────────────────────────────────────────────────── */

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function tierBadge(tier: string | null) {
  const map: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    pro: 'bg-blue-100 text-blue-700',
    elite: 'bg-purple-100 text-purple-700',
    titan: 'bg-amber-100 text-amber-700',
  }
  const cls = map[tier ?? 'free'] ?? 'bg-gray-100 text-gray-600'
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase ${cls}`}>{tier ?? 'free'}</span>
}

function statusBadge(status: string | null) {
  if (status === 'active') return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700">active</span>
  if (status === 'canceled') return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700">canceled</span>
  return <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-500">{status ?? '—'}</span>
}

/* ── Main Component ───────────────────────────────────────────── */

export default function AdminClient() {
  const [tab, setTab] = useState<'overview' | 'orgs' | 'waitlist' | 'emails' | 'ai-settings'>('overview')

  const TAB_LABELS: Record<string, string> = {
    overview: 'Overview',
    orgs: 'Orgs',
    waitlist: 'Waitlist',
    emails: 'Follow-up Emails',
    'ai-settings': 'AI Settings',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="font-bold text-lg">ProjectCheckin Admin</span>
          <span className="ml-3 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded">SUPER_ADMIN</span>
        </div>
        <a href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">← Back to App</a>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white px-6">
        <nav className="flex gap-1">
          {(['overview', 'orgs', 'waitlist', 'emails', 'ai-settings'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                tab === t ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'orgs' && <OrgsTab />}
        {tab === 'waitlist' && <WaitlistTab />}
        {tab === 'emails' && <EmailsTab />}
        {tab === 'ai-settings' && <AiSettingsTab />}
      </div>
    </div>
  )
}

/* ── Overview Tab ─────────────────────────────────────────────── */

function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>
  if (!stats) return <p className="text-red-500 text-sm">Failed to load stats.</p>

  const cards = [
    { label: 'Total Organizations', value: stats.totalOrgs },
    { label: 'Active Paid Subs', value: stats.activeSubs },
    { label: 'Published Job Pages', value: stats.totalPublishedJobs },
    { label: 'Portfolio Views', value: stats.totalPortfolioViews },
    { label: 'Pending Follow-up Emails', value: stats.pendingFollowUps },
  ]

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{c.value.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Orgs Tab ─────────────────────────────────────────────────── */

function OrgsTab() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/orgs').then(r => r.json()).then(setOrgs).finally(() => setLoading(false))
  }, [])

  const changeTier = useCallback(async (id: string, planTier: string) => {
    setSaving(id)
    await fetch('/api/admin/orgs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, planTier }),
    })
    setOrgs(prev => prev.map(o => o.id === id ? { ...o, planTier } : o))
    setSaving(null)
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizations ({orgs.length})</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Jobs</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Change Tier</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org, i) => (
              <tr key={org.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {org.slug ? (
                    <a href={`/portfolio/${org.slug}`} target="_blank" className="hover:underline text-blue-600">{org.name}</a>
                  ) : org.name}
                </td>
                <td className="px-4 py-3 text-gray-500">{org.email ?? '—'}</td>
                <td className="px-4 py-3">{tierBadge(org.planTier)}</td>
                <td className="px-4 py-3">{statusBadge(org.subscriptionStatus)}</td>
                <td className="px-4 py-3 text-gray-700">{org._count.checkIns}</td>
                <td className="px-4 py-3 text-gray-500">{fmt(org.createdAt)}</td>
                <td className="px-4 py-3">
                  <select
                    value={org.planTier ?? 'free'}
                    onChange={(e) => changeTier(org.id, e.target.value)}
                    disabled={saving === org.id}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white cursor-pointer disabled:opacity-50"
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                    <option value="titan">Titan</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Waitlist Tab ─────────────────────────────────────────────── */

function WaitlistTab() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/waitlist').then(r => r.json()).then(setEntries).finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Waitlist ({entries.length})</h2>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Business</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Trade</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Plan Interest</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Signed Up</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-gray-900">{e.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-700">{e.email}</td>
                <td className="px-4 py-3 text-gray-500">{e.businessName ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{e.trade ?? '—'}</td>
                <td className="px-4 py-3">{e.planInterest ? tierBadge(e.planInterest.toLowerCase()) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{fmt(e.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Emails Tab ───────────────────────────────────────────────── */

function EmailsTab() {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [triggerCheckInId, setTriggerCheckInId] = useState('')
  const [triggering, setTriggering] = useState(false)
  const [triggerResult, setTriggerResult] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/email-config').then(r => r.json()).then(setConfig).finally(() => setLoading(false))
  }, [])

  const saveConfig = async () => {
    if (!config) return
    setSaving(true)
    await fetch('/api/admin/email-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const triggerEmail = async () => {
    if (!triggerCheckInId.trim()) return
    setTriggering(true)
    setTriggerResult(null)
    const res = await fetch('/api/admin/email-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkInId: triggerCheckInId.trim() }),
    })
    const data = await res.json()
    setTriggerResult(res.ok ? `Sent to ${data.sentTo}` : `Error: ${data.error}`)
    setTriggering(false)
  }

  if (loading || !config) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Follow-up Email Config</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sent automatically to homeowners via Resend. Use <code className="bg-gray-100 px-1 rounded text-xs">{`{{firstName}}`}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{`{{businessName}}`}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{`{{jobLocation}}`}</code>, <code className="bg-gray-100 px-1 rounded text-xs">{`{{reviewLink}}`}</code> as placeholders.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send delay (days after publish)</label>
            <input
              type="number"
              min={1}
              max={30}
              value={config.followUpEmailDays}
              onChange={(e) => setConfig({ ...config, followUpEmailDays: e.target.value })}
              className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject line</label>
            <input
              type="text"
              value={config.followUpEmailSubject}
              onChange={(e) => setConfig({ ...config, followUpEmailSubject: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email body</label>
            <textarea
              rows={14}
              value={config.followUpEmailBody}
              onChange={(e) => setConfig({ ...config, followUpEmailBody: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y"
            />
          </div>

          <button
            onClick={saveConfig}
            disabled={saving}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Config'}
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Manual Trigger</h3>
        <p className="text-sm text-gray-500 mb-3">Send a follow-up email immediately for a specific job (by Check-in ID).</p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Check-in UUID"
            value={triggerCheckInId}
            onChange={(e) => setTriggerCheckInId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={triggerEmail}
            disabled={triggering || !triggerCheckInId.trim()}
            className="bg-green-700 hover:bg-green-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {triggering ? 'Sending...' : 'Send Now'}
          </button>
        </div>
        {triggerResult && (
          <p className={`mt-2 text-sm font-medium ${triggerResult.startsWith('Error') ? 'text-red-600' : 'text-green-700'}`}>
            {triggerResult}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── AI Settings Tab ──────────────────────────────────────────── */

interface RateConfig {
  jobDescriptionEnabled: boolean
  jobDescriptionPerJobCap: number
  jobDescriptionDailyOrgCap: number
  websiteScanEnabled: boolean
  websiteScanCap: number
  websiteScanWindowDays: number
}

function AiSettingsTab() {
  // Prompt state
  const [prompt, setPrompt] = useState('')
  const [promptLoading, setPromptLoading] = useState(true)
  const [promptSaving, setPromptSaving] = useState(false)
  const [promptSaved, setPromptSaved] = useState(false)
  const [promptError, setPromptError] = useState<string | null>(null)

  // Rate limit state
  const [rates, setRates] = useState<RateConfig>({
    jobDescriptionEnabled: true,
    jobDescriptionPerJobCap: 3,
    jobDescriptionDailyOrgCap: 20,
    websiteScanEnabled: true,
    websiteScanCap: 2,
    websiteScanWindowDays: 7,
  })
  const [ratesLoading, setRatesLoading] = useState(true)
  const [ratesSaving, setRatesSaving] = useState(false)
  const [ratesSaved, setRatesSaved] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/ai-prompt')
      .then(r => r.json())
      .then(data => setPrompt(data.prompt ?? ''))
      .finally(() => setPromptLoading(false))

    fetch('/api/admin/ai-settings')
      .then(r => r.json())
      .then(data => { if (data.config) setRates(data.config) })
      .finally(() => setRatesLoading(false))
  }, [])

  const savePrompt = async () => {
    setPromptSaving(true)
    setPromptError(null)
    try {
      const res = await fetch('/api/admin/ai-prompt', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save')
      }
      setPromptSaved(true)
      setTimeout(() => setPromptSaved(false), 2000)
    } catch (err: any) {
      setPromptError(err.message)
    } finally {
      setPromptSaving(false)
    }
  }

  const saveRates = async () => {
    setRatesSaving(true)
    setRatesError(null)
    try {
      const res = await fetch('/api/admin/ai-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rates),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Failed to save')
      }
      setRatesSaved(true)
      setTimeout(() => setRatesSaved(false), 2000)
    } catch (err: any) {
      setRatesError(err.message)
    } finally {
      setRatesSaving(false)
    }
  }

  if (promptLoading || ratesLoading) return <p className="text-gray-500 text-sm">Loading...</p>

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

      {/* LEFT — System Prompt */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">AI Job Description Prompt</h2>
        <p className="text-sm text-gray-500 mb-4">
          System prompt used by the AI copywriting agent to generate job descriptions for Titan customers.
          Changes take effect immediately — no deploy required. Blank the field and save to restore the default.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System prompt</label>
            <textarea
              rows={18}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-gray-400">
              The prompt receives BUSINESS CONTEXT (services, products, service area, about) and JOB CONTEXT (door type, location, notes) as the user message, along with up to 5 job photos as vision content blocks.
            </p>
          </div>
          {promptError && <p className="text-sm text-red-600">{promptError}</p>}
          <button
            onClick={savePrompt}
            disabled={promptSaving || !prompt.trim()}
            className="bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {promptSaving ? 'Saving...' : promptSaved ? 'Saved!' : 'Save Prompt'}
          </button>
        </div>
      </div>

      {/* RIGHT — Rate Limits */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Rate Limits</h2>
        <p className="text-sm text-gray-500 mb-4">
          Controls apply to all Titan accounts. Changes take effect immediately.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-6">

          {/* Job Description Generator */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              Job Description Generator
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Enabled</span>
              <button
                role="switch"
                aria-checked={rates.jobDescriptionEnabled}
                onClick={() => setRates(r => ({ ...r, jobDescriptionEnabled: !r.jobDescriptionEnabled }))}
                style={{ width: 40, height: 24, borderRadius: 9999, border: 'none', padding: 0, cursor: 'pointer', position: 'relative', flexShrink: 0, backgroundColor: rates.jobDescriptionEnabled ? '#10b981' : '#d1d5db', transition: 'background-color 0.2s' }}
              >
                <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', top: 4, left: rates.jobDescriptionEnabled ? 20 : 4, transition: 'left 0.15s' }} />
              </button>
            </div>
            <div className={`space-y-3 ${!rates.jobDescriptionEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Generations per job</span>
                <input
                  type="number"
                  min={1}
                  value={rates.jobDescriptionPerJobCap}
                  onChange={(e) => setRates(r => ({ ...r, jobDescriptionPerJobCap: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm text-center"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Generations per org / day</span>
                <input
                  type="number"
                  min={1}
                  value={rates.jobDescriptionDailyOrgCap}
                  onChange={(e) => setRates(r => ({ ...r, jobDescriptionDailyOrgCap: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm text-center"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Website Scanner */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              Website Scanner
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Enabled</span>
              <button
                role="switch"
                aria-checked={rates.websiteScanEnabled}
                onClick={() => setRates(r => ({ ...r, websiteScanEnabled: !r.websiteScanEnabled }))}
                style={{ width: 40, height: 24, borderRadius: 9999, border: 'none', padding: 0, cursor: 'pointer', position: 'relative', flexShrink: 0, backgroundColor: rates.websiteScanEnabled ? '#10b981' : '#d1d5db', transition: 'background-color 0.2s' }}
              >
                <span style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', top: 4, left: rates.websiteScanEnabled ? 20 : 4, transition: 'left 0.15s' }} />
              </button>
            </div>
            <div className={`space-y-3 ${!rates.websiteScanEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Scans per window</span>
                <input
                  type="number"
                  min={1}
                  value={rates.websiteScanCap}
                  onChange={(e) => setRates(r => ({ ...r, websiteScanCap: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm text-center"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Window length (days)</span>
                <input
                  type="number"
                  min={1}
                  value={rates.websiteScanWindowDays}
                  onChange={(e) => setRates(r => ({ ...r, websiteScanWindowDays: Math.max(1, parseInt(e.target.value) || 1) }))}
                  className="w-16 border border-gray-300 rounded-md px-2 py-1 text-sm text-center"
                />
              </div>
            </div>
          </div>

          {ratesError && <p className="text-sm text-red-600">{ratesError}</p>}
          <button
            onClick={saveRates}
            disabled={ratesSaving}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
          >
            {ratesSaving ? 'Saving...' : ratesSaved ? 'Saved!' : 'Save Rate Limits'}
          </button>
        </div>
      </div>

    </div>
  )
}
