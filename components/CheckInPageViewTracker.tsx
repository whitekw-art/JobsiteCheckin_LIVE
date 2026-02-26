'use client'

import { useEffect } from 'react'

interface CheckInPageViewTrackerProps {
  checkInId: string
}

export function CheckInPageViewTracker({ checkInId }: CheckInPageViewTrackerProps) {
  useEffect(() => {
    if (!checkInId) return

    ;(async () => {
      try {
        await fetch('/api/checkins/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            checkInId,
            eventType: 'page_view',
          }),
          keepalive: true,
        })
      } catch {
        // Swallow errors to keep page load unaffected
      }
    })()
  }, [checkInId])

  return null
}

