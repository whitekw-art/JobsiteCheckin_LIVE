'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { COACH_STEPS, type CoachStep } from '@/lib/coachMarks'
import { ONBOARDING_CHAPTER_KEY } from '@/lib/onboardingProgress'
import { useSession } from 'next-auth/react'
import { lowestTierWithFeature, tierHasFeature, tierLabel } from '@/lib/planVersions'

/**
 * The running tour lives in sessionStorage, not localStorage, because a tour
 * belongs to one tab. It has to survive navigation inside that tab, which
 * sessionStorage does, but it must NOT be inherited by a new tab: the step
 * cards link out to help guides with target="_blank", and a new tab that read
 * the tour would immediately navigate itself back to the step's page, so the
 * guide appeared to reopen the page it was linked from.
 */
const SESSION_KEY = 'pc_coach_session'
const EVENT = 'pc-coach-change'

// `resume` is set when the tour was started from a chapter of the walkthrough
// (first-run onboarding or the Interactive Tutorial replay): finishing the
// tour then hands back to the walkthrough at the next chapter instead of
// simply closing.
type ResumeTarget = { chapter: number; mode: 'onboarding' | 'tutorial' }
interface Session { chapter: number; index: number; resume?: ResumeTarget }

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    return typeof s?.chapter === 'number' && typeof s?.index === 'number' ? s : null
  } catch {
    return null
  }
}

function writeSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* private mode — the tour simply won't survive a navigation */
  }
  window.dispatchEvent(new Event(EVENT))
}

/**
 * Begins a coach-mark chapter. Safe to call from any page. Pass `resume`
 * when the walkthrough should carry on at that chapter once the tour's last
 * step is done.
 */
export function startCoachMarks(chapter: number, resume?: ResumeTarget) {
  writeSession({ chapter, index: 0, resume })
}

export function stopCoachMarks() {
  writeSession(null)
}

/** Whether a tour is running in this tab (it survives a page refresh). */
export function isCoachTourActive(): boolean {
  return readSession() !== null
}

type Rect = { top: number; left: number; width: number; height: number }

/**
 * Lite coach marks: overlays the real page, dims everything except one
 * element, and explains it. Next/Back drives the tour — it deliberately does
 * NOT wait for the customer to perform the action. Detecting real interaction
 * is where tour code goes to die: every branch of "they clicked something
 * else" has to be handled, and the payoff over simply explaining the control
 * is small.
 *
 * Mounted once inside DashboardShell so a tour survives moving between pages,
 * with its position in localStorage rather than React state for the same
 * reason.
 */
