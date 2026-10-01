'use client'

/**
 * Confirmation shown before a business name change goes through.
 *
 * Renaming reaches well beyond the field being edited, and the damage differs
 * by route, so the consequences are not hardcoded here:
 *
 * - From Account -> General the org slug is left alone, so published page
 *   addresses survive and simply stop matching the new name.
 * - From the setup walkthrough the onboarding route rebuilds the slug from the
 *   new name, which moves every published page address and breaks links
 *   already shared and indexed.
 *
 * `slugWillChange` picks which of those two the customer is actually facing.
 */
export default function BusinessNameWarning({
  from,
  to,
  slugWillChange,
  onCancel,
  onConfirm,
}: {
  from: string
  to: string
  slugWillChange: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const consequences = [
    'Every job page you have already published, your portfolio page, and any Google Business post made from a job will show the new name.',
    slugWillChange
      ? 'The web address of every page you have already published will be rebuilt from the new name. Links you have shared, and anything Google has already indexed, will stop working.'
      : 'The web addresses of those published pages were built from your original name and will not change, so they will no longer match what customers see.',
    'Review requests and notification emails sent from now on will use the new name, which may not match the business a customer remembers hiring.',
  ]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm business name change"
      onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(12,74,110,.5)', backdropFilter: 'blur(3px)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, padding: '24px 26px 22px', boxShadow: '0 24px 70px rgba(12,74,110,.3)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 10px', borderRadius: 20, background: '#FFFBEB', border: '1px solid rgba(217,119,6,.3)', color: '#92400E', fontSize: 10.5, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase' }}>
            Think carefully
          </span>
          {/* Only on the route that rebuilds the slug. Flagging both the same
              way would flatten the difference between a cosmetic mismatch and
              breaking links that are already indexed. */}
          {slugWillChange && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 20, background: '#FEF2F2', border: '1.5px solid rgba(220,38,38,.45)', color: '#B91C1C', fontSize: 13.5, fontWeight: 800, letterSpacing: '.03em', whiteSpace: 'nowrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Critical! Please Read!
            </span>
          )}
        </div>

        <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0C4A6E', letterSpacing: '-.02em', margin: '0 0 10px' }}>
          Change your business name?
        </h2>

        <p style={{ fontSize: 13, color: '#4B7A94', lineHeight: 1.65, margin: '0 0 14px' }}>
          You are about to change <strong style={{ color: '#0C4A6E' }}>{from}</strong> to{' '}
          <strong style={{ color: '#0C4A6E' }}>{to}</strong>. Your business name is not only a label on
          this page, so it is worth being certain before you save.
        </p>

        <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 9, padding: '12px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 8 }}>
            What this affects
          </div>
          {consequences.map((txt, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#4B7A94', lineHeight: 1.55, marginTop: i === 0 ? 0 : 9 }}>
              <span style={{ flexShrink: 0, width: 5, height: 5, borderRadius: '50%', background: '#D97706', marginTop: 7 }} />
              <span>{txt}</span>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: '#4B7A94', lineHeight: 1.6, margin: '0 0 18px' }}>
          If you are correcting a typo or a legal name, go ahead. If you are rebranding, it is worth
          telling us first so we can help you keep the work you have already published.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'inherit', fontSize: 13, fontWeight: 700, color: '#4B7A94', cursor: 'pointer' }}
          >
            Keep {from}
          </button>
          <button
            onClick={onConfirm}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '12px 22px', borderRadius: 9, border: 'none', background: '#DC2626', color: '#fff', fontFamily: 'inherit', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}
          >
            I am certain, change it
          </button>
        </div>
      </div>
    </div>
  )
}
