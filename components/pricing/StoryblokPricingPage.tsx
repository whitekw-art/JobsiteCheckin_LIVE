'use client'

import { useState } from 'react'
import Link from 'next/link'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'
import type { FpCtaBandBlock, FpFaqSectionBlock } from '@/components/feature/StoryblokFeaturePage'

/**
 * Renders the pricing page (/pricing) from Storyblok, using pricing.css so it
 * matches the live page exactly. TEST ONLY — rendered by /pricing-preview.
 * No live route uses this.
 */

type Editable = { _uid: string; _editable?: string }

export type PpHeroBlock = Editable & TextStyleFields & {
  component: 'pp_hero'
  badge_text?: string
  heading_line1: string
  heading_line2?: string
  trust_text?: string
  fine_text?: string
}

export type PpPillItemBlock = Editable & {
  component: 'pp_pill_item'
  label: string
}

export type PpBaselineBlock = Editable & {
  component: 'pp_baseline'
  label?: string
  items?: PpPillItemBlock[]
}

export type PpFeatureItemBlock = Editable & {
  component: 'pp_feature_item'
  text: string
  new_badge?: boolean
}

export type PpTierBlock = Editable & {
  component: 'pp_tier'
  name: string
  price_monthly: string
  show_annual_toggle?: boolean
  price_annual?: string
  annual_total?: string
  annual_save?: string
  per_biz_text?: string
  was_text?: string
  tagline?: string
  popular?: boolean
  popular_badge_text?: string
  inherit_label?: string
  features?: PpFeatureItemBlock[]
}

export type PpPricingCardsBlock = Editable & {
  component: 'pp_pricing_cards'
  tiers?: PpTierBlock[]
  cta_label?: string
  cta_button_text?: string
  cta_button_url?: string
  cta_fine_bold?: string
  cta_fine_rest?: string
}

export type PpCompareCategoryBlock = Editable & {
  component: 'pp_compare_category'
  label: string
}

export type PpCompareRowBlock = Editable & {
  component: 'pp_compare_row'
  feature: string
  free_value?: string
  pro_value?: string
  elite_value?: string
  titan_value?: string
}

export type PpCompareSectionBlock = Editable & {
  component: 'pp_compare_section'
  rows?: (PpCompareCategoryBlock | PpCompareRowBlock)[]
}

export type PpFounderStripBlock = Editable & {
  component: 'pp_founder_strip'
  bold_text?: string
  body_text?: string
}

export type PpBlock =
  | PpHeroBlock
  | PpBaselineBlock
  | PpPricingCardsBlock
  | PpCompareSectionBlock
  | PpFounderStripBlock
  | FpFaqSectionBlock
  | FpCtaBandBlock

function safeHref(href: string | undefined): string {
  if (!href) return '#'
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (href.startsWith('#')) return href
  try {
    const url = new URL(href)
    if (url.protocol === 'http:' || url.protocol === 'https:') return href
  } catch {
    // Not a parseable absolute URL — fall through to the safe default.
  }
  return '#'
}

