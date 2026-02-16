'use client'

import { MouseEvent } from 'react'

interface JobWebsiteLinkProps {
  checkInId: string
  href: string
  label: string
}

export function JobWebsiteLink({ checkInId, href, label }: JobWebsiteLinkProps) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    try {
      await fetch('/api/checkins/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId,
          eventType: 'WEBSITE_CLICK',
        }),
        keepalive: true,
      })
    } catch {
      // Ignore errors; do not block navigation
    }
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="text-blue-600 hover:underline inline-flex items-center min-h-[44px] py-2"
    >
      {label}
    </a>
  )
}

