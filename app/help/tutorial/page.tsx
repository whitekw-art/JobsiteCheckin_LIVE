'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'
import OnboardingModal, { CHAPTERS, FINISH_CHAPTER } from '@/components/OnboardingModal'
import { tierHasFeature } from '@/lib/planVersions'

/**
 * Interactive Tutorial — Support Center.
 *
 * Replays the walkthrough on demand, chapter by chapter. Before this existed
 * the walkthrough ran once at signup and was unreachable afterwards, so anyone
 * who skipped a step or forgot one had no way back to it.
 *
 * The modal itself is reused rather than reimplemented, which is the whole
 * point: a second copy of these steps would drift out of step with the real
 * onboarding the moment either one changed. The chapter list below is read
 * from the same CHAPTERS constant the modal uses, for the same reason.
 */
export default function TutorialPage() {
  const { data: session } = useSession()
  const [startChapter, setStartChapter] = useState<number | null>(null)
  // Chapter the customer asked for, held until they acknowledge the caution.
  const [pendingChapter, setPendingChapter] = useState<number | null>(null)

  // A chapter's coach-mark tour hands back here with ?chapter=N when it
  // finishes, so the replay carries on to the next chapter instead of ending.
  // The query is stripped straight away so a refresh doesn't reopen it.
  useEffect(() => {
    const n = parseInt(new URLSearchParams(window.location.search).get('chapter') || '', 10)
    if (!Number.isFinite(n) || n < 2 || n > FINISH_CHAPTER) return
    setStartChapter(n)
    window.history.replaceState({}, '', '/help/tutorial')
  }, [])

  const planTier = (session?.user as any)?.planTier as string | undefined
  const orgSlug = session?.user?.orgSlug ?? undefined

  // Account Setup grows by one step on Titan (website integration) and by the
  // agent-research step, so its contents are read from the same feature gate
  // the modal uses instead of being written down twice.
  const hasWidgetStep = tierHasFeature(planTier, 'website_integration')
  const isTitan = (planTier ?? 'free').toLowerCase() === 'titan'

  const accountSetupSteps = [
    ['Welcome and what your plan includes', 'A quick tour of the features on your plan.'],
    ['Your business details', 'Company name, phone, website, and the trade you work in.'],
    ...(isTitan ? [['Agent research', 'Let the AI read your website and learn your services.']] : []),
    ['Your Google Business Profile', 'Where to find your listing and why it matters.'],
    ['Your Google review link', 'Save the link customers use to leave you a review.'],
    ...(hasWidgetStep ? [['Website integration', 'Put your finished jobs on your own website.']] : []),
  ]

  // Only Account Setup has its steps written so far. The rest are listed by
  // name so the shape of the walkthrough is visible, and fill in as each
  // chapter's steps are built.
  const stepsByChapter: Record<number, string[][]> = { 1: accountSetupSteps }

  return (
    <DashboardShell title="Help & Support">
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '0 0 22px', lineHeight: 1.6 }}>
          Walk through setup again, at any time.
        </p>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '22px 24px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--t1)', margin: '0 0 6px', letterSpacing: '-.2px' }}>
            Interactive Tutorial
          </h2>
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, margin: '0 0 20px' }}>
            The same walkthrough you saw when you created your account, in {CHAPTERS.length} chapters.
            Start any chapter on its own. Anything you already filled in stays as it is unless you
            change it here, and you can close the tutorial at any point.
          </p>

          {CHAPTERS.map((chapter, ci) => {
            const steps = stepsByChapter[chapter.id] ?? []
            return (
              <div
                key={chapter.id}
                style={{
                  borderTop: ci === 0 ? 'none' : '1px solid var(--border)',
                  padding: ci === 0 ? '0 0 14px' : '14px 0',
                }}
              >
                <button
                  type="button"
                  onClick={() => (chapter.id === 1 ? setPendingChapter(1) : setStartChapter(chapter.id))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 11, width: '100%',
                    background: 'none', border: 'none', padding: 0, textAlign: 'left',
                    cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                      background: 'var(--sky-dim)', color: 'var(--sky-text)',
                      fontSize: 11, fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {chapter.id}
                  </span>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.1px' }}>
                    {chapter.name}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0, fontSize: 12, fontWeight: 700, color: 'var(--sky-text)' }}>
                    {chapter.id === 1 ? 'Edit' : 'Start'}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                  </span>
                </button>

                {steps.length > 0 ? (
                  <ol style={{ margin: '10px 0 0', padding: '0 0 0 33px', listStyle: 'none' }}>
                    {steps.map(([title, sub]) => (
                      <li key={title} style={{ padding: '5px 0' }}>
                        <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--t2)', lineHeight: 1.45 }}>
                          {title}
                        </span>
                        <span style={{ display: 'block', fontSize: 12, color: 'var(--t3)', lineHeight: 1.5 }}>
                          {sub}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div style={{ padding: '7px 0 0 33px', fontSize: 12, color: 'var(--t3)', lineHeight: 1.55 }}>
                    {chapter.intro}
                  </div>
                )}
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => setPendingChapter(1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 20,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--orange)', color: '#fff',
              fontSize: 13.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start from the beginning
          </button>
        </div>
      </div>

      {pendingChapter !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Before you edit"
          onClick={() => setPendingChapter(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(12,74,110,.5)', backdropFilter: 'blur(3px)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: '24px 26px 22px', boxShadow: '0 24px 70px rgba(12,74,110,.3)' }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 20, background: '#FFFBEB', border: '1px solid rgba(217,119,6,.3)', color: '#92400E', fontSize: 12, fontWeight: 800, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 13 }}>
              Before you begin
            </div>
            <p style={{ fontSize: 13.5, color: '#4B7A94', lineHeight: 1.7, margin: '0 0 20px' }}>
              Take caution and make sure any edits to your account are truly necessary and accurate.
              We will provide warnings for any impactful changes to ensure you are aware of any
              consequences for those changes. It is safe to click &ldquo;Ok&rdquo; below and proceed
              with a review of your account details.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setPendingChapter(null)}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#4B7A94', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setStartChapter(pendingChapter); setPendingChapter(null) }}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '11px 26px', borderRadius: 9, border: 'none', background: 'var(--orange)', color: '#fff', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {startChapter !== null && (
        <OnboardingModal
          planTier={planTier}
          orgSlug={orgSlug}
          replay
          startChapter={startChapter}
          onExit={() => setStartChapter(null)}
        />
      )}
    </DashboardShell>
  )
}
