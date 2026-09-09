'use client'

import { useEffect, useRef } from 'react'

/**
 * The two custom visuals on the Before & After feature page — the draggable
 * comparison slider (hero) and the animated ghost-camera phone mockup
 * (callout section). COPIES of markup and behaviour currently inline in
 * components/BeforeAfter.tsx, deliberately duplicated so the live feature
 * page stays untouched — see the note in components/landing/BentoVisuals.tsx
 * for why. TEST ONLY.
 */

export function BeforeAfterSliderVisual() {
  const demoRef = useRef<HTMLDivElement>(null)
  const dividerRef = useRef<HTMLDivElement>(null)
  const afterPanelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const demo = demoRef.current
    const divider = dividerRef.current
    const afterPanel = afterPanelRef.current
    if (!demo || !divider || !afterPanel) return

    let isDragging = false

    const setPosition = (clientX: number) => {
      const rect = demo.getBoundingClientRect()
      const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
      divider.style.left = pct + '%'
      afterPanel.style.clipPath = `inset(0 0 0 ${pct}%)`
    }

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true
      setPosition(e.clientX)
    }
    const onMouseUp = () => {
      isDragging = false
    }
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) setPosition(e.clientX)
    }
    const onTouchStart = (e: TouchEvent) => {
      isDragging = true
      e.preventDefault()
    }
    const onTouchEnd = () => {
      isDragging = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) setPosition(e.touches[0].clientX)
    }

    demo.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mousemove', onMouseMove)
    divider.addEventListener('touchstart', onTouchStart, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
    document.addEventListener('touchmove', onTouchMove, { passive: false })

    const rect = demo.getBoundingClientRect()
    setPosition(rect.left + rect.width * 0.85)

    const animTimer = setTimeout(() => {
      const start = Date.now()
      const dur = 1400
      const animate = () => {
        const elapsed = Date.now() - start
        if (elapsed < dur) {
          const pct = 85 - Math.sin((elapsed / dur) * Math.PI) * 65
          divider.style.left = pct + '%'
          afterPanel.style.clipPath = `inset(0 0 0 ${pct}%)`
          requestAnimationFrame(animate)
        } else {
          divider.style.left = '85%'
          afterPanel.style.clipPath = 'inset(0 0 0 85%)'
        }
      }
      requestAnimationFrame(animate)
    }, 600)

    return () => {
      demo.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mousemove', onMouseMove)
      divider.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchmove', onTouchMove)
      clearTimeout(animTimer)
    }
  }, [])

  return (
    <div className="ba-demo-wrap">
      <div className="ba-demo" ref={demoRef}>
        <div className="ba-before">
          <span className="ba-tag ba-tag-b">BEFORE</span>
        </div>
        <div className="ba-after" ref={afterPanelRef}>
          <span className="ba-tag ba-tag-a">AFTER</span>
        </div>
        <div className="ba-divider" ref={dividerRef}>
          <div className="ba-handle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 3,12 9,6" />
              <polyline points="15,6 21,12 15,18" />
            </svg>
          </div>
        </div>
      </div>
      <div className="ba-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="12" x2="16" y2="12" />
          <polyline points="5,9 2,12 5,15" />
          <polyline points="19,9 22,12 19,15" />
        </svg>
        Drag the handle to see the difference
      </div>
    </div>
  )
}

export function GhostCameraVisual() {
  return (
    <div className="ghost-phone-wrap">
      <div className="ghost-phone">
        <div className="ghost-notch" />
        <div className="ghost-screen">
          <div className="ghost-live-feed" />
          <div className="ghost-overlay" />
          <div className="ghost-reticle">
            <span className="rct rct-tl" />
            <span className="rct rct-tr" />
            <span className="rct rct-bl" />
            <span className="rct rct-br" />
          </div>
          <div className="ghost-top-bar">
            <div className="ios-icon-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" />
              </svg>
            </div>
            <div className="ios-icon-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </div>
          </div>
          <div className="ghost-bottom-area">
            <div className="ghost-zoom-row">
              <div className="ios-zoom-pill">1×</div>
            </div>
            <div className="ghost-bottom-bar">
              <div className="ios-thumb" />
              <div className="ios-shutter" />
              <div className="ios-flip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" />
                  <path d="M23 20v-6h-6" />
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
