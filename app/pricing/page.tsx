import type { Metadata } from 'next'
import StripePricingTable from './StripePricingTable'
import FreePlanButton from './FreePlanButton'

export const metadata: Metadata = {
  title: 'Choose Your Plan | ProjectCheckin',
}

interface PricingPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function PricingPage({ searchParams }: PricingPageProps) {
  const params = await searchParams
  const email = params.email ?? ''

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #F0F9FF 0%, #E0F2FE 50%, #F0F9FF 100%)',
      padding: '48px 16px 64px',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Back nav */}
        <div style={{ marginBottom: '12px' }}>
          <a href="/" style={{ fontSize: '13px', color: '#4B7A94', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to home
          </a>
          <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontStyle: 'italic' }}>
            Use the links on this page to navigate — avoid using your browser&rsquo;s back button during setup.
          </p>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Brand mark */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: '#0EA5E9', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0C4A6E', letterSpacing: '-0.01em' }}>
              ProjectCheckin
            </span>
          </div>

          <h1 style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#0C4A6E',
            letterSpacing: '-0.03em',
            marginBottom: '8px',
            lineHeight: 1.2,
          }}>
            Choose your plan
          </h1>
          <p style={{ fontSize: '15px', color: '#4B7A94', lineHeight: 1.6 }}>
            Start free and upgrade when you&rsquo;re ready. No contracts. Cancel anytime.
          </p>

          {/* Trust strip */}
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
            {[
              '✓ No credit card required',
              '✓ Free forever plan',
              '✓ Unlimited team members on all plans',
            ].map(label => (
              <span key={label} style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#0284C7',
                background: 'rgba(14,165,233,0.08)',
                border: '1px solid rgba(14,165,233,0.2)',
                borderRadius: '100px',
                padding: '4px 12px',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Stripe Pricing Table */}
        <StripePricingTable key={email} email={email} />

        {/* Free plan CTA */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <FreePlanButton />
        </div>

      </div>
    </div>
  )
}