export default function CoachMarks() {
  const { data: authSession } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<Session | null>(null)
  const [rect, setRect] = useState<Rect | null>(null)
  const [missing, setMissing] = useState(false)
  const [cardSize, setCardSize] = useState<{ height: number }>({ height: 0 })
  const cardRef = useRef<HTMLDivElement | null>(null)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    const sync = () => setSession(readSession())
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const steps: CoachStep[] = session ? (COACH_STEPS[session.chapter] ?? []) : []
  const step: CoachStep | undefined = session ? steps[session.index] : undefined

  // usePathname() drops the query string, so a step whose path carries one
  // (the dashboard tutorial runs on /dashboard?tutorial=1) must be compared on
  // the path portion alone or it never matches and the step never resolves.
  const stepPathname = step?.path ? step.path.split('?')[0] : null
  // A step with no path is happy wherever it is.
  const onStepPage = !!step && (!step.path || pathname === stepPathname)

  const close = useCallback(() => { stopCoachMarks() }, [])

  const go = useCallback((delta: number) => {
    const s = readSession()
    if (!s) return
    const list = COACH_STEPS[s.chapter] ?? []
    const next = s.index + delta
    if (next < 0) return
    if (next >= list.length) {
      stopCoachMarks()
      // Mid-walkthrough, finishing a chapter's tour moves on to the next
      // chapter rather than dropping the customer on whatever page the last
      // step was on. First run: the modal lives on /dashboard and reads its
      // chapter from storage on mount. Replay: the tutorial page opens the
      // chapter named in its query. Either way a full navigation brings the
      // modal back.
      if (s.resume?.mode === 'onboarding') {
        try { localStorage.setItem(ONBOARDING_CHAPTER_KEY, String(s.resume.chapter)) } catch { /* storage blocked */ }
        window.location.assign('/dashboard')
      } else if (s.resume?.mode === 'tutorial') {
        window.location.assign(`/help/tutorial?chapter=${s.resume.chapter}`)
      }
      return
    }
    writeSession({ chapter: s.chapter, index: next, resume: s.resume })
  }, [])

  // Move to the page this step lives on before trying to find its anchor.
  useEffect(() => {
    if (!step || !step.path) return
    // Compare the query too, but only the parameters the step actually asks
    // for. Steps on the same page can differ purely by query (the Account
    // chapter moves between tabs that way), and extra params already on the
    // URL must not count as a mismatch and cause a navigation loop.
    const [wantPath, wantQuery] = step.path.split('?')
    const want = new URLSearchParams(wantQuery || '')
    const have = new URLSearchParams(window.location.search)
    const queryMatches = [...want.entries()].every(([k, v]) => have.get(k) === v)
    if (pathname !== wantPath || !queryMatches) router.push(step.path)
  }, [step, onStepPage, pathname, router])

  // Locate and track the anchor. Polling beats a MutationObserver here because
  // the element can also MOVE without the DOM changing — a sibling image
  // loading above it is enough — and the same loop handles scroll and resize.
  useEffect(() => {
    if (!step) { setRect(null); setMissing(false); return }
    if (!step.anchor) { setRect(null); setMissing(false); return }
    if (!onStepPage) return

    let cancelled = false
    let waited = 0
    setMissing(false)

    const tick = () => {
      if (cancelled) return
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.anchor}"]`)
      if (el) {
        // Scroll on the first frame the element exists, not in a separate
        // effect: the effect ran before the page had laid out, so a control
        // low on a long form stayed below the fold with the card pinned to
        // the bottom edge pointing at nothing.
        const r = el.getBoundingClientRect()
        // Keep asking until the anchor is actually on screen, rather than
        // scrolling once and hoping. Two things defeat a single call: an
        // element inside a panel that has not opened yet measures zero, and
        // parts of this app scroll an inner container rather than the window,
        // where one smooth scroll can land short.

        // Only publish a change. Pushing a fresh object every frame re-rendered
        // the overlay 60 times a second for the whole step, which is wasted
        // work and made the tab noticeably busy.
        setRect((prev) =>
          prev &&
          Math.abs(prev.top - r.top) < 0.5 &&
          Math.abs(prev.left - r.left) < 0.5 &&
          Math.abs(prev.width - r.width) < 0.5 &&
          Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { top: r.top, left: r.left, width: r.width, height: r.height }
        )
        setMissing((m) => (m ? false : m))
      } else {
        waited += 1
        // ~3s of grace for the page to finish rendering, then say so rather
        // than leaving a dimmed screen pointing at nothing.
        if (waited > 60) setMissing(true)
        setRect(null)
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [step, onStepPage])

  useEffect(() => {
    if (!step?.anchor || !onStepPage) return
    const sel = `[data-tour="${step.anchor}"]`
    // A few spaced attempts: the first fires before the panel holding the
    // anchor has finished opening, and an element that still measures zero
    // cannot be scrolled to meaningfully.
    const timers = [120, 450, 900, 1600].map((ms) =>
      setTimeout(() => {
        const el = document.querySelector<HTMLElement>(sel)
        if (!el) return
        const r = el.getBoundingClientRect()
        if (r.height === 0) return
        if (r.top >= 0 && r.bottom <= window.innerHeight) return
        el.scrollIntoView({ behavior: 'auto', block: 'center' })
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [step, onStepPage])

  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      // scrollHeight, not the rendered height. Placement may clamp the card
      // with maxHeight, and measuring the clamped result fed straight back
      // into the decision that clamped it: the card then "fit", the clamp was
      // removed, it grew, stopped fitting, and the two states flipped every
      // frame. scrollHeight is the natural content height and does not move
      // when the clamp is applied, which breaks that loop.
      const h = el.scrollHeight
      setCardSize(prev => (Math.abs(prev.height - h) > 2 ? { height: h } : prev))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [session?.index, session?.chapter])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    if (session) document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [session, close])

  if (!session || !step) return null

  const viewerTier = (authSession?.user as any)?.planTier as string | undefined
  const requiredTier = step.feature ? lowestTierWithFeature(step.feature) : null
  const onRequiredPlan = step.feature ? tierHasFeature(viewerTier, step.feature) : true

  const pad = 6
  const spot = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Below the anchor when there is room, above when there isn't, centred when
  // there is no anchor at all.
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight
  const vw = typeof window === 'undefined' ? 1200 : window.innerWidth
  const GAP = 14
  const EDGE = 12
  const CARD_W = Math.min(440, vw - EDGE * 2)
  // Height varies a lot with the length of the copy, so it is measured rather
  // than assumed. Guessing it put long steps off the bottom of the screen with
  // their buttons unreachable.
  const cardH = cardSize.height || 200

  /**
   * Placement, in priority order: below the highlight, above it, then beside
   * it. Covering the highlight is the one outcome worth avoiding — the whole
   * point of the step is that the customer can see what is being described —
   * so the card only lands on top of it when no band around it can hold the
   * card at all, and even then it is given a scrollbar rather than being
   * allowed to run off the screen.
   */
  const band = spot
    ? {
        below: vh - (spot.top + spot.height + GAP) - EDGE,
        above: spot.top - GAP - EDGE,
        right: vw - (spot.left + spot.width + GAP) - EDGE,
        left: spot.left - GAP - EDGE,
      }
    : null

  let cardStyle: React.CSSProperties
  if (!spot || !band) {
    cardStyle = { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: CARD_W, maxHeight: vh - EDGE * 2, overflowY: 'auto' }
  } else {
    const centredLeft = Math.min(Math.max(EDGE, spot.left + spot.width / 2 - CARD_W / 2), Math.max(EDGE, vw - CARD_W - EDGE))
    const centredTop = Math.min(Math.max(EDGE, spot.top + spot.height / 2 - cardH / 2), Math.max(EDGE, vh - cardH - EDGE))

    // A few pixels of slack: without it a card that fits its band almost
    // exactly sits on the boundary and flips placement on sub-pixel changes.
    const SLACK = 8
    if (band.below >= cardH + SLACK) {
      cardStyle = { position: 'fixed', top: spot.top + spot.height + GAP, left: centredLeft, width: CARD_W }
    } else if (band.above >= cardH + SLACK) {
      cardStyle = { position: 'fixed', top: spot.top - GAP - cardH, left: centredLeft, width: CARD_W }
    } else if (band.right >= CARD_W) {
      cardStyle = { position: 'fixed', top: centredTop, left: spot.left + spot.width + GAP, width: CARD_W }
    } else if (band.left >= CARD_W) {
      cardStyle = { position: 'fixed', top: centredTop, left: spot.left - GAP - CARD_W, width: CARD_W }
    } else {
      // Nothing fits beside the highlight. Use the taller vertical band and let
      // the card scroll inside it, but only while that band can still show a
      // usable card. Below that, a scrollbar would hide the Back and Next
      // buttons, so the card is placed fully on screen instead and is allowed
      // to overlap the highlight — an unusable card is worse than a covered one.
      const useBelow = band.below >= band.above
      const room = useBelow ? band.below : band.above
      const MIN_USABLE = 260
      cardStyle = room >= MIN_USABLE
        ? {
            position: 'fixed',
            top: useBelow ? spot.top + spot.height + GAP : Math.max(EDGE, spot.top - GAP - room),
            left: centredLeft,
            width: CARD_W,
            maxHeight: room,
            overflowY: 'auto',
          }
        : {
            position: 'fixed',
            top: Math.min(Math.max(EDGE, (vh - cardH) / 2), Math.max(EDGE, vh - cardH - EDGE)),
            left: centredLeft,
            width: CARD_W,
            maxHeight: vh - EDGE * 2,
            overflowY: 'auto',
          }
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none' }} aria-live="polite">
      {/* Spotlight. A single huge outward shadow dims everything but the hole,
          which avoids compositing four separate panels around the element. */}
      {spot ? (
        <div
          style={{
            position: 'fixed',
            top: spot.top, left: spot.left, width: spot.width, height: spot.height,
            borderRadius: 10,
            boxShadow: '0 0 0 9999px rgba(12,74,110,.62)',
            outline: '2px solid #0EA5E9',
            outlineOffset: 0,
            transition: 'top .18s ease, left .18s ease, width .18s ease, height .18s ease',
            pointerEvents: 'none',
          }}
        />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,74,110,.62)', pointerEvents: 'none' }} />
      )}

      <div
        ref={cardRef}
        style={{
          ...cardStyle,
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 18px 50px rgba(12,74,110,.28)',
          padding: '16px 18px 14px',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 7 }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '.09em', textTransform: 'uppercase', color: '#94A3B8' }}>
            {session.index + 1} of {steps.length}
          </span>
          <button
            type="button"
            onClick={close}
            aria-label="End tour"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94A3B8', lineHeight: 0 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0C4A6E', letterSpacing: '-.02em', marginBottom: 5 }}>
          {step.title}
        </div>

        {/* Every plan sees the same tutorial. Where a step describes something
            their plan does not include, the badge says which plan does and
            links to the upgrade — rather than the step quietly describing
            controls that are not on their screen. */}
        {requiredTier && (
          onRequiredPlan ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 7, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: '#F1F5F9', color: '#64748B' }}>
              {tierLabel(requiredTier)} plan
            </span>
          ) : (
            <a
              href="/subscribe"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 7, padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', background: '#FFF7ED', color: '#C2410C', border: '1px solid rgba(249,115,22,.3)', textDecoration: 'none' }}
            >
              {tierLabel(requiredTier)} plan — upgrade
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </a>
          )
        )}
        <p style={{ fontSize: 12.5, color: '#4B7A94', lineHeight: 1.6, margin: 0 }}>
          {step.body}
        </p>

        {step.link && (
          <a
            href={step.link.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 9, fontSize: 12, fontWeight: 700, color: '#0284C7', textDecoration: 'none' }}
          >
            {step.link.label}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        )}

        {missing && (
          <p style={{ fontSize: 11.5, color: '#92400E', background: '#FFFBEB', border: '1px solid rgba(217,119,6,.25)', borderRadius: 7, padding: '7px 9px', lineHeight: 1.5, margin: '10px 0 0' }}>
            This control isn&rsquo;t on screen right now — it may not be available on your plan.
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 14 }}>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={session.index === 0}
            style={{
              background: 'none', border: 'none', padding: 0, fontFamily: 'inherit',
              fontSize: 12.5, fontWeight: 700,
              color: session.index === 0 ? '#CBD5E1' : '#4B7A94',
              cursor: session.index === 0 ? 'default' : 'pointer',
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            style={{
              background: '#F97316', color: '#fff', border: 'none', borderRadius: 9,
              padding: '9px 18px', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(249,115,22,.3)',
            }}
          >
            {session.index === steps.length - 1 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
