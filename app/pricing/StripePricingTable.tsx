'use client'

import Script from 'next/script'
import { useLayoutEffect } from 'react'

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
  useLayoutEffect(() => {
    try {
      // Clear all sessionStorage — tab-scoped, safe to clear entirely
      sessionStorage.clear()
      // Clear Stripe-related localStorage entries
      const keysToRemove: string[] = []
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key) {
          const lower = key.toLowerCase()
          if (lower.includes('stripe') || lower.includes('checkout') || lower.includes('pricing')) {
            keysToRemove.push(key)
          }
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k))
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
