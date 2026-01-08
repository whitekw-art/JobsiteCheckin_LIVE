'use client'

import { MouseEvent } from 'react'

interface JobPhoneLinkProps {
  checkInId: string
  href: string
  label: string
}

export function JobPhoneLink({ checkInId, href, label }: JobPhoneLinkProps) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    try {
      await fetch('/api/checkins/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId,
          eventType: 'PHONE_CLICK',
        }),
        keepalive: true,
      })
    } catch {
      // Ignore errors; do not block dialing
    }
  }

  return (
    <a
      href={href}
      onClick={handleClick}
      className="text-blue-600 hover:underline"
    >
      {label}
    </a>
  )
}

