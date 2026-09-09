'use client'

import { useState } from 'react'

/**
 * The two custom visuals on the Review Requests feature page — the iMessage
 * hero card and the tabbed SMS/Email preview card. COPIES of markup and
 * behaviour currently inline in components/ReviewRequests.tsx, deliberately
 * duplicated so the live feature page stays untouched — see the note in
 * components/landing/BentoVisuals.tsx for why. TEST ONLY.
 */

export function ReviewImessageVisual() {
  return (
    <div className="rr-imsg-wrap">
      <div className="rr-imsg-card">
        <div className="rr-imsg-chrome">
          <div className="rr-imsg-back">
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1L1 6l5 5" />
            </svg>
            Messages
          </div>
          <div className="rr-imsg-actions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.86 9.64a19.79 19.79 0 01-3.07-8.67A2 2 0 012.77 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.5a16 16 0 006.29 6.29l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="10" r="3" />
              <path d="M7 20.662V19a2 2 0 012-2h6a2 2 0 012 2v1.662" />
            </svg>
          </div>
          <div className="rr-imsg-avatar">SM</div>
          <div className="rr-imsg-name">Sarah M.</div>
          <div className="rr-imsg-sub">Mobile · 615-555-0182</div>
        </div>

        <div className="rr-imsg-thread">
          <div className="rr-imsg-ts">Today 4:47 PM</div>
          <div className="rr-imsg-row-out">
            <div className="rr-imsg-bubble">
              Sarah — we really appreciated your business. Hope you love the result — but
              please don&apos;t hesitate to call if anything needs attention.
              <br />
              <br />
              If you have a minute, a Google review helps us more than you know:
              <span className="rr-imsg-link">⭐ Leave us a review on Google</span>
              <span className="rr-imsg-link">📄 Your completed job page</span>
              <br />
              <span className="rr-imsg-sig">
                Thanks!
                <br />
                Carter&apos;s Iron Doors
                <br />
                615-555-0182
              </span>
            </div>
          </div>
          <div className="rr-imsg-delivered">Delivered</div>
        </div>

        <div className="rr-imsg-compose">
          <div className="rr-imsg-compose-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <div className="rr-imsg-compose-field">iMessage</div>
          <div className="rr-imsg-send">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="rr-chips">
        <div className="rr-chip">
          <div className="rr-chip-dot orange" />
          Sends from your own phone number — not a platform
        </div>
        <div className="rr-chip">
          <div className="rr-chip-dot blue" />
          Customer&apos;s name and review link already filled in
        </div>
        <div className="rr-chip">
          <div className="rr-chip-dot green" />
          Editable before you send — or tap send as written
        </div>
        <div className="rr-chip">
          <div className="rr-chip-dot navy" />
          Opens in Messages or Mail — no new app to download
        </div>
      </div>
    </div>
  )
}

/**
 * Tabs and card share one activeTab state, but sit in different columns of
 * the section's two-column layout — the parent (StoryblokFeaturePage's
 * MessageSection) owns the state and renders <MessageTabs> in the copy
 * column, <MessageCard> in the visual column, matching the live page's DOM
 * structure exactly.
 */
export function useMessageTab() {
  return useState<'sms' | 'email'>('sms')
}

export function MessageTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: 'sms' | 'email'
  setActiveTab: (tab: 'sms' | 'email') => void
}) {
  return (
    <div className="rr-msg-tabs">
      <button className={`rr-msg-tab${activeTab === 'sms' ? ' active' : ''}`} onClick={() => setActiveTab('sms')}>
        Text Message
      </button>
      <button className={`rr-msg-tab${activeTab === 'email' ? ' active' : ''}`} onClick={() => setActiveTab('email')}>
        Email
      </button>
    </div>
  )
}

export function ReviewMessageCardVisual({ activeTab }: { activeTab: 'sms' | 'email' }) {
  return (
    <>
      <div className="rr-msg-card">
        <div className="rr-mc-header">
          <div className="rr-mc-recipient">
            To: <span>Sarah M.</span> &nbsp;·&nbsp;{' '}
            <span>{activeTab === 'sms' ? '615-555-0182' : 'sarah@example.com'}</span>
          </div>
          <div className={`rr-mc-chip${activeTab === 'email' ? ' mail' : ''}`}>
            {activeTab === 'sms' ? 'via iMessage' : 'via Mail'}
          </div>
        </div>

        {activeTab === 'sms' ? (
          <>
            <div className="rr-mc-sms-body">
              <div className="rr-mc-sms-bubble">
                <span className="rr-ann">Sarah</span> — we really appreciated your business.
                Hope you love the result — but please don&apos;t hesitate to call if anything
                needs attention.
                <br />
                <br />
                If you have a minute, a Google review helps us more than you know:
                <span className="rr-link">⭐ Leave us a review on Google →</span>
                <span className="rr-link">📄 See your completed job page →</span>
                <span className="rr-sig">
                  Thanks!
                  <br />
                  Carter&apos;s Iron Doors
                  <br />
                  615-555-0182
                </span>
              </div>
            </div>
            <div className="rr-mc-legend">
              <div className="rr-legend-item">
                <div className="rr-legend-dot orange" />
                Customer first name — pulled from the job record
              </div>
              <div className="rr-legend-item">
                <div className="rr-legend-dot blue" />
                Your Google review link — set once in account settings
              </div>
              <div className="rr-legend-item">
                <div className="rr-legend-dot muted" />
                Your business name and phone — auto-signed from your account
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rr-mc-email-field">
              <strong>Subject</strong>
              We appreciated working with you — quick favor if you have a minute
            </div>
            <div className="rr-mc-email-body">
              <span className="rr-ann">Sarah</span>,
              <br />
              <br />
              We really appreciated the opportunity to work with you. Hope everything looks
              exactly the way you wanted — but please don&apos;t hesitate to reach out if
              anything needs attention.
              <br />
              <br />
              If you have a spare minute, a Google review means more than you know:
              <span className="rr-link">⭐ Leave us a review on Google →</span>
              <span className="rr-link">📄 View your completed job page →</span>
              <span className="rr-sig">
                Thanks for trusting us with your home.
                <br />
                <br />
                Carter&apos;s Iron Doors
                <br />
                615-555-0182
                <br />
                cartersiron.com
              </span>
            </div>
            <div className="rr-mc-legend">
              <div className="rr-legend-item">
                <div className="rr-legend-dot orange" />
                Customer first name — pulled from the job record
              </div>
              <div className="rr-legend-item">
                <div className="rr-legend-dot blue" />
                Your Google review link — set once in account settings
              </div>
              <div className="rr-legend-item">
                <div className="rr-legend-dot muted" />
                Your business name, phone, and website — from your account
              </div>
            </div>
          </>
        )}
      </div>
      <div className="rr-mc-edit-note">
        Fully editable before sending &nbsp;·&nbsp; Opens in your native Messages or Mail app
      </div>
    </>
  )
}
