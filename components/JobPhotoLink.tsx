'use client'

import { MouseEvent, ReactNode } from 'react'

interface JobPhotoLinkProps {
  checkInId: string
  href: string
  label: ReactNode
  metadata?: string
}

export function JobPhotoLink({
  checkInId,
  href,
  label,
  metadata,
}: JobPhotoLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    try {
      const payload = JSON.stringify({
        checkInId,
        eventType: 'PHOTO_CLICK',
        metadata: metadata || null,
      })

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' })
        navigator.sendBeacon('/api/checkins/events', blob)
      } else {
        fetch('/api/checkins/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {}

    window.open(href, '_blank', 'noopener,noreferrer')
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="text-blue-600 hover:underline"
    >
      {label}
    </a>
  )
}
