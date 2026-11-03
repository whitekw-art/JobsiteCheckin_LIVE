'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SESSION_REFRESH_THROTTLE_MS } from '@/lib/sessionPolicy'

// Makes the 30-minute idle limit count from the person's last tap, keystroke
// or scroll. NextAuth re-issues the session cookie only when the browser asks
// for the session (a full page load, or the tab coming back into view); API
// requests never extend it. So while a signed-in person is active, this asks
// for the session at most once every 2 minutes. It is not a timer: with no
// activity it sends nothing, and the session expires on schedule.
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const

export default function SessionActivity() {
  const { status } = useSession()

  useEffect(() => {
    if (status !== 'authenticated') return
    // SessionProvider has just fetched the session, which re-issued the cookie.
    let lastRefresh = Date.now()

    const onActivity = () => {
      const now = Date.now()
      if (now - lastRefresh < SESSION_REFRESH_THROTTLE_MS) return
      lastRefresh = now
      fetch('/api/auth/session', { credentials: 'same-origin', cache: 'no-store' }).catch(() => {})
    }

    for (const type of ACTIVITY_EVENTS) {
      window.addEventListener(type, onActivity, { passive: true, capture: true })
    }
    return () => {
      for (const type of ACTIVITY_EVENTS) {
        window.removeEventListener(type, onActivity, { capture: true })
      }
    }
  }, [status])

  return null
}
