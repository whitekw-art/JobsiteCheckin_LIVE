'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { tierHasFeature } from '@/lib/planVersions'
import { ONBOARDING_STEP_KEY, ONBOARDING_CHAPTER_KEY } from '@/lib/onboardingProgress'
import { startCoachMarks } from '@/components/CoachMarks'
import BusinessNameWarning from '@/components/BusinessNameWarning'
import { hasCoachSteps, NAV_TIP_CHAPTER } from '@/lib/coachMarks'
import { revealSupportNav } from '@/lib/navReveal'
import { TRADES } from '@/lib/tradeProducts'
import { GoogleGIcon, GoogleWordmark } from '@/components/GoogleIcons'
import { GBP_PERMISSION_LABEL, GSC_PERMISSION_LABEL } from '@/lib/googlePermissions'

const WIDGET_PLATFORM_INSTRUCTIONS: Record<string, string> = {
  WordPress: '1. Log into WordPress and open the page where you want your work to show up (or create a new page).\n2. Click the + button to add a new block.\n3. Type "Custom HTML" in the search box and select it.\n4. Paste the code below into that block.\n5. Click Update (or Publish) in the top right to save your page.',
  Squarespace: '1. Log into Squarespace and open the page where you want your work to show up.\n2. Click Edit on that page.\n3. Click the + icon where you want the widget to appear, scroll down, and choose Code.\n4. Paste the code below into the box that opens, then click Apply.\n5. Click Save, then Publish, in the top right.',
  Webflow: '1. Open your site in the Webflow Designer and go to the page where you want your work to show up.\n2. In the left panel, find the Embed element and drag it onto the page.\n3. Double-click the Embed box you just added.\n4. Paste the code below into the box, then click Save & Close.\n5. Click Publish in the top right to make it live.',
  'Plain HTML': '1. Find the HTML file for the page where you want your work to show up. If someone else built your site, ask them for it — or log into your hosting account (GoDaddy, Bluehost, Netlify, etc.) and look for "File Manager" or "Site Files."\n2. Right-click that file and choose Open With → Notepad (Windows) or TextEdit (Mac). Don’t use Microsoft Word — it can break the file.\n3. Press Ctrl+F (Cmd+F on Mac) and search for </body>. That’s a marker near the end of the file.\n4. Click right before </body> and paste the code below.\n5. Save the file, then upload it back to your host the same way you found it. Most hosts show a Save or Publish button.\n6. Stuck? Your web host’s live chat can usually paste one snippet for you in a few minutes — just say "I need to add one HTML snippet before </body> on this page."',
}

const HEARD_ABOUT = [
  'Google Search',
  'Facebook / Social Media',
  'Referral from a colleague',
  'LinkedIn',
  'Trade show / event',
  'Online ad',
  'Other',
]

