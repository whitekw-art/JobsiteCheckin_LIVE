import type { Metadata } from 'next'
import LandingPage from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
  description:
    'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for contractors.',
  alternates: { canonical: 'https://projectcheckin.com/' },
  openGraph: {
    title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
    description:
      'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for contractors.',
    url: 'https://projectcheckin.com/',
    siteName: 'ProjectCheckin',
  },
}

export default function HomePage() {
  return <LandingPage />
}
