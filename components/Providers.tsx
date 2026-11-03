'use client'

import { SessionProvider } from 'next-auth/react'
import { PostHogProvider } from './PostHogProvider'
import SessionActivity from './SessionActivity'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <SessionProvider>
        <SessionActivity />
        {children}
      </SessionProvider>
    </PostHogProvider>
  )
}