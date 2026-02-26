'use client'

import { MouseEvent } from 'react'

interface JobWebsiteLinkProps {
  checkInId: string
  href: string
  label: string
  className?: string
}

export function JobWebsiteLink({ checkInId, href, label, className }: JobWebsiteLinkProps) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    try {
      await fetch('/api/checkins/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId,
          eventType: 'website_click',
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
      className={className || "text-blue-600 hover:underline inline-flex items-center min-h-[44px] py-2"}
    >
      {label}
    </a>
  )
}

