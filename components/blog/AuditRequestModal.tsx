'use client'

import { useState, useEffect, useRef } from 'react'
import { US_STATES } from '@/lib/usStates'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xeajkanw'

// Same prefixing rule used at registration/onboarding (app/auth/register/page.tsx,
// app/api/organization/profile/route.ts) — bare domains get corrected automatically
// so nobody has to type https:// themselves.
function normalizeWebsite(v: string): string {
  const t = v.trim()
  if (!t) return ''
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('www.')) return `https://${t}`
  return `https://www.${t}`
}

const PRIORITIES = [
  'Show up higher on Google Maps',
  'Get more customer reviews',
  'Get found by AI tools like ChatGPT',
  'Show off completed work online',
  'Not sure yet — just want the audit',
]

type Props = {
  /** Which page the request came from, so lead source is tracked automatically. */
  source: string
  /** Button label, so the same modal can back different CTAs. */
  buttonLabel?: string
  buttonClassName?: string
}

export default function AuditRequestModal({
  source,
  buttonLabel = 'Get a Free SEO Audit',
  buttonClassName = 'blog-btn-secondary',
}: Props) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  // Close on Escape and lock background scroll while the dialog is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstFieldRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const form = e.currentTarget
    const data = new FormData(form)

    const rawWebsite = data.get('website')
    if (typeof rawWebsite === 'string') {
      data.set('website', normalizeWebsite(rawWebsite))
    }

    // Honeypot: real people never see this field, so anything in it is a bot.
    // Silently show success rather than telling the bot it failed.
    if ((data.get('_gotcha') as string)?.trim()) {
      setSucceeded(true)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      })

      if (res.ok) {
        setSucceeded(true)
      } else {
        const body = await res.json().catch(() => null)
        const firstError = body?.errors?.[0]?.message
        setError(firstError || 'Something went wrong. Please try again, or email us directly.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function close() {
    setOpen(false)
    // Reset back to the form after the closing animation would finish, so a
    // returning visitor doesn't reopen straight into a stale success screen.
    setTimeout(() => {
      setSucceeded(false)
      setError(null)
    }, 200)
  }

  return (
    <>
      <button type="button" className={buttonClassName} onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>

      {open && (
        <div
          className="blog-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) close()
          }}
        >
          <div
            className="blog-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="audit-modal-title"
            ref={dialogRef}
          >
            <button className="blog-modal-close" onClick={close} aria-label="Close">
              &times;
            </button>

            {succeeded ? (
              <div className="blog-modal-success">
                <h2 id="audit-modal-title">Request received</h2>
                <p>
                  We&apos;ll take a real look at your site and your Google Business Profile, then
                  send the audit over. Expect it within a few business days.
                </p>
              </div>
            ) : (
              <>
                <h2 id="audit-modal-title">Get a Free SEO Audit</h2>
                <p className="blog-modal-sub">
                  Send us your website and we&apos;ll send back a real look at what&apos;s helping
                  and hurting your Google ranking. Every audit is reviewed by a person.
                </p>

                <form onSubmit={handleSubmit} noValidate={false}>
                  <label htmlFor="af-name">Your name</label>
                  <input id="af-name" type="text" name="name" required ref={firstFieldRef} autoComplete="name" />

                  <label htmlFor="af-business">Business name</label>
                  <input id="af-business" type="text" name="business_name" required autoComplete="organization" />

                  <div className="blog-modal-row">
                    <div>
                      <label htmlFor="af-email">Email</label>
                      <input id="af-email" type="email" name="email" required autoComplete="email" />
                    </div>
                    <div>
                      <label htmlFor="af-phone">Phone</label>
                      <input id="af-phone" type="tel" name="phone" required autoComplete="tel" />
                    </div>
                  </div>

                  <label htmlFor="af-url">Website</label>
                  <input
                    id="af-url"
                    type="text"
                    name="website"
                    placeholder="yourwebsite.com"
                    required
                    autoComplete="url"
                    inputMode="url"
                  />

                  <div className="blog-modal-row">
                    <div>
                      <label htmlFor="af-city">City</label>
                      <input id="af-city" type="text" name="city" placeholder="Nashville" required />
                    </div>
                    <div>
                      <label htmlFor="af-state">State</label>
                      <select id="af-state" name="state" required defaultValue="">
                        <option value="" disabled>
                          Choose one
                        </option>
                        {US_STATES.map((s) => (
                          <option key={s.abbr} value={s.abbr}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label htmlFor="af-priority">What matters most to you right now?</label>
                  <select id="af-priority" name="biggest_priority" required defaultValue="">
                    <option value="" disabled>
                      Choose one
                    </option>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>

                  {/* Sets the subject line of the notification email. */}
                  <input type="hidden" name="_subject" value="New free SEO audit request" />
                  {/* Records which page produced the lead. */}
                  <input type="hidden" name="source" value={source} />
                  {/* Spam honeypot — hidden via CSS, never filled by a real person. */}
                  <div className="blog-hp" aria-hidden="true">
                    <label htmlFor="af-gotcha">Leave this field empty</label>
                    <input id="af-gotcha" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
                  </div>

                  <button type="submit" className="blog-modal-submit" disabled={submitting}>
                    {submitting ? 'Sending…' : 'Request My Free Audit'}
                  </button>

                  {error && <p className="blog-modal-error">{error}</p>}
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
