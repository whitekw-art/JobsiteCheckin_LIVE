import type { Metadata } from 'next'
import PricingPage from '@/components/PricingPage'

export const metadata: Metadata = {
  title: 'Choose Your Plan | ProjectCheckin',
}

export default function PricingRoutePage() {
  return <PricingPage />
}
