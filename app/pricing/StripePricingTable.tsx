'use client'

import Script from 'next/script'
import { useEffect } from 'react'

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'stripe-pricing-table': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        'pricing-table-id'?: string
        'publishable-key'?: string
        'customer-email'?: string
      }
    }
  }
}

export default function StripePricingTable({ email }: { email?: string }) {
  useEffect(() => {
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i)
        if (key && key.toLowerCase().includes('stripe')) sessionStorage.removeItem(key)
      }
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.toLowerCase().includes('stripe')) localStorage.removeItem(key)
      }
    } catch {
      // storage API unavailable (private browsing, etc.)
    }
  }, [email])

  return (
    <>
      <Script
        async
        src="https://js.stripe.com/v3/pricing-table.js"
        strategy="afterInteractive"
      />
      <stripe-pricing-table
        pricing-table-id={process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ID}
        publishable-key={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}
        customer-email={email}
      />
    </>
  )
}