function Ck() {
  return (
    <svg viewBox="0 0 8 8" fill="none">
      <polyline points="1,4 3,6 7,2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Hero({ block }: { block: PpHeroBlock }) {
  return (
    <div className="hero" {...editableProps(block)}>
      {block.badge_text && (
        <div className="badge">
          <span className="dot" />
          {block.badge_text}
        </div>
      )}
      <h1 style={headingStyle(block)}>
        {block.heading_line1}
        {block.heading_line2 && (
          <>
            <br />
            {block.heading_line2}
          </>
        )}
      </h1>
      {block.trust_text && <p className="hero-trust" style={bodyStyle(block)}>{block.trust_text}</p>}
      {block.fine_text && <p className="hero-fine">{block.fine_text}</p>}
    </div>
  )
}

function Baseline({ block }: { block: PpBaselineBlock }) {
  const items = block.items ?? []
  return (
    <div className="baseline" {...editableProps(block)}>
      <div className="baseline-inner">
        {block.label && <span className="bl-label">{block.label}</span>}
        {items.map((item) => (
          <div key={item._uid} className="bl-pill" {...editableProps(item)}>
            <span className="ck"><Ck /></span>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function TierCard({ tier, billingAnnual }: { tier: PpTierBlock; billingAnnual: boolean }) {
  const showAnnual = tier.show_annual_toggle !== false
  const price = showAnnual && billingAnnual && tier.price_annual ? tier.price_annual : tier.price_monthly
  const features = tier.features ?? []
  return (
    <div className={`card${tier.popular ? ' popular' : ''}`} {...editableProps(tier)}>
      {tier.popular && <div className="pop-badge">{tier.popular_badge_text || 'Most Popular'}</div>}
      <div className="tier-name">{tier.name}</div>
      <div className="tier-price">
        {price}
        <sub>/mo</sub>
      </div>
      {tier.per_biz_text ? (
        <div className="tier-per-biz">{tier.per_biz_text}</div>
      ) : (
        <div style={{ height: 18 }} />
      )}
      {showAnnual && billingAnnual && tier.annual_total ? (
        <div className="tier-annual-note">
          billed {tier.annual_total}/yr {tier.annual_save && <>&middot; save {tier.annual_save}</>}
        </div>
      ) : (
        showAnnual && tier.was_text && <div className="tier-was">{tier.was_text}</div>
      )}
      {tier.tagline && <p className="tier-tagline">{tier.tagline}</p>}
      <div className="pc-feats">
        {tier.inherit_label && <div className="pf-inherit">{tier.inherit_label}</div>}
        {features.map((f) => (
          <div className="pf" key={f._uid} {...editableProps(f)}>
            <span className="pf-ck">&#10003;</span>
            {f.text}
            {f.new_badge && <span className="new-badge">New</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function PricingCards({ block }: { block: PpPricingCardsBlock }) {
  const [billingAnnual, setBillingAnnual] = useState(false)
  const tiers = block.tiers ?? []
  return (
    <div className="pricing-wrap" {...editableProps(block)}>
      <div className="billing-toggle">
        <button className={`bt-opt${!billingAnnual ? ' active' : ''}`} onClick={() => setBillingAnnual(false)}>
          Monthly
        </button>
        <button className={`bt-opt${billingAnnual ? ' active' : ''}`} onClick={() => setBillingAnnual(true)}>
          Annual
          <span className="bt-save">2 months free</span>
        </button>
      </div>

      <div className="cards">
        {tiers.map((tier) => (
          <TierCard tier={tier} billingAnnual={billingAnnual} key={tier._uid} />
        ))}
      </div>

      <div className="cta-block">
        {block.cta_label && <p className="cta-block-label">{block.cta_label}</p>}
        <Link href={safeHref(block.cta_button_url) === '#' ? '/auth/register' : safeHref(block.cta_button_url)} className="btn-orange">
          {block.cta_button_text || 'Start Free'}
        </Link>
        {(block.cta_fine_bold || block.cta_fine_rest) && (
          <p className="cta-block-fine">
            {block.cta_fine_bold && <strong>{block.cta_fine_bold} </strong>}
            {block.cta_fine_rest}
          </p>
        )}
      </div>
    </div>
  )
}

function compareCell(value: string | undefined) {
  if (!value || value === '—') return <span className="cdash">—</span>
  if (value === '✓') return <span className="ck">✓</span>
  return <span className="cv">{value}</span>
}

function CompareSection({ block }: { block: PpCompareSectionBlock }) {
  const [open, setOpen] = useState(false)
  const rows = block.rows ?? []
  return (
    <div className="compare-wrap" {...editableProps(block)}>
      <button className="compare-toggle-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Hide feature comparison' : 'Compare all features'}
        <svg
          className={`toggle-arrow${open ? ' open' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3,6 8,11 13,6" />
        </svg>
      </button>

      {open && (
        <div className="compare-table-wrap open">
          <table>
            <thead>
              <tr>
                <th className="col-feat">Feature</th>
                <th className="col-t">Free</th>
                <th className="col-t">Pro</th>
                <th className="col-t th-elite">Elite</th>
                <th className="col-t">Titan</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) =>
                row.component === 'pp_compare_category' ? (
                  <tr className="cat" key={row._uid} {...editableProps(row)}>
                    <td colSpan={5}>{row.label}</td>
                  </tr>
                ) : (
                  <tr key={row._uid} {...editableProps(row)}>
                    <td>{row.feature}</td>
                    <td>{compareCell(row.free_value)}</td>
                    <td>{compareCell(row.pro_value)}</td>
                    <td>{compareCell(row.elite_value)}</td>
                    <td>{compareCell(row.titan_value)}</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FounderStrip({ block }: { block: PpFounderStripBlock }) {
  return (
    <div className="founder" {...editableProps(block)}>
      <div className="founder-inner">
        <p>
          {block.bold_text && <strong>{block.bold_text} </strong>}
          {block.body_text}
        </p>
      </div>
    </div>
  )
}

function plusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function FaqSection({ block }: { block: FpFaqSectionBlock }) {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set([0]))
  const items = block.items ?? []
  const toggle = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }
  return (
    <section className="faq" {...editableProps(block)}>
      <h2>{block.heading}</h2>
      {items.map((item, i) => (
        <div key={item._uid} className={`faq-item${openFaqs.has(i) ? ' open' : ''}`} {...editableProps(item)}>
          <div className="faq-q" onClick={() => toggle(i)}>
            <span style={headingStyle(item)}>{item.question}</span>
            <svg className="faq-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {plusIcon()}
            </svg>
          </div>
          <div className="faq-a" style={bodyStyle(item)}>
            {item.answer}
          </div>
        </div>
      ))}
    </section>
  )
}

function CtaBand({ block }: { block: FpCtaBandBlock }) {
  return (
    <div className="cta-band" {...editableProps(block)}>
      <h2 style={headingStyle(block)}>{block.heading}</h2>
      {block.body && <p style={bodyStyle(block)}>{block.body}</p>}
      <Link href={block.button_url ? safeHref(block.button_url) : '/auth/register'} className="btn-orange">
        {block.button_text || 'Get Started Free'}
      </Link>
      {block.fine_print && <div className="fine">{block.fine_print}</div>}
    </div>
  )
}

export default function StoryblokPricingPage({ sections }: { sections: PpBlock[] }) {
  return (
    <div className="pc-pricing">
      {sections.map((block) => {
        if (block.component === 'pp_hero') return <Hero block={block} key={block._uid} />
        if (block.component === 'pp_baseline') return <Baseline block={block} key={block._uid} />
        if (block.component === 'pp_pricing_cards') return <PricingCards block={block} key={block._uid} />
        if (block.component === 'pp_compare_section') return <CompareSection block={block} key={block._uid} />
        if (block.component === 'pp_founder_strip') return <FounderStrip block={block} key={block._uid} />
        if (block.component === 'fp_faq_section') return <FaqSection block={block} key={block._uid} />
        if (block.component === 'fp_cta_band') return <CtaBand block={block} key={block._uid} />
        return null
      })}

      <footer>
        <div className="foot-brand">ProjectCheckin &copy; 2025</div>
        <div className="foot-links">
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </div>
  )
}
