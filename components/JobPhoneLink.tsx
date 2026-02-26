'use client'

import { MouseEvent } from 'react'

interface JobPhoneLinkProps {
  checkInId: string
  href: string
  label: string
  className?: string
}

export function JobPhoneLink({ checkInId, href, label, className }: JobPhoneLinkProps) {
  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    try {
      await fetch('/api/checkins/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkInId,
          eventType: 'phone_click',
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
      className={className || "text-blue-600 hover:underline inline-flex items-center min-h-[44px] py-2"}
    >
      {label}
    </a>
  )
}

