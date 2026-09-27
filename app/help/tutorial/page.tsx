'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import DashboardShell from '@/components/DashboardShell'
import OnboardingModal from '@/components/OnboardingModal'
import { tierHasFeature } from '@/lib/planVersions'

/**
 * Interactive Tutorial — Support Center.
 *
 * Replays the first-run walkthrough on demand. Before this existed the
 * walkthrough ran once at signup and was unreachable afterwards, so anyone who
 * skipped a step or forgot one had no way back to it.
 *
 * The modal itself is reused rather than reimplemented, which is the whole
 * point: a second copy of these steps would drift out of step with the real
 * onboarding the moment either one changed.
 */
export default function TutorialPage() {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)

  const planTier = (session?.user as any)?.planTier as string | undefined
  const orgSlug = session?.user?.orgSlug ?? undefined

  // The walkthrough grows by one step on Titan (website integration), so the
  // count shown here is read from the same feature gate the modal uses instead
  // of being written down twice.
  const hasWidgetStep = tierHasFeature(planTier, 'website_integration')
  const isTitan = (planTier ?? 'free').toLowerCase() === 'titan'
  const stepCount = (isTitan ? 6 : 5) + (hasWidgetStep ? 1 : 0)

  const steps = [
    ['Welcome and what your plan includes', 'A quick tour of the features on your plan.'],
    ['Your business details', 'Company name, phone, website, and the trade you work in.'],
    ...(isTitan ? [['Agent research', 'Let the AI read your website and learn your services.'] as const] : []),
    ['Your Google Business Profile', 'Where to find your listing and why it matters.'],
    ['Your Google review link', 'Save the link customers use to leave you a review.'],
    ...(hasWidgetStep ? [['Website integration', 'Put your finished jobs on your own website.'] as const] : []),
    ['Finish', 'A recap and where to go next.'],
  ]

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
          <p style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.65, margin: '0 0 18px' }}>
            This is the same walkthrough you saw when you first created your account, covering{' '}
            {stepCount} steps. Anything you already filled in stays as it is unless you change it here,
            and you can close the tutorial at any point.
          </p>

          <ol style={{ margin: '0 0 22px', padding: 0, listStyle: 'none' }}>
            {steps.map(([title, sub], i) => (
              <li
                key={title}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '9px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    flexShrink: 0, width: 21, height: 21, borderRadius: '50%',
                    background: 'var(--surface-3)', color: 'var(--t2)',
                    fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--t1)', lineHeight: 1.45 }}>
                    {title}
                  </span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--t3)', lineHeight: 1.55 }}>
                    {sub}
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: 'var(--orange)', color: '#fff',
              fontSize: 13.5, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif",
              cursor: 'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Start the tutorial
          </button>
        </div>
      </div>

      {open && (
        <OnboardingModal
          planTier={planTier}
          orgSlug={orgSlug}
          replay
          onExit={() => setOpen(false)}
        />
      )}
    </DashboardShell>
  )
}