const PLAN_LABELS: Record<string, string> = {
  free:  'Free Starter',
  pro:   'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

const PLAN_FEATURES: Record<string, string[]> = {
  free:  ['Job check-ins with photos (up to 5 per job)', 'Basic dashboard'],
  pro:   ['Unlimited published job pages with full SEO', 'Portfolio page', 'Analytics & click tracking', 'Google Business Profile post generator'],
  elite: ['Everything in Pro', 'Work published to your Google Business Profile intelligently', 'Real Google Search data in your reporting', 'Professional before & after images', 'Ghost camera overlay', 'Drag-to-reveal widget'],
  titan: ['Everything in Elite', 'Automatic Google Business review requests', 'Custom AI copywriting agent', 'Custom AI Review Request Manager', 'Custom website widget for local SEO', 'Custom subdomain & white-label branding'],
}

interface Props {
  planTier?: string | null
  orgSlug?: string | null
  /**
   * Replay mode, used by the Interactive Tutorial in the Support Center.
   *
   * First-run onboarding is deliberately a one-way trip: it is forced, it has
   * no exit, and finishing it marks the account complete. A customer coming
   * back to refresh their memory needs the opposite on all three counts, so
   * replay starts from step 1 rather than resuming a stale saved position,
   * offers a way out at any point, and never touches the completion flag,
   * which is already set and must not be rewritten.
   */
  replay?: boolean
  /**
   * Called when a replay is closed or finished, and in both modes when a
   * chapter hands the screen to the coach-mark overlay, so the host page can
   * take the modal out of the way.
   */
  onExit?: () => void
  /** Chapter to open at. The tutorial index uses this to jump straight to one. */
  startChapter?: number
  /**
   * First run only: whether Account Setup (chapter 1) is already finished for
   * this account. A saved chapter past 1 is honoured only when it is, so a
   * position left in storage by another account on the same browser can never
   * skip a new account past Account Setup.
   */
  accountSetupDone?: boolean
}


/**
 * Onboarding is chaptered. Chapter 1 keeps the original flat step numbers
 * exactly as they were, so every existing handler and render branch in that
 * chapter is untouched — the chapter layer sits on top rather than renumbering
 * a flow that already ships.
 *
 * `kind` decides the container: 'modal' renders inside this dialog, 'coach'
 * hands off to the coach-mark overlay, which dims the real page and points at
 * real controls. Chapters 2-7 carry no steps yet; their content is specified
 * separately and lands in CHAPTER_STEPS.
 */
export const FINISH_CHAPTER = 8

/**
 * The "Account setup is complete" screen that closes chapter 1 and introduces
 * the walkthrough. Numbered past every real Account Setup step so it never
 * collides with one, whichever plan adds or drops the website step.
 */
const SETUP_DONE_STEP = 7

/**
 * Connect Google Business Profile — Elite and Titan only, between the review
 * link and website integration. Numbered out of sequence for the same reason
 * as SETUP_DONE_STEP: inserting it as step 5 would renumber the steps after it
 * and every saved position that points at them.
 */
const GBP_CONNECT_STEP = 8

export const CHAPTERS: { id: number; name: string; short: string; kind: 'modal' | 'coach'; intro: string }[] = [
  // `intro` describes the area of the app being reviewed and why it matters to
  // the business. It is deliberately not about how the tutorial works — the
  // customer already knows they are in a tutorial.
  {
    id: 1, name: 'Account Setup', short: 'Setup', kind: 'modal',
    intro: 'This chapter covers your business details, your Google listing, and where your finished work gets published.',
  },
  {
    id: 2, name: 'Create / Modify your Team', short: 'Team', kind: 'coach',
    intro: 'This chapter walks you through the process of adding new team members and assigning access roles. Your field workers need access to submit real jobs.',
  },
  {
    id: 3, name: 'Submit a Checkin', short: 'Check-In', kind: 'coach',
    intro: 'A check-in is how a finished job becomes a page on your website. This chapter walks through capturing the work on site: photos, location, and what was done.',
  },
  {
    id: 4, name: 'Using your Job Dashboard', short: 'Dashboard', kind: 'coach',
    intro: 'Every job your crew submits lands here for you to review before it goes public. This chapter walks through approving, editing, and publishing that work.',
  },
  {
    id: 5, name: 'Understanding Reporting', short: 'Reporting', kind: 'coach',
    intro: 'This chapter walks through each number on your Reporting page, what it says about how people are finding you, and what tends to move it.',
  },
  {
    id: 6, name: 'Account Center', short: 'Account', kind: 'coach',
    intro: 'This chapter walks through what each Account tab controls: your business profile, billing, sign-in details, and the connections that publish your work.',
  },
]


/**
 * Collapsible option card for the website-integration step. Deliberately
 * mirrors the ConnCard layout on Account -> Connections: these are the same
 * three options, and a customer who meets them here then goes looking for
 * them there should recognise the same rows.
 */
function OnbIntegrationCard({
  icon, iconBg = '#F0F9FF', title, tier, sub, open, onToggle, children,
}: {
  icon: React.ReactNode
  iconBg?: string
  title: string
  tier: string
  sub: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div style={{ border: '1px solid #BAE6FD', borderRadius: 10, background: '#fff', overflow: 'hidden', marginBottom: 10 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div style={{ width: 32, height: 32, borderRadius: 8, background: iconBg, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Block, not flex: these titles are long enough to wrap, and a flex
              tier chip would drop onto a line of its own instead of trailing
              the last word the way it does on Connections. */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0C4A6E', letterSpacing: '-.1px', lineHeight: 1.35 }}>
            {title}
            <span style={{ marginLeft: 7, fontSize: 9.5, fontWeight: 700, letterSpacing: '.09em', textTransform: 'uppercase' as const, color: '#94A3B8', whiteSpace: 'nowrap' as const }}>{tier}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#4B7A94', marginTop: 3, lineHeight: 1.5 }}>{sub}</div>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .26s ease' }}>
        <div style={{ minHeight: 0, overflow: 'hidden' }}>
          <div style={{ borderTop: '1px solid #E0F2FE', padding: 14 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Shared footer for the two options that are explained here but completed in
 * Account -> Connections. Opens in a new tab on purpose: onboarding is a
 * blocking modal, and navigating away in place would abandon the run.
 */
function OnbSetupLink({ card, children }: { card: string; children: React.ReactNode }) {
  return (
    <a
      href={`/account?tab=connections&card=${card}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', textDecoration: 'none' }}
    >
      {children}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
    </a>
  )
}

export default function OnboardingModal({ planTier, orgSlug, replay = false, onExit, startChapter = 1, accountSetupDone = false }: Props) {
  const isTitan = (planTier ?? 'free').toLowerCase() === 'titan'
  // Widget setup step (step 6) — Titan only, gated by the website_integration feature
  const hasWidgetStep = tierHasFeature(planTier, 'website_integration')
  const hasGbpConnectStep = tierHasFeature(planTier, 'gbp_integration')

  const [step, setStepState] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    // A replay always opens at the beginning. Resuming here would drop someone
    // into the middle of a walkthrough they chose to restart.
    if (replay) return 1
    const saved = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '1', 10)
    const max = tierHasFeature(planTier, 'website_integration') ? 6 : 5
    const extra = saved === SETUP_DONE_STEP || (saved === GBP_CONNECT_STEP && tierHasFeature(planTier, 'gbp_integration'))
    return (saved >= 1 && saved <= max) || extra ? saved : 1
  })

  const setStep = (n: number) => {
    // Replay leaves the saved position alone. Writing to it would let a browse
    // through the tutorial overwrite a genuine first run left half-finished in
    // another tab.
    if (!replay) localStorage.setItem(ONBOARDING_STEP_KEY, String(n))
    setStepState(n)
  }

  const [chapter, setChapterState] = useState<number>(() => {
    if (typeof window === 'undefined') return startChapter
    if (replay) return startChapter
    if (!accountSetupDone) return 1
    const saved = parseInt(localStorage.getItem(ONBOARDING_CHAPTER_KEY) || '1', 10)
    return (saved >= 1 && saved <= FINISH_CHAPTER) ? saved : 1
  })

  const setChapter = (n: number) => {
    if (!replay) localStorage.setItem(ONBOARDING_CHAPTER_KEY, String(n))
    setChapterState(n)
  }

  // Account Setup is finished the moment a first run leaves chapter 1, so the
  // account is marked complete then rather than at the very end. Two reasons:
  // the account is usable from this point (the same reasoning as Save & exit),
  // and middleware keeps an incomplete account on /dashboard, which would
  // bounce the coach-mark tours for Check-In, Reporting and Account off their
  // pages. The session refresh re-issues the token middleware reads.
  const accountSetupSaved = useRef<Promise<unknown> | null>(null)
  const markAccountSetupDone = () => {
    if (replay || accountSetupSaved.current) return accountSetupSaved.current
    accountSetupSaved.current = fetch('/api/organization/complete-onboarding', { method: 'POST' })
      .then(() => fetch('/api/auth/session'))
      .catch(() => { accountSetupSaved.current = null })
    return accountSetupSaved.current
  }

  // Chapters 2+ are entered at their own first step. Chapter 1 is the legacy
  // flow and owns its step numbers, so it is never re-seeded here.
  const goToChapter = (n: number) => {
    if (chapter === 1 && n > 1) void markAccountSetupDone()
    setChapter(n)
    if (n !== 1) setStep(1)
  }

  const chapterAfter = (c: number) => (c >= CHAPTERS.length ? FINISH_CHAPTER : c + 1)
  const nextChapter = () => goToChapter(chapterAfter(chapter))

  // Account Setup is a forced flow: there is nothing saved yet, so letting
  // someone leave halfway would strand a half-built account. Once it is behind
  // them the remaining chapters are explanatory, and leaving is safe.
  const setupDone = chapter === 1 && step === SETUP_DONE_STEP
  const canExit = replay || chapter > 1 || setupDone

  // GBP connect step (Elite + Titan). Mirrors the Connect Your Google Business
  // Profile card on Account -> Connections and uses the same routes, so the
  // two can never disagree about the connection's state.
  const [gbpStatus,       setGbpStatus]       = useState<string | null>(null)
  const [gbpHasCred,      setGbpHasCred]      = useState(false)
  const [gbpLocationName, setGbpLocationName] = useState<string | null>(null)
  const [gbpLocations,    setGbpLocations]    = useState<{ name: string; title: string }[]>([])
  const [gbpChoice,       setGbpChoice]       = useState('')
  const [gbpAutoPost,     setGbpAutoPost]     = useState(false)
  const [gbpBusy,         setGbpBusy]         = useState(false)
  const [gbpError,        setGbpError]        = useState<string | null>(null)
  const gbpConnected = gbpStatus === 'connected' && gbpHasCred

  const reloadGbpStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/organization/gbp')
      if (!res.ok) return
      const data = await res.json()
      setGbpStatus(data.status ?? null)
      setGbpHasCred(Boolean(data.connected))
      setGbpLocationName(data.locationName ?? null)
      setGbpAutoPost(Boolean(data.autoPost))
      if (data.status === 'select_location') {
        const listRes = await fetch('/api/organization/gbp/locations')
        if (listRes.ok) {
          const list = await listRes.json()
          setGbpLocations(list.locations ?? [])
          setGbpChoice(list.locations?.[0]?.name ?? '')
        }
      }
    } catch { /* leave the last known state on screen */ }
  }, [])

  // Load the connection whenever this step is on screen, including the return
  // from Google: middleware carries the callback's ?gbp=<outcome> over to
  // /dashboard, and it is stripped once read so a refresh doesn't replay it.
  useEffect(() => {
    if (chapter !== 1 || step !== GBP_CONNECT_STEP || !hasGbpConnectStep) return
    const outcome = new URLSearchParams(window.location.search).get('gbp')
    if (outcome === 'denied') setGbpError('You cancelled the Google connection. Nothing was changed.')
    else if (outcome === 'failed') setGbpError('We could not finish connecting to Google. Please try again.')
    if (outcome) window.history.replaceState({}, '', window.location.pathname)
    reloadGbpStatus()
  }, [chapter, step, hasGbpConnectStep, reloadGbpStatus])

  const handleGbpConnect = async () => {
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch('/api/organization/gbp', { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.consentUrl) {
        setGbpError(data?.error || 'Could not start the connection. Please try again.')
        setGbpBusy(false)
        return
      }
      // Leaves the app for Google. The saved step brings the customer back here.
      window.location.assign(data.consentUrl)
    } catch {
      setGbpError('Could not start the connection. Please try again.')
      setGbpBusy(false)
    }
  }

  const handleGbpSelectLocation = async () => {
    if (!gbpChoice) return
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch('/api/organization/gbp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId: gbpChoice }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGbpError(data?.error || 'Could not save your selection.')
      } else {
        setGbpStatus('connected')
        setGbpHasCred(true)
        setGbpLocationName(data.gbpLocationName ?? null)
      }
    } catch {
      setGbpError('Could not save your selection.')
    } finally {
      setGbpBusy(false)
    }
  }

  const handleGbpCheckAgain = async () => {
    setGbpBusy(true)
    setGbpError(null)
    try {
      const res = await fetch('/api/organization/gbp/locations')
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setGbpError(data?.error || 'Could not check your Google account. Please try again.')
        return
      }
      if ((data.locations ?? []).length === 0) {
        setGbpError('We still cannot find a business listing on that Google account.')
        return
      }
      await reloadGbpStatus()
    } catch {
      setGbpError('Could not check your Google account. Please try again.')
    } finally {
      setGbpBusy(false)
    }
  }

  const handleGbpAutoPostToggle = async () => {
    const next = !gbpAutoPost
    setGbpAutoPost(next) // optimistic, reverted if the server disagrees
    setGbpError(null)
    try {
      const res = await fetch('/api/organization/gbp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPost: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setGbpError(data?.error || 'Could not save that setting.')
        setGbpAutoPost(!next)
      }
    } catch {
      setGbpError('Could not save that setting.')
      setGbpAutoPost(!next)
    }
  }

  // Step 4 — GBP review link
  const [gbpReviewLink,  setGbpReviewLink]  = useState('')
  const [gbpLinkSaving,  setGbpLinkSaving]  = useState(false)
  const [gbpLinkError,   setGbpLinkError]   = useState<string | null>(null)

  // Step 2 form state
  const [bizName,      setBizName]      = useState('')
  const [bizPhone,     setBizPhone]     = useState('')
  const [bizWebsite,   setBizWebsite]   = useState('')
  const [trade,        setTrade]        = useState('')
  const [heardAbout,   setHeardAbout]   = useState('')
  const [heardOther,   setHeardOther]   = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [savedSlug,    setSavedSlug]    = useState<string | null>(orgSlug ?? null)

  // Widget setup step state (step 6, Titan only)
  const [wUrl,            setWUrl]            = useState('')
  const [wSaving,         setWSaving]         = useState(false)
  const [wError,          setWError]          = useState<string | null>(null)
  const [wPlatform,       setWPlatform]       = useState<string>('WordPress')
  const [wCopied,         setWCopied]         = useState(false)
  const [wShowInfo,       setWShowInfo]       = useState(false)
  const [wShowUrlInstr,   setWShowUrlInstr]   = useState(false)
  const [wShowEmbedInstr, setWShowEmbedInstr] = useState(false)
  const [wOpenCards,      setWOpenCards]      = useState<Record<string, boolean>>({})

  // AI research step state (Titan only — shown between step 2 and step 3)
  const [showAiResearch,  setShowAiResearch]  = useState(false)
  const [aiScraping,      setAiScraping]      = useState(false)
  const [aiScraped,       setAiScraped]       = useState(false)
  const [aiError,         setAiError]         = useState<string | null>(null)
  const [aiServices,      setAiServices]      = useState('')
  const [aiProducts,      setAiProducts]      = useState('')
  const [aiServiceArea,   setAiServiceArea]   = useState('')
  const [aiAbout,         setAiAbout]         = useState('')
  const [aiSaving,        setAiSaving]        = useState(false)

  const handleActivateAgentResearch = useCallback(async () => {
    setAiScraping(true)
    setAiError(null)
    try {
      const res = await fetch('/api/agents/scrape-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setAiError(data?.error === 'rate_limited' ? 'Scan limit reached.' : 'Unable to read your website. Fill in your business info below.')
        setAiScraped(true)
        return
      }
      setAiServices(data.services ?? '')
      setAiProducts(data.products ?? '')
      setAiServiceArea(data.serviceArea ?? '')
      setAiAbout(data.businessDescription ?? '')
      setAiScraped(true)
    } catch {
      setAiError('Unable to read your website. Fill in your business info below.')
      setAiScraped(true)
    } finally {
      setAiScraping(false)
    }
  }, [])

  const handleAiStepConfirm = useCallback(async () => {
    setAiSaving(true)
    try {
      await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          services: aiServices,
          products: aiProducts,
          serviceArea: aiServiceArea,
          businessDescription: aiAbout,
        }),
      })
    } catch {
      // non-fatal — data already saved by scrape route; silently continue
    } finally {
      setAiSaving(false)
      setShowAiResearch(false)
      setStep(3)
    }
  }, [aiServices, aiProducts, aiServiceArea, aiAbout])

  // ESC is swallowed during first run, which is forced and has no way out.
  // A replay is something the customer opened on purpose, so there ESC closes
  // it like any other dismissible dialog.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      if (replay) onExit?.()
    }
    document.addEventListener('keydown', handler, true)
    return () => document.removeEventListener('keydown', handler, true)
  }, [replay, onExit])

  // ── Replay prefill ────────────────────────────────────────────────────────
  // First run starts blank because there is genuinely nothing saved yet. A
  // replay runs against an established account, so opening it blank is not
  // merely inconvenient: `/api/organization/onboarding` writes null for every
  // field it is not given, so advancing past step 2 with empty boxes would
  // erase the phone, website, trade and how-heard answers outright.
  //
  // Seeding from the same endpoint the Account page reads means the customer
  // sees what they already have and saves it back unchanged.
  const [prefillLoaded, setPrefillLoaded] = useState(!replay)
  const [heardAboutSaved, setHeardAboutSaved] = useState('')
  // The name the account already had when a replay opened. Renaming here is
  // the one edit in this flow that rebuilds the org slug, so it is confirmed
  // before it is sent.
  const [savedBizName, setSavedBizName] = useState('')
  const [nameChange, setNameChange] = useState<{ from: string; to: string } | null>(null)
  // The tip between the welcome screen and the business details form points at
  // the sidebar, so the modal has to step aside while it is on screen.
  const [navTipOpen, setNavTipOpen] = useState(false)

  useEffect(() => {
    if (!navTipOpen) return
    const check = () => {
      let active = false
      try { active = !!sessionStorage.getItem('pc_coach_session') } catch { active = false }
      if (!active) { setNavTipOpen(false); setStep(2) }
    }
    window.addEventListener('pc-coach-change', check)
    return () => window.removeEventListener('pc-coach-change', check)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navTipOpen])


  useEffect(() => {
    if (!replay) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/organization/profile')
        if (!res.ok) return
        const { organization: org } = await res.json()
        if (cancelled || !org) return

        setBizName(org.name ?? '')
        setSavedBizName(org.name ?? '')
        setBizPhone(org.phone ?? '')
        setBizWebsite(org.website ?? '')
        setTrade(org.trade ?? '')
        setGbpReviewLink(org.gbpReviewLink ?? '')
        setWUrl(org.portfolioPageUrl ?? '')
        if (org.slug) setSavedSlug(org.slug)
        // Held separately and posted back verbatim. The field itself stays
        // hidden on replay, since asking again how someone found us a year on
        // is noise, but omitting it would null the original answer.
        setHeardAboutSaved(org.howHeardAbout ?? '')

        if (org.businessContext) {
          try {
            const ctx = JSON.parse(org.businessContext)
            setAiServices(ctx.services ?? '')
            setAiProducts(ctx.products ?? '')
            setAiServiceArea(ctx.serviceArea ?? '')
            setAiAbout(ctx.businessDescription ?? '')
            setAiScraped(true)
          } catch { /* malformed context is not worth failing the replay over */ }
        }
      } catch { /* leave the form empty rather than blocking the tutorial */ }
      finally {
        if (!cancelled) setPrefillLoaded(true)
      }
    })()
    return () => { cancelled = true }
  }, [replay])

  // "Skip for now" is right on a first run, where the step is genuinely
  // deferred. On a replay nothing is pending, so the label says what the
  // button actually does: move on without writing anything.
  const skipLabel = replay ? 'Skip — no changes' : 'Skip for now'

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (d.length === 0) return ''
    if (d.length < 4)  return `(${d}`
    if (d.length < 7)  return `(${d.slice(0,3)}) ${d.slice(3)}`
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`
  }

  const handleStep2Submit = async () => {
    setError(null)
    if (!bizName.trim()) { setError('Business name is required.'); return }

    // Only on a replay: a first run has nothing published to disturb, and the
    // name typed here is the first real one the account has had.
    const prior = savedBizName.trim()
    if (replay && prior && bizName.trim() !== prior) {
      setNameChange({ from: prior, to: bizName.trim() })
      return
    }
    await submitStep2()
  }

  const submitStep2 = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/organization/onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          bizName.trim(),
          phone:         bizPhone.trim() || undefined,
          website:       bizWebsite.trim() || undefined,
          trade:         trade || undefined,
          // On replay the question is hidden, so the stored answer is sent
          // straight back. Letting it fall through as undefined would null it.
          howHeardAbout: replay
            ? (heardAboutSaved || undefined)
            : (heardAbout === 'Other' ? heardOther.trim() : heardAbout || undefined),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save. Please try again.')
      if (data?.organization?.slug) setSavedSlug(data.organization.slug)
      if (isTitan) {
        setShowAiResearch(true)
      } else {
        setStep(3)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Website integration only exists on Titan, so for everyone else the
  // review link is the last step of Account Setup.
  const handleSaveAndExit = async () => {
    if (replay) { onExit?.(); return }
    // Account Setup is finished by this point, so the account is usable. The
    // remaining chapters are a walkthrough, and abandoning them must not leave
    // the account flagged incomplete and bounced back here on next sign-in.
    await fetch('/api/organization/complete-onboarding', { method: 'POST' })
    await fetch('/api/auth/session')
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    localStorage.removeItem(ONBOARDING_CHAPTER_KEY)
    window.location.href = '/dashboard'
  }

  // Every way out of the last Account Setup step lands on the setup-complete
  // screen, whose Continue then opens the Team chapter.
  const finishAccountSetup = () => setStep(SETUP_DONE_STEP)

  const afterGbpConnect = () => { if (hasWidgetStep) setStep(5); else finishAccountSetup() }
  const afterReviewLink = () => { if (hasGbpConnectStep) setStep(GBP_CONNECT_STEP); else afterGbpConnect() }
  // The last real Account Setup step, which Back on the setup-complete screen returns to.
  const lastSetupStep = hasWidgetStep ? 5 : hasGbpConnectStep ? GBP_CONNECT_STEP : 4

  const handleGbpLinkSave = async () => {
    const link = gbpReviewLink.trim()
    if (!link) { afterReviewLink(); return }

    const isValid =
      link.startsWith('https://g.page/r/') ||
      link.startsWith('https://search.google.com/local/writereview')
    if (!isValid) {
      setGbpLinkError('Link must start with https://g.page/r/ or https://search.google.com/local/writereview')
      return
    }

    setGbpLinkSaving(true)
    setGbpLinkError(null)
    try {
      const res = await fetch('/api/organization/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gbpReviewLink: link }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save. Please try again.')
      }
      afterReviewLink()
    } catch (err: any) {
      setGbpLinkError(err.message)
    } finally {
      setGbpLinkSaving(false)
    }
  }

  const handleFinish = async () => {
    // A replay hands control back to the page that opened it. The completion
    // flag is already set, the saved step belongs to first run, and a hard
    // redirect to the dashboard would throw away where the customer was.
    if (replay) {
      onExit?.()
      return
    }
    await fetch('/api/organization/complete-onboarding', { method: 'POST' })
    await fetch('/api/auth/session')
    localStorage.removeItem(ONBOARDING_STEP_KEY)
    localStorage.removeItem(ONBOARDING_CHAPTER_KEY)
    window.location.href = '/dashboard'
  }

  const widgetSlug = savedSlug || orgSlug || 'your-business'
  const widgetBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')

  // Host shown in the CNAME example. This step can run before a website has
  // been entered, so it falls back to a placeholder rather than an empty gap.
  const cnameApex = (() => {
    const raw = bizWebsite.trim()
    if (!raw) return 'yourdomain.com'
    try {
      const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname
      return host.replace(/^www\./, '') || 'yourdomain.com'
    } catch {
      return 'yourdomain.com'
    }
  })()

  const handleWidgetCopy = () => {
    const snippet = `<!-- ProjectCheckin: Website Integration for Local SEO -->\n<div id="pc-widget" data-org="${widgetSlug}"></div>\n<script src="${widgetBaseUrl}/widget.v1.js" defer></script>`
    navigator.clipboard.writeText(snippet).then(() => {
      setWCopied(true)
      setTimeout(() => setWCopied(false), 2000)
    })
  }

  // Save the portfolio URL if one was entered, then advance to the final onboarding step
  const handleWidgetFinish = async () => {
    const url = wUrl.trim()
    if (url) {
      let valid = false
      try {
        const parsed = new URL(url)
        valid = parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch { valid = false }
      if (!valid) {
        setWError('Enter a full URL starting with https:// (e.g. https://yourwebsite.com/our-work)')
        return
      }
      setWSaving(true)
      setWError(null)
      try {
        const res = await fetch('/api/organization/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolioPageUrl: url }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error || 'Failed to save. Please try again.')
        }
      } catch (err: any) {
        setWError(err.message)
        setWSaving(false)
        return
      }
      setWSaving(false)
    }
    finishAccountSetup()
  }

  const tier = planTier || 'free'
  const planLabel = PLAN_LABELS[tier] || 'Free Starter'
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES.free

  return (
    <>
    {navTipOpen ? null : (
    <>
    {nameChange && (
      <BusinessNameWarning
        from={nameChange.from}
        to={nameChange.to}
        // This route rebuilds the slug from the new name.
        slugWillChange
        onCancel={() => { setBizName(nameChange.from); setNameChange(null) }}
        onConfirm={() => { setNameChange(null); submitStep2() }}
      />
    )}
    <div style={styles.backdrop} aria-modal="true" role="dialog" aria-label={replay ? 'Interactive tutorial' : 'Account setup'}>
      <div style={styles.modal}>

        {/* Account Setup has no way out by design — it is the one chapter a new
            account must finish before reaching the app. Everything after it is
            explanatory, so from chapter 2 on there is an exit. */}
        {canExit && (
          <button
            type="button"
            onClick={handleSaveAndExit}
            aria-label="Close tutorial"
            style={{
              position: 'absolute', top: 14, right: 14, width: 30, height: 30,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
              color: '#64748B', cursor: 'pointer', padding: 0, lineHeight: 0,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}

        {/* Chapter bar — one segment per chapter, filling by progress within it.
            Replaces the old per-step dot row, which stopped being countable
            once onboarding grew past a single chapter. */}
        {chapter !== FINISH_CHAPTER && (() => {
          const current = CHAPTERS.find(c => c.id === chapter) ?? CHAPTERS[0]
          // Chapter 1 still measures itself in legacy step numbers, and the
          // Titan AI interstitial is a step the customer sees even though it
          // has no number of its own.
          // Account Setup in the order the customer meets it. Some steps are
          // numbered out of sequence (see GBP_CONNECT_STEP), so the position is
          // looked up in this list rather than read off the step number. The
          // Titan AI interstitial has no step number of its own.
          const setupOrder: (number | 'research')[] = [
            1, 2,
            ...(isTitan ? ['research' as const] : []),
            3, 4,
            ...(hasGbpConnectStep ? [GBP_CONNECT_STEP] : []),
            ...(hasWidgetStep ? [5] : []),
          ]
          const stepsHere = chapter === 1 ? setupOrder.length : 1
          const posHere = setupDone
            ? stepsHere
            : chapter === 1
              ? Math.max(1, setupOrder.indexOf(showAiResearch ? 'research' : step) + 1)
              : 1
          return (
            <div style={{ marginBottom: 22 }}>
              {/* Leaves room for the close button, which is absolutely
                  positioned over this row's right edge when it is shown. */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 9, paddingRight: canExit ? 34 : 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-.015em', color: '#0C4A6E', minWidth: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase' as const, color: '#94A3B8', marginRight: 8 }}>
                    Chapter {chapter} of {CHAPTERS.length}
                  </span>
                  {current.name}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#94A3B8', whiteSpace: 'nowrap' as const }}>
                  {setupDone ? 'Complete' : `Step ${Math.min(posHere, stepsHere)} of ${stepsHere}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {CHAPTERS.map(c => {
                  const fill = c.id < chapter ? 100 : c.id > chapter ? 0 : (posHere / stepsHere) * 100
                  const finished = c.id < chapter || (setupDone && c.id === 1)
                  return (
                    <div key={c.id} style={{ flex: 1, height: 5, borderRadius: 99, background: '#E0F2FE', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, width: `${fill}%`, background: finished ? '#059669' : '#0EA5E9', transition: 'width .3s ease' }} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── TITAN ONLY: AI Agent Research step (shown after step 2) ── */}
        {chapter === 1 && showAiResearch && isTitan && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#FFF7ED', borderColor: '#FED7AA' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14M15.54 8.46a5 5 0 010 7.07M8.46 8.46a5 5 0 000 7.07"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>Activate Agent Research</h2>
            <p style={styles.stepSub}>
              Your AI copywriting agent reads your website to learn your business — services, products, and service area — so it can write accurate job descriptions without you lifting a finger.
            </p>

            {bizWebsite && (
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#0C4A6E' }}>
                <span style={{ fontWeight: 600 }}>Website: </span>
                <span style={{ color: '#0EA5E9' }}>{bizWebsite}</span>
              </div>
            )}

            {!aiScraped && (
              <button
                style={{ ...styles.btnPrimary, ...(aiScraping ? styles.btnDisabled : {}), background: aiScraping ? '#94A3B8' : '#F97316' }}
                onClick={handleActivateAgentResearch}
                disabled={aiScraping}
              >
                {aiScraping ? (
                  <>
                    <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10"/>
                    </svg>
                    Analyzing your website…
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M4.93 4.93a10 10 0 000 14.14"/></svg>
                    Activate Agent Research
                  </>
                )}
              </button>
            )}

            {aiError && (
              <div style={{ ...styles.errorBox, marginBottom: 12 }}>{aiError}</div>
            )}

            {aiScraped && (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 14, marginTop: 4 }}>
                {!aiError && (
                  <div style={{ background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 8, padding: '8px 12px', fontSize: 12.5, color: '#065F46' }}>
                    Research complete. Review and edit below before continuing.
                  </div>
                )}
                <div style={styles.field}>
                  <label style={styles.label}>Services offered</label>
                  <input type="text" style={styles.input} value={aiServices} onChange={e => setAiServices(e.target.value)} placeholder="e.g. Door installation, garage doors, storm doors" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Products / brands</label>
                  <input type="text" style={styles.input} value={aiProducts} onChange={e => setAiProducts(e.target.value)} placeholder="e.g. Therma-Tru, Pella, Emtek hardware" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Service area</label>
                  <input type="text" style={styles.input} value={aiServiceArea} onChange={e => setAiServiceArea(e.target.value)} placeholder="e.g. Huntsville, AL and surrounding areas" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>About your business</label>
                  <textarea
                    style={{ ...styles.input, height: 'auto', padding: '10px 14px', resize: 'vertical' as const }}
                    rows={3}
                    value={aiAbout}
                    onChange={e => setAiAbout(e.target.value)}
                    placeholder="1–2 sentences about what you do and who you serve."
                  />
                </div>

                <button
                  style={{ ...styles.btnPrimary, ...(aiSaving ? styles.btnDisabled : {}) }}
                  onClick={handleAiStepConfirm}
                  disabled={aiSaving}
                >
                  {aiSaving ? (
                    <>
                      <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                        <path d="M12 2a10 10 0 0110 10"/>
                      </svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      Looks good — continue
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </>
                  )}
                </button>

                {replay && (
                  <button
                    type="button"
                    style={styles.btnSkip}
                    disabled={aiSaving}
                    onClick={() => { setShowAiResearch(false); setStep(3) }}
                  >
                    Skip — no changes
                  </button>
                )}
              </div>
            )}

            {!aiScraped && (
              <button onClick={() => { setShowAiResearch(false); setStep(3) }} style={styles.btnSkip}>
                {skipLabel}
              </button>
            )}
          </div>
        )}

        {/* ── STEP 1: Welcome ── */}
        {chapter === 1 && !showAiResearch && step === 1 && (
          <div style={styles.body}>
            <div style={styles.welcomeIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>You&rsquo;re in — welcome to ProjectCheckin</h2>
            <p style={styles.stepSub}>
              You&rsquo;re on the <strong style={{ color: '#0EA5E9' }}>{planLabel}</strong> plan.
              Here&rsquo;s what&rsquo;s ready for you:
            </p>
            <ul style={styles.featureList}>
              {features.map(f => (
                <li key={f} style={styles.featureItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="#059669" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <p style={styles.stepNote}>
              Next, we&rsquo;ll set up your business profile. It only takes 60 seconds and makes everything work properly.
            </p>
            <button
              style={styles.btnPrimary}
              onClick={() => {
                revealSupportNav()
                setNavTipOpen(true)
                startCoachMarks(NAV_TIP_CHAPTER)
              }}
            >
              Set up my business profile
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}

        {/* ── STEP 2: Business details ── */}
        {chapter === 1 && !showAiResearch && step === 2 && (
          <div style={styles.body}>
            <h2 style={styles.stepTitle}>Tell us about your business</h2>
            <p style={styles.stepSub}>
              This information powers your public job pages and portfolio — it&rsquo;s how new customers find and contact you.
            </p>

            <div style={styles.form}>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-name">
                  Business name <span style={styles.required}>*</span>
                </label>
                <input
                  id="ob-name"
                  type="text"
                  style={styles.input}
                  placeholder="Your business name"
                  value={bizName}
                  onChange={e => setBizName(e.target.value)}
                  autoFocus
                />
                <span style={styles.hint}>Appears on every published job page and your portfolio.</span>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-phone">Business phone</label>
                <input
                  id="ob-phone"
                  type="tel"
                  style={styles.input}
                  placeholder="(256) 555-0190"
                  value={bizPhone}
                  onChange={e => setBizPhone(formatPhone(e.target.value))}
                />
                <span style={styles.hint}>
                  Customers who find you on Google will call this number directly from your job pages.
                </span>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-web">Business website</label>
                <input
                  id="ob-web"
                  type="text"
                  style={styles.input}
                  placeholder="www.yourbusiness.com"
                  value={bizWebsite}
                  onChange={e => setBizWebsite(e.target.value)}
                />
                <span style={styles.hint}>
                  We link directly to your site from every published job — free traffic to your own website.
                </span>
              </div>

              <div style={styles.field}>
                <label style={styles.label} htmlFor="ob-trade">What type of work do you do?</label>
                <select
                  id="ob-trade"
                  style={styles.select}
                  value={trade}
                  onChange={e => setTrade(e.target.value)}
                >
                  <option value="">Select your trade</option>
                  {TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <span style={styles.hint}>
                  Helps us generate accurate SEO copy for your job pages so the right customers find you.
                </span>
              </div>

              {/* Asked once, at signup. A replay keeps the original answer and
                  posts it back untouched rather than asking again. */}
              {!replay && (
                <div style={styles.field}>
                  <label style={styles.label} htmlFor="ob-heard">How did you hear about us?</label>
                  <select
                    id="ob-heard"
                    style={styles.select}
                    value={heardAbout}
                    onChange={e => setHeardAbout(e.target.value)}
                  >
                    <option value="">Select one</option>
                    {HEARD_ABOUT.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  {heardAbout === 'Other' && (
                    <input
                      type="text"
                      style={{ ...styles.input, marginTop: '8px' }}
                      placeholder="Tell us more…"
                      value={heardOther}
                      onChange={e => setHeardOther(e.target.value)}
                    />
                  )}
                </div>
              )}

              {error && <div style={styles.errorBox}>{error}</div>}

              {/* Held until the prefill lands, so a replay can never save a
                  form that merely has not been filled in yet. */}
              <button
                style={{ ...styles.btnPrimary, ...(submitting || !prefillLoaded ? styles.btnDisabled : {}) }}
                onClick={handleStep2Submit}
                disabled={submitting || !prefillLoaded}
              >
                {submitting ? (
                  <>
                    <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24"
                      fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                      <path d="M12 2a10 10 0 0110 10"/>
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    Save and continue
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>

              {/* Replay only. Advancing without calling the save endpoint is
                  the one path that cannot alter anything, so someone reading
                  back through the walkthrough never risks their own record. */}
              {replay && (
                <button
                  type="button"
                  style={styles.btnSkip}
                  disabled={submitting}
                  onClick={() => { setError(null); isTitan ? setShowAiResearch(true) : setStep(3) }}
                >
                  Skip — no changes
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: Get your Google review link (guide) ── */}
        {chapter === 1 && !showAiResearch && step === 3 && (
          <div style={styles.body}>
            <h2 style={styles.stepTitle}>Get your Google review link</h2>

            {/* 1 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>1</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>
                  Open your Google Business Profile{' '}
                  <a
                    href="https://business.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0EA5E9', textDecoration: 'underline' }}
                  >
                    HERE
                  </a>.
                </div>
              </div>
            </div>

            {/* 2 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>2</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Log in and click &ldquo;Ask for reviews&rdquo;</div>
                <div style={{ ...styles.guideDesc, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const, marginBottom: 0 }}>
                  Look for this button on your dashboard:
                  <img
                    src="/images/onboarding/gbp-ask-reviews-icon.png"
                    alt="Ask for reviews button"
                    style={{ height: 46, borderRadius: 6, border: '1px solid #BAE6FD', flexShrink: 0 }}
                  />
                </div>
              </div>
            </div>

            {/* 3 */}
            <div style={{ ...styles.guideStep, marginBottom: 14 }}>
              <div style={styles.guideNum}>3</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Copy your review link</div>
                <div style={styles.guideDesc}>A panel opens with your unique review link. Copy the highlighted link:</div>
                <img
                  src="/images/onboarding/gbp-review-link-screenshot.png"
                  alt="Copy your review link"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid #BAE6FD', display: 'block' }}
                />
              </div>
            </div>

            {/* 4 */}
            <div style={{ ...styles.guideStep, marginBottom: 24 }}>
              <div style={styles.guideNum}>4</div>
              <div style={styles.guideText}>
                <div style={styles.guideLabel}>Come back here and paste it</div>
                <div style={styles.guideDesc}>Hit the button below when you&rsquo;ve copied your link.</div>
              </div>
            </div>

            <button style={styles.btnPrimary} onClick={() => setStep(4)}>
              I&rsquo;ve copied my link — paste it now
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button onClick={() => setStep(4)} style={styles.btnSkip}>{skipLabel}</button>
          </div>
        )}

        {/* ── STEP 4: Paste your review link ── */}
        {chapter === 1 && !showAiResearch && step === 4 && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>Paste your review link</h2>
            <p style={styles.stepSub}>
              We&rsquo;ll connect the customers you choose to your Google review page with this link.
            </p>

            <div style={styles.field}>
              <label style={styles.label} htmlFor="ob-gbp-link">Your Google review link</label>
              <input
                id="ob-gbp-link"
                type="url"
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13 }}
                placeholder="https://g.page/r/..."
                value={gbpReviewLink}
                onChange={e => { setGbpReviewLink(e.target.value); setGbpLinkError(null) }}
                autoFocus
              />
              <span style={styles.hint}>
                Starts with <code>https://g.page/r/</code> or <code>https://search.google.com/local/writereview</code>
              </span>
            </div>

            {gbpLinkError && <div style={{ ...styles.errorBox, marginBottom: 16 }}>{gbpLinkError}</div>}

            <button
              style={{ ...styles.btnPrimary, ...(gbpLinkSaving ? styles.btnDisabled : {}) }}
              onClick={handleGbpLinkSave}
              disabled={gbpLinkSaving}
            >
              {gbpLinkSaving ? (
                <>
                  <svg style={styles.spinner} width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0110 10"/>
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  Save and continue
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
            <button onClick={afterReviewLink} style={styles.btnSkip}>{skipLabel}</button>
          </div>
        )}

        {/* ── FINAL STEP: First steps / You're all set (step 5 of 5, or step 6 of 6 for Titan widget users) ── */}
        {/* ── Connect Google Business Profile (Elite + Titan) ──
            The same content and states as the card on Account -> Connections,
            in this modal's palette. Guide links open in a new tab so the
            onboarding run is never abandoned to read them. */}
        {chapter === 1 && !showAiResearch && step === GBP_CONNECT_STEP && hasGbpConnectStep && (() => {
          const googleBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 8, background: '#fff', color: '#3c4043', border: '1px solid #dadce0', boxShadow: '0 1px 2px rgba(0,0,0,.08)', fontSize: 13, fontWeight: 600, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: gbpBusy ? 'wait' : 'pointer' }
          const quietBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: 8, background: '#F0F9FF', color: '#0284C7', border: '1px solid #BAE6FD', fontSize: 12, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', textDecoration: 'none' }
          const amberBox: React.CSSProperties = { background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 8, padding: '10px 13px', marginBottom: 14, fontSize: 12, color: '#92400E', lineHeight: 1.55 }
          const permissionNote = (
            <div style={{ marginTop: 12, fontSize: 12, color: '#4B7A94', lineHeight: 1.6 }}>
              Google will ask you to allow one permission: <strong style={{ color: '#0C4A6E' }}>&ldquo;{GBP_PERMISSION_LABEL}.&rdquo;</strong> Allow it so ProjectCheckin can post your finished jobs to your listing. If you have already connected Search Console, Google will also list &ldquo;{GSC_PERMISSION_LABEL},&rdquo; which comes from that connection.
            </div>
          )
          return (
            <div style={styles.body}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 11, background: '#F8FAFC', border: '1px solid #E2E8F0', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <GoogleGIcon />
                </div>
                <div>
                  <h2 style={{ ...styles.stepTitle, marginBottom: 2 }}>Connect Your Google Business Profile</h2>
                  <div style={{ fontSize: 13, color: '#4B7A94' }}>Publish job updates to your Google listing</div>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#4B7A94', lineHeight: 1.6 }}>
                Businesses with photos on their Google listing get <strong style={{ color: '#0C4A6E' }}>42% more direction requests</strong> and <strong style={{ color: '#0C4A6E' }}>35% more website clicks</strong> than listings with none. — Google
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
                {[
                  'Post a finished job to Google in one click, photo and all',
                  'Fill your Google listing with your own recent work',
                  'Give Google real, specific job detail to describe your business with',
                ].map((txt) => (
                  <div key={txt} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#4B7A94', lineHeight: 1.5 }}>
                    <div style={{ width: 20, height: 20, background: '#E0F2FE', color: '#0284C7', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    {txt}
                  </div>
                ))}
              </div>

              {gbpError && <div style={{ ...styles.errorBox, marginBottom: 14 }}>{gbpError}</div>}

              {gbpStatus === 'no_locations' ? (
                <>
                  <div style={amberBox}>
                    The Google account you signed in with doesn&apos;t manage a Google Business Profile. The most common reason is signing in with a personal Gmail instead of the account your business listing is on.
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={handleGbpConnect} disabled={gbpBusy} style={googleBtn}>
                      <GoogleWordmark />
                      Try a different Google account
                    </button>
                    <button onClick={handleGbpCheckAgain} disabled={gbpBusy} style={quietBtn}>
                      {gbpBusy ? 'Checking…' : 'Check again'}
                    </button>
                    <a href="/help/guides/gbp-connect" target="_blank" rel="noopener noreferrer" style={quietBtn}>
                      Read the setup guide
                    </a>
                  </div>
                </>
              ) : gbpStatus === 'select_location' ? (
                <>
                  <div style={{ fontSize: 13, color: '#4B7A94', lineHeight: 1.6, marginBottom: 12 }}>
                    Your Google account manages more than one business. Pick the one your jobs should be posted to.
                  </div>
                  <label htmlFor="onb-gbp-location" style={styles.label}>Business location</label>
                  <select
                    id="onb-gbp-location"
                    value={gbpChoice}
                    onChange={(e) => setGbpChoice(e.target.value)}
                    style={{ ...styles.input, marginBottom: 14 }}
                  >
                    {gbpLocations.map((l) => (
                      <option key={l.name} value={l.name}>{l.title}</option>
                    ))}
                  </select>
                  <div>
                    <button onClick={handleGbpSelectLocation} disabled={gbpBusy || !gbpChoice} style={quietBtn}>
                      {gbpBusy ? 'Saving…' : 'Save selection'}
                    </button>
                  </div>
                </>
              ) : gbpStatus === 'needs_reconnect' || (gbpStatus === 'connected' && !gbpHasCred) ? (
                <>
                  <div style={amberBox}>
                    Google is no longer accepting our connection to your Business Profile, so your jobs have stopped posting. This usually means access was removed from your Google account. Reconnecting takes a few seconds and nothing already posted to Google is affected.
                  </div>
                  <button onClick={handleGbpConnect} disabled={gbpBusy} style={googleBtn}>
                    <GoogleWordmark />
                    {gbpBusy ? 'Opening Google…' : 'Reconnect Google Business Profile'}
                  </button>
                  {permissionNote}
                </>
              ) : !gbpConnected ? (
                <>
                  <button onClick={handleGbpConnect} disabled={gbpBusy} style={googleBtn}>
                    <GoogleWordmark />
                    {gbpBusy ? 'Opening Google…' : 'Connect Google Business Profile'}
                  </button>
                  {permissionNote}
                  <div style={{ marginTop: 12 }}>
                    <a href="/help/guides/gbp-connect" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#0284C7', textDecoration: 'none', fontWeight: 600 }}>
                      Not sure which Google account to use? Read the guide →
                    </a>
                  </div>
                </>
              ) : (
                <div style={{ border: '1px solid #E0F2FE', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #E0F2FE' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: '#ECFDF5', color: '#059669', marginBottom: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669' }} />
                      Connected
                    </span>
                    <div style={{ fontSize: 12.5, color: '#4B7A94' }}>{gbpLocationName || 'Your Google business listing'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0C4A6E' }}>Post jobs automatically</span>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.5 }}>
                        {gbpAutoPost
                          ? 'On — every job you publish goes straight to your Google listing. You can still post older jobs by hand any time.'
                          : 'Off — nothing posts on its own. Use the Post to Google button on a job whenever you want it on your listing.'}
                      </div>
                    </div>
                    <div
                      role="switch"
                      aria-checked={gbpAutoPost}
                      aria-label="Post jobs automatically"
                      tabIndex={0}
                      onClick={handleGbpAutoPostToggle}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); handleGbpAutoPostToggle() } }}
                      style={{ position: 'relative', width: 36, height: 20, flexShrink: 0, background: gbpAutoPost ? '#0EA5E9' : '#CBD5E1', borderRadius: 10, cursor: 'pointer', transition: 'background .2s' }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: gbpAutoPost ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Footer: skip left, continue right — the same layout as the
                  website-integration step that follows. */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #E0F2FE' }}>
                {gbpConnected ? (
                  <button onClick={() => setStep(4)} style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'auto', padding: 0 }}>
                    Back
                  </button>
                ) : (
                  <button onClick={afterGbpConnect} style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'flex-start', textAlign: 'left' as const, padding: 0 }}>
                    Skip — set up later in Account → Connections
                  </button>
                )}
                <button
                  style={{ ...styles.btnPrimary, width: 'auto', height: 44, padding: '0 20px', marginTop: 0, flexShrink: 0 }}
                  onClick={afterGbpConnect}
                >
                  Continue
                </button>
              </div>
            </div>
          )
        })()}

        {/* ── END OF CHAPTER 1: Account setup is complete ──
            Approved mockup: docs/mockups/onboarding-setup-complete-mockup.html.
            Bridges Account Setup into the walkthrough, and tells the customer
            where the walkthrough lives so leaving it never feels final. */}
        {setupDone && !showAiResearch && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#F0FDF4', borderColor: '#A7F3D0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>Your account setup is complete</h2>
            <p style={styles.stepSub}>
              Your business details are saved. Next, we will walk through how to use ProjectCheckin, starting with how to add your team members.
            </p>

            <div style={{ display: 'flex', gap: 11, alignItems: 'flex-start', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: '13px 14px', marginBottom: 22, fontSize: 13, color: '#4B7A94', lineHeight: 1.6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              <span>
                You can return to this tutorial at any time. Open <strong style={{ color: '#0C4A6E', fontWeight: 700 }}>Support Center</strong> in the left sidebar, then click <strong style={{ color: '#0C4A6E', fontWeight: 700 }}>Interactive Tutorial</strong>.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 14, borderTop: '1px solid #E0F2FE' }}>
              <button onClick={() => setStep(lastSetupStep)} style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'auto', padding: 0 }}>
                Back
              </button>
              <button
                style={{ ...styles.btnPrimary, width: 'auto', height: 44, padding: '0 20px', marginTop: 0, flexShrink: 0 }}
                onClick={() => goToChapter(2)}
              >
                Continue
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* ── CHAPTERS 2-7 ──
            Each chapter's steps are specified separately and are not written
            yet. Until they land, the chapter announces itself and hands off:
            'coach' chapters will open the coach-mark overlay on the real page,
            'modal' chapters will render their steps here. */}
        {chapter > 1 && chapter !== FINISH_CHAPTER && (() => {
          const current = CHAPTERS.find(c => c.id === chapter)
          if (!current) return null
          const ready = current.kind === 'coach' && hasCoachSteps(chapter)
          return (
            <div style={styles.body}>
              <h2 style={styles.stepTitle}>{current.name}</h2>
              <p style={styles.stepSub}>{current.intro}</p>

              {!ready && (
                <div style={{ border: '1px dashed #BAE6FD', background: '#F0F9FF', borderRadius: 10, padding: '18px 16px', textAlign: 'center' as const, fontSize: 12.5, color: '#4B7A94', lineHeight: 1.6 }}>
                  Steps for this chapter are not written yet.
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #E0F2FE' }}>
                <button
                  onClick={() => {
                    goToChapter(chapter - 1)
                    // Back from Team lands on the setup-complete screen, the
                    // last thing the customer saw, not the start of Account Setup.
                    if (chapter === 2) setStep(SETUP_DONE_STEP)
                  }}
                  style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'auto', padding: 0 }}
                >
                  Back
                </button>
                <button
                  style={{ ...styles.btnPrimary, width: 'auto', height: 44, padding: '0 20px', marginTop: 0, flexShrink: 0 }}
                  onClick={async () => {
                    if (!ready) { nextChapter(); return }
                    // The tour's pages are only reachable once the completion
                    // flag has reached the session token.
                    await markAccountSetupDone()
                    // The overlay owns the screen from here, so the modal has
                    // to get out of the way before it opens. The tour is told
                    // where to hand back to when it finishes, so both the
                    // first run and the tutorial replay carry on to the next
                    // chapter.
                    onExit?.()
                    startCoachMarks(chapter, { chapter: chapterAfter(chapter), mode: replay ? 'tutorial' : 'onboarding' })
                  }}
                >
                  {ready ? 'Show me' : chapter >= CHAPTERS.length ? 'Finish' : 'Continue'}
                </button>
              </div>

              <button onClick={handleSaveAndExit} style={{ ...styles.btnSkip, alignSelf: 'center' }}>
                Save &amp; exit
              </button>
            </div>
          )
        })()}

        {chapter === FINISH_CHAPTER && (
          <div style={styles.body}>
            <div style={{ ...styles.welcomeIcon, background: '#F0FDF4', borderColor: '#A7F3D0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 style={styles.stepTitle}>You&rsquo;re all set!</h2>
            <p style={styles.stepSub}>
              Your business profile is live. Here are three great ways to get started:
            </p>

            <div style={styles.actionCards}>
              <a href="/check-in" style={styles.actionCard}>
                <div style={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#0EA5E9" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                <div>
                  <div style={styles.actionTitle}>Submit your first check-in</div>
                  <div style={styles.actionDesc}>Complete a job and publish your first Google-indexed page.</div>
                </div>
              </a>

              <a href="/dashboard?tab=team" style={styles.actionCard}>
                <div style={styles.actionIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#0EA5E9" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div>
                  <div style={styles.actionTitle}>Invite your crew</div>
                  <div style={styles.actionDesc}>Add team members so they can check in from the field.</div>
                </div>
              </a>

              {savedSlug && (
                <a href={`/portfolio/${savedSlug}`} target="_blank" rel="noreferrer" style={styles.actionCard}>
                  <div style={styles.actionIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="#0EA5E9" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </div>
                  <div>
                    <div style={styles.actionTitle}>View your portfolio page</div>
                    <div style={styles.actionDesc}>Your shareable link is live — send it to customers.</div>
                  </div>
                </a>
              )}
            </div>

            <button style={styles.btnPrimary} onClick={handleFinish}>
              Go to my dashboard
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        )}

        {/* ── STEP 5: Website Integration for Local SEO (Titan only, optional) ── */}
        {chapter === 1 && !showAiResearch && step === 5 && hasWidgetStep && (
          <div style={styles.body}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' as const, color: '#F97316', marginBottom: 5 }}>
              Optional
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <h2 style={{ ...styles.stepTitle, marginBottom: 0 }}>Website Integration for Local SEO</h2>
              <button
                onClick={() => setWShowInfo(!wShowInfo)}
                aria-label="What is this?"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: wShowInfo ? '#0EA5E9' : '#94A3B8', padding: 0, display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </button>
            </div>
            {wShowInfo && (
              <div style={{ background: '#0F172A', color: '#E8F0F8', borderRadius: 10, padding: '13px 34px 13px 15px', fontSize: 12.5, lineHeight: 1.65, position: 'relative' as const, marginBottom: 12 }}>
                <button onClick={() => setWShowInfo(false)} style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,.4)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 3px' }}>×</button>
                Deliver geo-content and authority to your own domain. Publish jobs to build local SEO, so customers find you faster. Link your Google Business Profile posts from ProjectCheckin to your own website.
              </div>
            )}
            <div style={{ height: 8 }} />

            <div style={{ fontSize: 12, color: '#4B7A94', lineHeight: 1.6, marginBottom: 5 }}>
              Three ways to put your published jobs on your own site. You only need <strong style={{ color: '#0C4A6E', fontWeight: 700 }}>one</strong> — pick whichever your website supports, and you can switch whenever you like.
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 12 }}>Listed weakest to strongest for SEO: Good, Better, Best.</div>

            {/* 1 · Widget — the only option that can be finished without leaving onboarding */}
            <OnbIntegrationCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}
              iconBg="#ECFDF5"
              title="1. Widget - Add a Jobs Gallery to Any Website"
              tier="Good"
              sub="Paste one snippet — your published jobs appear automatically in a gallery on your site. Works anywhere."
              open={!!wOpenCards['widget']}
              onToggle={() => setWOpenCards(prev => ({ ...prev, widget: !prev.widget }))}
            >
              {/* Section 1: portfolio URL */}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0C4A6E', marginBottom: 6 }}>Paste your portfolio page URL here</div>
              <button
                onClick={() => setWShowUrlInstr(!wShowUrlInstr)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: '#0EA5E9', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", alignSelf: 'flex-start' }}
              >
                Instructions
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: wShowUrlInstr ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {wShowUrlInstr && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10 }}>
                  Create a page on your website (e.g. yourwebsite.com/our-work) and paste its URL here. This is where your new portfolio of work will show up on your website and will automatically start generating local SEO for your page. You can always opt out at any time if you&rsquo;d like, and remove the page.
                </div>
              )}
              <input
                type="url"
                style={{ ...styles.input, fontFamily: 'monospace', fontSize: 13, marginBottom: 14 }}
                placeholder="https://yourwebsite.com/our-work"
                value={wUrl}
                onChange={e => { setWUrl(e.target.value); setWError(null) }}
              />

              {/* Section 2: embed code */}
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0C4A6E', marginBottom: 6 }}>Add the widget to your website</div>
              <button
                onClick={() => setWShowEmbedInstr(!wShowEmbedInstr)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, fontWeight: 600, color: '#0EA5E9', cursor: 'pointer', background: 'none', border: 'none', padding: 0, marginBottom: 8, fontFamily: "'Plus Jakarta Sans', sans-serif", alignSelf: 'flex-start' }}
              >
                Instructions
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform .2s', transform: wShowEmbedInstr ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {wShowEmbedInstr && (
                <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10 }}>
                  After you create a new page on your website (e.g., yourwebsite.com/our-work), select the website builder by clicking one of the options below. Then, paste the code below into that new page you created. Your published jobs will appear automatically — no updates needed.
                </div>
              )}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' as const }}>
                {Object.keys(WIDGET_PLATFORM_INSTRUCTIONS).map((p) => (
                  <button
                    key={p}
                    onClick={() => setWPlatform(p)}
                    style={{ padding: '5px 12px', borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", border: wPlatform === p ? '1px solid rgba(14,165,233,.4)' : '1.5px solid #BAE6FD', color: wPlatform === p ? '#0284C7' : '#4B7A94', background: wPlatform === p ? '#F0F9FF' : '#fff' }}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '11px 13px', fontSize: 12, color: '#0C4A6E', lineHeight: 1.65, marginBottom: 10, whiteSpace: 'pre-line' as const }}>
                {WIDGET_PLATFORM_INSTRUCTIONS[wPlatform]}
              </div>
              <div style={{ background: '#0F172A', color: '#7DD3FC', borderRadius: 8, padding: '12px 14px', fontFamily: "'Courier New', monospace", fontSize: 11, lineHeight: 1.6, marginBottom: 10, overflowX: 'auto' as const, whiteSpace: 'pre' as const }}>
                <span style={{ color: '#86EFAC' }}>&lt;div</span> <span style={{ color: '#FCA5A5' }}>id</span>=<span style={{ color: '#FDE68A' }}>&quot;pc-widget&quot;</span> <span style={{ color: '#FCA5A5' }}>data-org</span>=<span style={{ color: '#FDE68A' }}>&quot;{widgetSlug}&quot;</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/div&gt;</span>{'\n'}
                <span style={{ color: '#86EFAC' }}>&lt;script</span> <span style={{ color: '#FCA5A5' }}>src</span>=<span style={{ color: '#FDE68A' }}>&quot;{widgetBaseUrl}/widget.v1.js&quot;</span> <span style={{ color: '#FCA5A5' }}>defer</span><span style={{ color: '#86EFAC' }}>&gt;&lt;/script&gt;</span>
              </div>
              <button
                onClick={handleWidgetCopy}
                style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: 'pointer', background: '#F0F9FF', color: wCopied ? '#059669' : '#4B7A94', border: '1px solid #BAE6FD' }}
              >
                {wCopied ? 'Copied!' : 'Copy code'}
              </button>
            </OnbIntegrationCard>

            {/* 2 · CNAME */}
            <OnbIntegrationCard
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>}
              iconBg="#F5F3FF"
              title="2. CNAME - Host a Branded Page on Your Domain"
              tier="Better"
              sub="Add one CNAME record and we serve your jobs on your own domain, with no code to paste and no plugin to install."
              open={!!wOpenCards['cname']}
              onToggle={() => setWOpenCards(prev => ({ ...prev, cname: !prev.cname }))}
            >
              <p style={{ fontSize: 12.5, color: '#4B7A94', lineHeight: 1.65, margin: '0 0 12px' }}>
                This gives your job pages their own address on your domain — like <span style={{ fontFamily: 'monospace', color: '#0C4A6E' }}>our-work.{cnameApex}</span> — with no code to paste and no plugin to install. Just one setting at your domain provider.
              </p>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0C4A6E', textTransform: 'uppercase' as const, letterSpacing: '.04em', marginBottom: 9 }}>What&rsquo;s involved</div>
              {[
                'Log in to whoever you bought your domain from (GoDaddy, Namecheap, Cloudflare, etc.) — not your website builder.',
                'Find DNS Settings or Manage DNS for your domain.',
                'Add the one record we give you, using the exact Type, Host, and Value shown, and save.',
              ].map((txt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#4B7A94', lineHeight: 1.55, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F0F9FF', color: '#0284C7', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div>{txt}</div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid #E0F2FE' }}>
                Don&rsquo;t see DNS settings at all? Some website builder plans don&rsquo;t allow this — if that&rsquo;s you, use the widget above instead. No action needed on your end.
              </div>
              <OnbSetupLink card="cname">Set this up in Account &rarr; Connections</OnbSetupLink>
            </OnbIntegrationCard>

            {/* 3 · WordPress */}
            <OnbIntegrationCard
              icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="#21759B" stroke="none"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 1.4a8.6 8.6 0 0 1 4.86 1.49h-.1a1.2 1.2 0 0 0-1.16 1.23c0 .57.33 1.05.68 1.62.27.45.58 1.03.58 1.87 0 .58-.22 1.26-.52 2.2l-.68 2.26-2.45-7.3c.41-.02.78-.06.78-.06.36-.05.32-.58-.05-.56 0 0-1.1.09-1.82.09-.67 0-1.8-.09-1.8-.09-.36-.02-.4.54-.05.56 0 0 .35.04.72.06l1.06 2.9-1.49 4.46-2.48-7.36c.41-.02.78-.06.78-.06.36-.05.32-.58-.05-.56 0 0-1.1.09-1.82.09-.13 0-.28 0-.44-.01A8.6 8.6 0 0 1 12 3.4zM4.3 8.9l3.77 10.32A8.6 8.6 0 0 1 4.3 8.9zm8.2 3.62l2.28 6.24a.7.7 0 0 0 .06.1 8.6 8.6 0 0 1-5.1.06l1.9-5.5.86-.9zm5.9-2.05a8.6 8.6 0 0 1-2.42 8.5l2.35-6.8c.3-.9.44-1.62.44-2.27 0-.24-.02-.46-.05-.68.28.52.44 1.13.44 1.79z"/></svg>}
              iconBg="#EFF6FF"
              title="3. WordPress Integration - Publish Into Your WordPress Site"
              tier="Best"
              sub="Real posts in your own theme — the deepest local-SEO integration we offer."
              open={!!wOpenCards['wordpress']}
              onToggle={() => setWOpenCards(prev => ({ ...prev, wordpress: !prev.wordpress }))}
            >
              <p style={{ fontSize: 12.5, color: '#4B7A94', lineHeight: 1.65, margin: '0 0 12px' }}>
                Connect your WordPress site and every job you publish from now on becomes a real post on your own site — in your own theme, at your own address. Nothing to install.
              </p>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0C4A6E', textTransform: 'uppercase' as const, letterSpacing: '.04em', marginBottom: 9 }}>What you&rsquo;ll need</div>
              {[
                'Your WordPress site address and username.',
                'An Application Password. In your WordPress admin, go to Users → Profile, scroll to Application Passwords, and add one named "ProjectCheckin".',
                'Copy that password once it appears — WordPress only shows it a single time.',
              ].map((txt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#4B7A94', lineHeight: 1.55, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#F0F9FF', color: '#0284C7', fontSize: 10, fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <div>{txt}</div>
                </div>
              ))}
              <div style={{ fontSize: 11.5, color: '#94A3B8', lineHeight: 1.5, marginTop: 10, paddingTop: 10, borderTop: '1px solid #E0F2FE' }}>
                Only works on sites running WordPress. On Wix, Squarespace, or Webflow, use the widget above instead.
              </div>
              <OnbSetupLink card="wordpress">Set this up in Account &rarr; Connections</OnbSetupLink>
            </OnbIntegrationCard>

            {wError && <div style={{ ...styles.errorBox, marginTop: 14 }}>{wError}</div>}

            {/* Footer: skip left, save & finish right */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, paddingTop: 14, borderTop: '1px solid #E0F2FE' }}>
              <div>
                <button onClick={finishAccountSetup} style={{ ...styles.btnSkip, marginTop: 0, alignSelf: 'flex-start', textAlign: 'left' as const, padding: 0 }}>
                  Skip — set up later in Account → Connections
                </button>
                <div style={{ fontSize: 11.5, color: '#4B7A94', lineHeight: 1.5, marginTop: 6 }}>
                  No website yet? Your GBP posts are still building your Google presence.
                </div>
              </div>
              <button
                style={{ ...styles.btnPrimary, width: 'auto', height: 44, padding: '0 20px', marginTop: 0, flexShrink: 0, ...(wSaving ? styles.btnDisabled : {}) }}
                onClick={handleWidgetFinish}
                disabled={wSaving}
              >
                {wSaving ? 'Saving…' : 'Continue'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
    </>
    )}
    </>
  )
}

// ── Inline styles ──
const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position:        'fixed',
    inset:           0,
    background:      'rgba(12, 74, 110, 0.55)',
    backdropFilter:  'blur(4px)',
    zIndex:          9999,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '16px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
  },
  modal: {
    background:      '#fff',
    borderRadius:    '20px',
    width:           '100%',
    maxWidth:        '520px',
    maxHeight:       '90vh',
    overflowY:       'auto',
    boxShadow:       '0 24px 80px rgba(12,74,110,0.25)',
    padding:         '36px 32px 32px',
    position:        'relative',
  },
  dots: {
    display:         'flex',
    justifyContent:  'center',
    gap:             '8px',
    marginBottom:    '28px',
  },
  dot: {
    width:           '8px',
    height:          '8px',
    borderRadius:    '50%',
    background:      '#BAE6FD',
    transition:      'all 0.2s',
  },
  dotActive: {
    background:      '#0EA5E9',
    width:           '24px',
    borderRadius:    '4px',
  },
  dotDone: {
    background:      '#059669',
  },
  body: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '0',
  },
  welcomeIcon: {
    width:           '56px',
    height:          '56px',
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '14px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    '16px',
  },
  stepTitle: {
    fontSize:        '22px',
    fontWeight:      800,
    color:           '#0C4A6E',
    letterSpacing:   '-0.025em',
    marginBottom:    '8px',
    lineHeight:      1.2,
  },
  stepSub: {
    fontSize:        '14px',
    color:           '#4B7A94',
    lineHeight:      1.6,
    marginBottom:    '20px',
  },
  featureList: {
    listStyle:       'none',
    padding:         0,
    margin:          '0 0 20px',
    display:         'flex',
    flexDirection:   'column',
    gap:             '10px',
  },
  featureItem: {
    display:         'flex',
    alignItems:      'flex-start',
    gap:             '10px',
    fontSize:        '14px',
    color:           '#0C4A6E',
    lineHeight:      1.5,
  },
  stepNote: {
    fontSize:        '13px',
    color:           '#4B7A94',
    lineHeight:      1.55,
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '10px',
    padding:         '12px 14px',
    marginBottom:    '24px',
  },
  btnPrimary: {
    width:           '100%',
    height:          '50px',
    background:      '#F97316',
    color:           '#fff',
    border:          'none',
    borderRadius:    '10px',
    fontSize:        '15px',
    fontWeight:      700,
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             '8px',
    boxShadow:       '0 2px 12px rgba(249,115,22,0.3)',
    letterSpacing:   '-0.01em',
    marginTop:       '4px',
  },
  btnDisabled: {
    opacity:         0.65,
    cursor:          'not-allowed',
  },
  btnSkip: {
    background:      'none',
    border:          'none',
    color:           '#4B7A94',
    fontSize:        '13px',
    fontWeight:      600,
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    cursor:          'pointer',
    marginTop:       '10px',
    alignSelf:       'center',
  },
  form: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '18px',
  },
  field: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '5px',
    marginBottom:    '2px',
  },
  label: {
    fontSize:        '13px',
    fontWeight:      600,
    color:           '#0C4A6E',
  },
  required: {
    color:           '#DC2626',
    marginLeft:      '2px',
  },
  input: {
    width:           '100%',
    height:          '44px',
    padding:         '0 14px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    fontSize:        '14px',
    color:           '#0C4A6E',
    background:      '#fff',
    border:          '1.5px solid #BAE6FD',
    borderRadius:    '10px',
    outline:         'none',
    boxSizing:       'border-box',
  },
  select: {
    width:           '100%',
    height:          '44px',
    padding:         '0 14px',
    fontFamily:      "'Plus Jakarta Sans', sans-serif",
    fontSize:        '14px',
    color:           '#0C4A6E',
    background:      '#fff',
    border:          '1.5px solid #BAE6FD',
    borderRadius:    '10px',
    outline:         'none',
    cursor:          'pointer',
    boxSizing:       'border-box',
  },
  hint: {
    fontSize:        '11.5px',
    color:           '#4B7A94',
    lineHeight:      1.5,
  },
  errorBox: {
    background:      '#FEF2F2',
    border:          '1px solid #FECACA',
    borderRadius:    '8px',
    padding:         '10px 14px',
    fontSize:        '13px',
    color:           '#DC2626',
  },
  guideStep: {
    display:         'flex',
    gap:             '12px',
    alignItems:      'flex-start',
  },
  guideNum: {
    width:           '24px',
    height:          '24px',
    minWidth:        '24px',
    background:      '#0EA5E9',
    color:           '#fff',
    borderRadius:    '50%',
    fontSize:        '12px',
    fontWeight:      700,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    marginTop:       '1px',
  },
  guideText: {
    flex:            1,
  },
  guideLabel: {
    fontSize:        '13.5px',
    fontWeight:      700,
    color:           '#0C4A6E',
    marginBottom:    '4px',
    lineHeight:      1.4,
  },
  guideDesc: {
    fontSize:        '12.5px',
    color:           '#4B7A94',
    lineHeight:      1.5,
    marginBottom:    '8px',
  },
  actionCards: {
    display:         'flex',
    flexDirection:   'column',
    gap:             '10px',
    marginBottom:    '24px',
  },
  actionCard: {
    display:         'flex',
    alignItems:      'flex-start',
    gap:             '14px',
    padding:         '14px 16px',
    background:      '#F0F9FF',
    border:          '1px solid #BAE6FD',
    borderRadius:    '12px',
    textDecoration:  'none',
    transition:      'border-color 0.15s, background 0.15s',
    cursor:          'pointer',
  },
  actionIcon: {
    width:           '40px',
    height:          '40px',
    background:      '#fff',
    border:          '1px solid #BAE6FD',
    borderRadius:    '10px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  actionTitle: {
    fontSize:        '14px',
    fontWeight:      700,
    color:           '#0C4A6E',
    marginBottom:    '3px',
  },
  actionDesc: {
    fontSize:        '12.5px',
    color:           '#4B7A94',
    lineHeight:      1.4,
  },
  spinner: {
    animation:       'spin 0.8s linear infinite',
  },
}
