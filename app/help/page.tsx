'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'

function ChevIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, marginLeft: 'auto', color: 'var(--t3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// Top-level collapsible section — plain document style, no card/background.
function HelpSection({
  title, sub, defaultOpen = false, children,
}: { title: string; sub: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '20px 0', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div>
          <div style={{ fontSize: 16.5, fontWeight: 700, color: 'var(--t1)' }}>{title}</div>
          <div style={{ fontSize: 12.5, color: 'var(--t3)', marginTop: 2 }}>{sub}</div>
        </div>
        <ChevIcon open={open} />
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .25s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingBottom: 24 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

// Nested collapsible subsection (h3-level) — used inside Billing & Plans.
function HelpSubsection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 0, margin: '20px 0 0', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--t1)' }}>{title}</span>
        <span style={{ marginLeft: 'auto' }}><ChevIconSmall open={open} /></span>
      </button>
      <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .22s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ paddingTop: 8 }}>{children}</div>
        </div>
      </div>
    </div>
  )
}

function ChevIconSmall({ open }: { open: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: 'var(--t3)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

const p: React.CSSProperties = { fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 14px' }
const pLast: React.CSSProperties = { ...p, marginBottom: 0 }
const link: React.CSSProperties = { color: 'var(--sky-text)', textDecoration: 'underline' }
const strongC: React.CSSProperties = { color: 'var(--t1)' }

export default function HelpPage() {
  return (
    <DashboardShell title="Help & Support">
      <div style={{ maxWidth: 700 }}>
        <p style={{ fontSize: 13.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Guides, support contact, and answers about your account and billing.
        </p>

        <HelpSection title="Guides" sub="Step-by-step setup instructions" defaultOpen>
          <Link href="/help/guides/wordpress-publish" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            WordPress Publishing Guide
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Publish jobs straight into your WordPress site — as new posts, or fed into pages you already have. Includes how to get the most SEO value.
          </p>
          <Link href="/help/guides/widget-install" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            Widget Installation Guide
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Add your jobs gallery to WordPress, Squarespace, Webflow, Wix, or a plain HTML site.
          </p>
          <Link href="/help/guides/cname-hosting" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            CNAME Subdomain Hosting Guide
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Give your job pages an address on your own domain, with DNS setup steps per registrar.
          </p>
          <Link href="/help/guides/gsc-setup" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            Set Up Google Search Console
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Don&apos;t have Search Console yet? Create it and verify your website, with step-by-step instructions for WordPress, Squarespace, Wix, GoDaddy, and more.
          </p>
          <Link href="/help/guides/gsc-connect" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            Connect Google Search Console
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 16px', lineHeight: 1.6 }}>
            Link your Search Console to ProjectCheckin so your real search clicks and impressions show on your Reporting page.
          </p>
          <Link href="/help/guides/gbp-connect" style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: 'var(--sky-text)', textDecoration: 'none', marginBottom: 2 }}>
            Connect Your Google Business Profile
          </Link>
          <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: 0, lineHeight: 1.6 }}>
            Send finished jobs straight to your Google listing. Covers picking the right Google account, claiming a profile you don&apos;t have yet, and getting one back from whoever set it up.
          </p>
        </HelpSection>

        <HelpSection title="Support" sub="Reach the ProjectCheckin team">
          <p style={pLast}>
            Email us at <a href="mailto:support@projectcheckin.com" style={link}>support@projectcheckin.com</a>. We read every message and get back to you as soon as we can.
          </p>
        </HelpSection>

        <HelpSection title="Your Account" sub="What each Account tab is for">
          <p style={p}><strong style={strongC}>General</strong> — update your business name, phone, email, and website.</p>
          <p style={p}><strong style={strongC}>Team</strong> — invite team members and manage who&apos;s on your account.</p>
          <p style={p}><strong style={strongC}>Connections</strong> — set up Google Business, your review link, and website integration.</p>
          <p style={pLast}><strong style={strongC}>Billing</strong> — view your plan, update your payment method, or cancel.</p>
        </HelpSection>

        <HelpSection title="Billing & Plans" sub="Subscriptions, cancellations, and refunds" defaultOpen>
          <p style={p}>
            ProjectCheckin has four plans — Free, Pro, Elite, and Titan — priced from $0 to $598/month depending on features and monthly photo volume. See full plan details on the <Link href="/pricing" style={link}>Pricing page</Link>.
          </p>

          <HelpSubsection title="Updating your payment method or canceling">
            <p style={pLast}>
              Go to <strong style={strongC}>Account → Billing</strong> and click <strong style={strongC}>Manage Subscription</strong>. This opens Stripe&apos;s secure billing portal, where you can update your card or cancel.
            </p>
          </HelpSubsection>

          <HelpSubsection title="What happens when you cancel">
            <p style={p}>
              Cancellation takes effect at the end of your current billing period — you keep full access until then, and you won&apos;t be charged again after that. No partial refund is issued for the unused portion of the period.
            </p>
            <p style={pLast}>
              Once your plan ends, published job pages beyond the Free plan&apos;s limit are unpublished and higher-tier features turn off. Nothing is deleted — your jobs, photos, and account data are preserved.
            </p>
          </HelpSubsection>

          <HelpSubsection title="Re-enrolling after canceling">
            <p style={pLast}>
              Resubscribing restores everything instantly — unpublished pages and features come back right away. If you had a discounted rate (a founding-member rate or a promotional offer), re-enrolling is priced at whatever&apos;s being offered at that time — the same discount isn&apos;t guaranteed to still be available. You&apos;ll always see a clear warning about this before you confirm a cancellation.
            </p>
          </HelpSubsection>

          <HelpSubsection title="Refunds">
            <p style={pLast}>
              We don&apos;t offer refunds for unused time. The one exception is our <strong style={strongC}>90-Day Results Guarantee</strong>: if you complete at least 3 job check-ins per week for 90 consecutive days and your dashboard shows no measurable traffic activity, email <a href="mailto:support@projectcheckin.com" style={link}>support@projectcheckin.com</a> within 30 days of finishing that period and we&apos;ll refund your last 2 months of subscription fees. Full terms are in our <Link href="/terms" style={link}>Terms of Service</Link>.
            </p>
          </HelpSubsection>

          <p style={{ fontSize: 12.5, color: 'var(--t3)', fontStyle: 'italic', margin: '20px 0 0' }}>
            Only your business&apos;s owner can manage billing.
          </p>
        </HelpSection>
      </div>
    </DashboardShell>
  )
}
