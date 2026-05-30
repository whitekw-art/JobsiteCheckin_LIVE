import type { Metadata } from 'next'
import PricingPage from '@/components/PricingPage'

export const metadata: Metadata = {
  title: 'Choose Your Plan | ProjectCheckin',
  description:
    'Free to start. Paid plans unlock Google Business Profile posting, AI-generated job descriptions, review requests, and more. Plans from $49.50/mo.',
  alternates: {
    canonical: 'https://projectcheckin.com/pricing',
  },
  openGraph: {
    title: 'Choose Your Plan | ProjectCheckin',
    description:
      'Free to start. Paid plans unlock Google Business Profile posting, AI-generated job descriptions, review requests, and more. Plans from $49.50/mo.',
    url: 'https://projectcheckin.com/pricing',
    siteName: 'ProjectCheckin',
    type: 'website',
    images: [{ url: '/og/og-default-v1.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Choose Your Plan | ProjectCheckin',
    description:
      'Free to start. Paid plans unlock Google Business Profile posting, AI-generated job descriptions, review requests, and more. Plans from $49.50/mo.',
    images: ['/og/og-default-v1.png'],
  },
}

export default function PricingRoutePage() {
  return <PricingPage />
}
