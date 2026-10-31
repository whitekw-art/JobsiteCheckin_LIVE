'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

// Google review tracking on the Job Dashboard (phase 2 review engine, part C).
// Titan only. Built to the approved mockup
// docs/mockups/2026-10-11-dashboard-review-tracking-mockup.html and the
// wording decided in the master plan, section 14.

type KindSummary = { count: number; last: string }

export interface TrackedReview {
  id: string
  checkInId: string | null
  state: 'unmatched' | 'linked' | 'hidden'
  expired: boolean
  reviewerName: string | null
  starRating: number | null
  comment: string | null
  hasReply: boolean | null
  postedAt: string | null
}

export interface ReviewTrackingData {
  gbpConnected: boolean
  lastCheckedAt: string | null
  reviewsListUrl: string | null
  requests: Record<string, Record<string, KindSummary>>
  /** Earliest recorded send, automatic email or link visit per job. */
  firstRequestAt: Record<string, string>
  reviews: TrackedReview[]
  suggestions: Record<string, Array<{ reviewId: string; match: string; firstRequestAt: string }>>
  needsReplyCount: number
}

export interface ReviewJob {
  id: string
  address: string
  doorType: string | null
  date: string | null
  homeCustomerName: string | null
}

export type ReviewAction = 'link' | 'dismiss' | 'unlink' | 'hide' | 'restore'

export function useReviewTracking(enabled: boolean) {
  const [data, setData] = useState<ReviewTrackingData | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetch('/api/reviews')
      if (res.ok) setData(await res.json())
    } catch {
      /* the dashboard works without review tracking */
    }
  }, [enabled])

  useEffect(() => {
    reload()
  }, [reload])

  const act = useCallback(
    async (action: ReviewAction, reviewId: string, checkInId?: string) => {
      setBusy(true)
      setError(null)
      try {
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, reviewId, checkInId }),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d.error || 'Could not update the review. Please try again.')
        }
        await reload()
      } finally {
        setBusy(false)
      }
    },
    [reload]
  )

  return { data, busy, error, act, reload }
}

// ── formatting ────────────────────────────────────────────────────────────────

