'use client'

import { useEffect, useRef } from 'react'

/**
 * The animated typewriter output-preview visual on the AI Copywriter Agent
 * hero. COPY of markup and behaviour currently inline in
 * components/AICopywriterAgent.tsx, deliberately duplicated so the live
 * feature page stays untouched — see the note in
 * components/landing/BentoVisuals.tsx for why. TEST ONLY.
 */

const TYPEWRITER_SEGMENTS = [
  { text: 'Full shingle replacement — Cedar Park, TX.', bold: true },
  {
    text: ' The original 3-tab shingles showed heavy granule loss across the south slope with two active leak points above the master suite. We removed both layers, replaced damaged decking, and installed ',
  },
  { text: 'CertainTeed Landmark Pro in Heather Blend', bold: true },
  { text: ' with continuous ridge vent and ice-and-water shield to all eaves. Completed in one day.' },
]

const cameraIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

export function AICopywriterOutputPreview() {
  const opTextRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const maybeEl = opTextRef.current
    if (!maybeEl) return
    const el = maybeEl

    const CHAR_SPEED = 32
    const PAUSE_MS = 520
    const PAUSE_EVERY = 10
    const LOOP_DELAY = 2800

    let segIdx = 0
    let charIdx = 0
    let wordCount = 0
    let timer: ReturnType<typeof setTimeout> | null = null

    function buildHtml() {
      let html = ''
      for (let i = 0; i < segIdx; i++) {
        const s = TYPEWRITER_SEGMENTS[i]
        html += s.bold ? `<strong>${s.text}</strong>` : s.text
      }
      if (segIdx < TYPEWRITER_SEGMENTS.length) {
        const cur = TYPEWRITER_SEGMENTS[segIdx]
        const part = cur.text.slice(0, charIdx)
        html += cur.bold ? `<strong>${part}</strong>` : part
      }
      html += '<span class="op-cursor"></span>'
      return html
    }

    function type() {
      if (segIdx >= TYPEWRITER_SEGMENTS.length) {
        timer = setTimeout(reset, LOOP_DELAY)
        return
      }
      const seg = TYPEWRITER_SEGMENTS[segIdx]
      if (charIdx >= seg.text.length) {
        segIdx++
        charIdx = 0
        type()
        return
      }
      const ch = seg.text[charIdx]
      charIdx++
      if (ch === ' ') wordCount++
      el.innerHTML = buildHtml()
      let delay = CHAR_SPEED
      if (ch === ' ' && wordCount > 0 && wordCount % PAUSE_EVERY === 0) delay = PAUSE_MS
      timer = setTimeout(type, delay)
    }

    function reset() {
      segIdx = 0
      charIdx = 0
      wordCount = 0
      el.innerHTML = '<span class="op-cursor"></span>'
      timer = setTimeout(type, 400)
    }

    timer = setTimeout(type, 1200)
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [])

  return (
    <div className="output-preview">
      <div className="op-label">AI Copywriter Agent · Live preview</div>
      <div className="op-photos">
        <div className="op-photo">
          <img src="/images/lp-bac-before-door.png" alt="Before" />
          <span className="op-photo-tag before">Before</span>
        </div>
        <div className="op-photo">
          <img src="/images/lp-bac-before-door.png" alt="" style={{ opacity: 0.3 }} />
          <div className="op-ghost-icon">{cameraIcon}</div>
        </div>
        <div className="op-photo">
          <img src="/images/lp-bac-after-door.png" alt="After" />
          <span className="op-photo-tag after">After</span>
        </div>
      </div>
      <div className="op-processing">
        <span className="op-processing-dot" />
        <span className="op-processing-dot" />
        <span className="op-processing-dot" />
        Reading photos and writing description
      </div>
      <div className="op-output">
        <div className="op-output-bar">
          <div className="op-output-title">147 Clearwater Dr — Roofing</div>
          <div className="op-publish-btn">Publish</div>
        </div>
        <p className="op-text" ref={opTextRef}>
          <span className="op-cursor" />
        </p>
        <div className="op-tags">
          <span className="op-tag">Cedar Park, TX</span>
          <span className="op-tag">Roofing</span>
          <span className="op-tag">Shingle Replacement</span>
        </div>
      </div>
    </div>
  )
}
