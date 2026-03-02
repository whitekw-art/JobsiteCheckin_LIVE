import type { Metadata } from 'next'
import StripePricingTable from './StripePricingTable'

export const metadata: Metadata = {
  title: 'Choose Your Plan | Project Check-In',
}

interface PricingPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams
  const email = params.email ?? ''

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
          <p className="text-gray-600">Start free. Upgrade anytime.</p>
        </div>
        <StripePricingTable email={email} />
      </div>
    </div>
  )
}