function day(iso: string | null): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayTime(iso: string): string {
  const d = new Date(iso)
  return `${day(iso)} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function sentLine(k: KindSummary | undefined, verb = 'Sent'): string {
  if (!k) return 'Not sent'
  if (k.count === 1) return `${verb} 1 time, on ${dayTime(k.last)}`
  return `${verb} ${k.count} times, most recently ${dayTime(k.last)}`
}

function Stars({ value }: { value: number | null }) {
  const n = value ?? 0
  return (
    <span className="rv-stars" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= n ? 'rv-star-on' : 'rv-star-off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  )
}

function jobHasRequest(req: Record<string, KindSummary> | undefined): boolean {
  return !!req && Object.keys(req).length > 0
}

// ── collapsed-row pill ────────────────────────────────────────────────────────

export function ReviewPill({ jobId, data }: { jobId: string; data: ReviewTrackingData | null }) {
  if (!data) return null
  const linked = data.reviews.find((r) => r.state === 'linked' && r.checkInId === jobId)
  if (linked) {
    if (linked.expired) return <span className="rv-pill rv-pill-muted">Review details hidden</span>
    return (
      <>
        <span className="rv-pill rv-pill-green">
          ★ {linked.starRating ?? ''}-star review
        </span>
        {!linked.hasReply && <span className="rv-pill rv-pill-red">Needs reply</span>}
      </>
    )
  }
  if (data.suggestions[jobId]?.length) return <span className="rv-pill rv-pill-amber">Review to confirm</span>
  if (jobHasRequest(data.requests[jobId])) return <span className="rv-pill rv-pill-sky">Review requested</span>
  return null
}

// ── Google Review block on the expanded card ─────────────────────────────────

function RequestLines({ req }: { req: Record<string, KindSummary> | undefined }) {
  return (
    <div className="rv-req">
      <div className="rv-req-row">
        <span className="rv-req-label">By text</span>
        <span>{sentLine(req?.text)}</span>
      </div>
      <div className="rv-req-row">
        <span className="rv-req-label">By email</span>
        <span>{sentLine(req?.email)}</span>
      </div>
      {req?.email_auto && (
        <div className="rv-req-row">
          <span className="rv-req-label">Follow-up email</span>
          <span>{sentLine(req.email_auto, 'Sent automatically')}</span>
        </div>
      )}
      {req?.link_open && (
        <div className="rv-req-row">
          <span className="rv-req-label">Review link</span>
          <span>{sentLine(req.link_open, 'Opened')}</span>
        </div>
      )}
      <p className="rv-note">
        These are the times you clicked Send. Your phone or email app sends the message, so ProjectCheckin cannot confirm that it
        was delivered. A link can also be opened by a phone or email service checking it for viruses.
      </p>
    </div>
  )
}

function oneLineRequest(req: Record<string, KindSummary> | undefined): string | null {
  if (!req) return null
  const parts: string[] = []
  if (req.text) parts.push(`by text ${req.text.count === 1 ? 'once' : `${req.text.count} times`}`)
  if (req.email) parts.push(`by email ${req.email.count === 1 ? 'once' : `${req.email.count} times`}`)
  if (req.email_auto) parts.push('by automatic follow-up email')
  if (!parts.length) return null
  return `Review requested ${parts.join(', ')}.`
}

export function ReviewBlock({
  job,
  data,
  busy,
  canConnect,
  onAct,
  onOpenUnmatched,
}: {
  job: ReviewJob
  data: ReviewTrackingData | null
  busy: boolean
  canConnect: boolean
  onAct: (action: ReviewAction, reviewId: string, checkInId?: string) => Promise<void> | void
  onOpenUnmatched: () => void
}) {
  if (!data) return null
  const req = data.requests[job.id]
  const linked = data.reviews.find((r) => r.state === 'linked' && r.checkInId === job.id)
  const suggestions = data.suggestions[job.id] ?? []
  const lastChecked = data.lastCheckedAt ? (
    <p className="rv-checked">Google reviews last checked on {day(data.lastCheckedAt)}.</p>
  ) : null

  // State 4: a confirmed review.
  if (linked) {
    if (linked.expired) {
      return (
        <div className="rv-block">
          <div className="rv-head">
            <span className="rv-title">Google Review</span>
            <span className="rv-status rv-status-muted">Details hidden</span>
          </div>
          <p className="rv-text">
            A review is linked to this job, but its details are hidden because ProjectCheckin has not been able to refresh them from
            Google for 29 days. Google allows review details to be kept for no more than 30 days between refreshes.
          </p>
          {canConnect ? (
            <p className="rv-text">
              <a className="rv-link" href="/account?tab=connections">Reconnect Google</a> to show the review here and on the job page
              again.
            </p>
          ) : (
            <p className="rv-text">Ask your account owner to reconnect Google in Account, Connections.</p>
          )}
        </div>
      )
    }
    const summary = oneLineRequest(req)
    return (
      <div className="rv-block">
        <div className="rv-head">
          <span className="rv-title">Google Review</span>
          <span className="rv-status rv-status-green">Customer review received</span>
        </div>
        <div className="rv-review">
          <div className="rv-review-top">
            <span className="rv-reviewer">{linked.reviewerName || 'Anonymous reviewer'}</span>
            <Stars value={linked.starRating} />
          </div>
          <div className="rv-date">Posted {day(linked.postedAt)}</div>
          {linked.comment && <p className="rv-comment">{linked.comment}</p>}
        </div>
        <p className="rv-text">Shown on this job&apos;s page.</p>
        <div className="rv-actions">
          {linked.hasReply ? (
            <span className="rv-replied">Replied on Google</span>
          ) : (
            <span className="rv-not-replied">Not replied yet. Replies are written on Google.</span>
          )}
          {data.reviewsListUrl && (
            <a className="rv-link" href={data.reviewsListUrl} target="_blank" rel="noopener noreferrer">
              View on Google
            </a>
          )}
          <button className="rv-btn-text" disabled={busy} onClick={() => onAct('unlink', linked.id)}>
            Unlink from this job
          </button>
        </div>
        {summary && <p className="rv-note">{summary}</p>}
      </div>
    )
  }

  // No request recorded yet (state 1).
  if (!jobHasRequest(req)) {
    return (
      <div className="rv-block">
        <div className="rv-head">
          <span className="rv-title">Google Review</span>
          <span className="rv-status rv-status-muted">Not requested</span>
        </div>
        <p className="rv-text">No review request has been recorded for this job.</p>
        <p className="rv-note">Use Request Google Review below. ProjectCheckin records the time each time you click Send.</p>
      </div>
    )
  }

  // Request sent, but reviews cannot be read without a Google connection.
  if (!data.gbpConnected) {
    return (
      <div className="rv-block">
        <div className="rv-head">
          <span className="rv-title">Google Review</span>
          <span className="rv-status rv-status-sky">Review requested, no review yet</span>
        </div>
        <RequestLines req={req} />
        <p className="rv-text">
          To see this customer&apos;s review here once it is posted, connect your Google Business Profile
          {canConnect ? '.' : ' (your account owner can do this in Account, Connections).'}
        </p>
        {canConnect && (
          <a className="rv-btn" href="/account?tab=connections">
            Connect Google
          </a>
        )}
      </div>
    )
  }

  // State 3: suggested matches waiting for the owner.
  if (suggestions.length) {
    return (
      <div className="rv-block">
        <div className="rv-head">
          <span className="rv-title">Google Review</span>
          <span className="rv-status rv-status-amber">Confirm match</span>
        </div>
        <RequestLines req={req} />
        {suggestions.map((s) => {
          const r = data.reviews.find((x) => x.id === s.reviewId)
          if (!r) return null
          const how =
            s.match === 'first_and_initial'
              ? 'has the same first name and last initial as'
              : 'has the same last name as'
          return (
            <div key={s.reviewId} className="rv-suggest">
              <div className="rv-review">
                <div className="rv-review-top">
                  <span className="rv-reviewer">{r.reviewerName || 'Anonymous reviewer'}</span>
                  <Stars value={r.starRating} />
                </div>
                <div className="rv-date">Posted {day(r.postedAt)}</div>
                {r.comment && <p className="rv-comment">{r.comment}</p>}
              </div>
              <p className="rv-note">
                Suggested because the reviewer&apos;s name on Google, {r.reviewerName}, {how} the customer name on this job,{' '}
                {job.homeCustomerName}, and the review was posted on {day(r.postedAt)}, after your first request for this job on{' '}
                {day(s.firstRequestAt)}.
              </p>
              <div className="rv-actions">
                <button className="rv-btn" disabled={busy} onClick={() => onAct('link', r.id, job.id)}>
                  Confirm
                </button>
                <button className="rv-btn-text" disabled={busy} onClick={() => onAct('dismiss', r.id, job.id)}>
                  Not this job
                </button>
              </div>
              <p className="rv-note">
                After you confirm, the review appears on this job&apos;s page with the name and comment exactly as they appear on Google.
              </p>
            </div>
          )
        })}
        {lastChecked}
      </div>
    )
  }

  // State 5: reviews arrived since the request but none matches this customer.
  const firstReq = data.firstRequestAt[job.id] ?? null
  const since = data.reviews.filter(
    (r) => r.state === 'unmatched' && !r.expired && r.postedAt && firstReq && r.postedAt > firstReq
  )
  if (since.length) {
    return (
      <div className="rv-block">
        <div className="rv-head">
          <span className="rv-title">Google Review</span>
          <span className="rv-status rv-status-sky">New reviews not linked</span>
        </div>
        <RequestLines req={req} />
        <p className="rv-text">
          Your Google profile has received {since.length === 1 ? '1 review' : `${since.length} reviews`} since this request that{' '}
          {since.length === 1 ? 'is' : 'are'} not linked to any job, and no reviewer&apos;s name matches{' '}
          {job.homeCustomerName || 'a customer name saved on this job'}. If one of them is from this customer, you can link it to this
          job.
        </p>
        <button className="rv-btn-text" onClick={onOpenUnmatched}>
          Open unmatched reviews
        </button>
        {lastChecked}
      </div>
    )
  }

  // State 2: request sent, waiting for a review.
  return (
    <div className="rv-block">
      <div className="rv-head">
        <span className="rv-title">Google Review</span>
        <span className="rv-status rv-status-sky">Review requested, no review yet</span>
      </div>
      <RequestLines req={req} />
      {lastChecked}
    </div>
  )
}

// ── unmatched reviews panel ──────────────────────────────────────────────────

export function UnmatchedReviewsPanel({
  data,
  busy,
  error,
  jobs,
  open,
  onToggle,
  onAct,
}: {
  data: ReviewTrackingData | null
  busy: boolean
  error: string | null
  jobs: ReviewJob[]
  open: boolean
  onToggle: () => void
  onAct: (action: ReviewAction, reviewId: string, checkInId?: string) => Promise<void> | void
}) {
  const [pickFor, setPickFor] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showHidden, setShowHidden] = useState(false)

  const unmatched = useMemo(() => (data?.reviews ?? []).filter((r) => r.state === 'unmatched' && !r.expired), [data])
  const hidden = useMemo(() => (data?.reviews ?? []).filter((r) => r.state === 'hidden'), [data])
  const linkedJobIds = useMemo(
    () => new Set((data?.reviews ?? []).filter((r) => r.state === 'linked').map((r) => r.checkInId)),
    [data]
  )

  const pickerJobs = useMemo(() => {
    const free = jobs.filter((j) => !linkedJobIds.has(j.id))
    const q = query.trim().toLowerCase()
    const filtered = q
      ? free.filter((j) => `${j.homeCustomerName ?? ''} ${j.address} ${j.doorType ?? ''}`.toLowerCase().includes(q))
      : free
    const withReq = filtered.filter((j) => data?.requests[j.id])
    const others = filtered.filter((j) => !data?.requests[j.id])
    return { withReq: withReq.slice(0, 10), others: others.slice(0, 10) }
  }, [jobs, linkedJobIds, query, data])

  if (!data || (unmatched.length === 0 && hidden.length === 0 && data.needsReplyCount === 0)) return null

  const startPick = (id: string) => {
    setPickFor(id)
    setSelected(null)
    setQuery('')
  }

  const jobRow = (j: ReviewJob) => {
    const req = data.requests[j.id]
    const sent = req?.text ? `Text sent ${day(req.text.last)}` : req?.email ? `Email sent ${day(req.email.last)}` : null
    return (
      <label key={j.id} className={`rv-pick-row${selected === j.id ? ' rv-pick-on' : ''}`}>
        <input type="radio" name="rv-pick" checked={selected === j.id} onChange={() => setSelected(j.id)} />
        <span className="rv-pick-main">
          <span className="rv-pick-name">{j.homeCustomerName || 'No customer name saved'}</span>
          <span className="rv-pick-sub">
            {[j.address, j.doorType, j.date].filter(Boolean).join(' · ')}
          </span>
        </span>
        {sent && <span className="rv-pick-sent">{sent}</span>}
      </label>
    )
  }

  const reviewCard = (r: TrackedReview, mode: 'unmatched' | 'hidden') => (
    <div key={r.id} className="rv-un-item">
      <div className="rv-review">
        <div className="rv-review-top">
          <span className="rv-reviewer">{r.reviewerName || 'Anonymous reviewer'}</span>
          <Stars value={r.starRating} />
        </div>
        <div className="rv-date">Posted {day(r.postedAt)}</div>
        {r.comment && <p className="rv-comment">{r.comment}</p>}
        {!r.reviewerName && mode === 'unmatched' && (
          <p className="rv-note">Google does not share a name for this review, so ProjectCheckin cannot suggest a job for it.</p>
        )}
      </div>
      {mode === 'hidden' ? (
        <div className="rv-actions">
          <button className="rv-btn-text" disabled={busy} onClick={() => onAct('restore', r.id)}>
            Restore
          </button>
        </div>
      ) : pickFor === r.id ? (
        <div className="rv-picker">
          <div className="rv-picker-title">Link this review to a job</div>
          <input
            className="rv-picker-search"
            placeholder="Search by customer name or address"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {pickerJobs.withReq.length > 0 && <div className="rv-pick-group">Recent jobs with a review request</div>}
          {pickerJobs.withReq.map(jobRow)}
          {pickerJobs.others.length > 0 && <div className="rv-pick-group">Other recent jobs</div>}
          {pickerJobs.others.map(jobRow)}
          {pickerJobs.withReq.length + pickerJobs.others.length === 0 && <p className="rv-note">No jobs match.</p>}
          <div className="rv-actions">
            <button
              className="rv-btn"
              disabled={!selected || busy}
              onClick={async () => {
                if (!selected) return
                await onAct('link', r.id, selected)
                setPickFor(null)
              }}
            >
              Link to selected job
            </button>
            <button className="rv-btn-text" onClick={() => setPickFor(null)}>
              Cancel
            </button>
          </div>
          <p className="rv-note">Customer names appear here because this is your private dashboard; they are never shown on public pages.</p>
        </div>
      ) : (
        <div className="rv-actions">
          <button className="rv-btn" disabled={busy} onClick={() => startPick(r.id)}>
            Link to a job
          </button>
          <button className="rv-btn-text" disabled={busy} onClick={() => onAct('hide', r.id)}>
            Not from a job
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="rv-panel">
      {data.needsReplyCount > 0 && (
        <div className="rv-reply-bar">
          <span className="rv-pill rv-pill-red">Needs reply</span>
          {data.needsReplyCount === 1
            ? '1 linked review has no reply from you on Google.'
            : `${data.needsReplyCount} linked reviews have no reply from you on Google.`}
          {data.reviewsListUrl && (
            <a className="rv-link" href={data.reviewsListUrl} target="_blank" rel="noopener noreferrer">
              View on Google
            </a>
          )}
        </div>
      )}
      {(unmatched.length > 0 || hidden.length > 0) && (
        <>
          <button className="rv-panel-head" onClick={onToggle} aria-expanded={open}>
            <span>New Google reviews: which job is this for?</span>
            <span className="rv-count">{unmatched.length}</span>
            <span className={`rv-chev${open ? ' rv-chev-open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>
          {open && (
            <div className="rv-panel-body">
              <p className="rv-note">Reviews posted since your first review request from ProjectCheckin that are not linked to a job.</p>
              {error && <p className="rv-error">{error}</p>}
              {unmatched.map((r) => reviewCard(r, 'unmatched'))}
              {unmatched.length === 0 && <p className="rv-text">Every review is linked or hidden.</p>}
              {hidden.length > 0 && (
                <>
                  <button className="rv-btn-text" onClick={() => setShowHidden((v) => !v)}>
                    {showHidden ? 'Hide' : 'Show'} reviews marked not from a job ({hidden.length})
                  </button>
                  {showHidden && hidden.map((r) => reviewCard(r, 'hidden'))}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
