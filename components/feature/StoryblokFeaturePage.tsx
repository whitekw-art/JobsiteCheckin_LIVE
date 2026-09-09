'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'
import JobPageMockupVisual from './JobPageMockupVisual'
import { PortfolioBrowserMockupVisual, PortfolioPhoneMockupVisual } from './PortfolioVisuals'
import { BeforeAfterSliderVisual, GhostCameraVisual } from './BeforeAfterVisuals'
import { MessageTabs, ReviewImessageVisual, ReviewMessageCardVisual, useMessageTab } from './ReviewRequestVisuals'
import { AICopywriterOutputPreview } from './AICopywriterVisuals'
import { ReviewAgentImessageExtended, ReviewAgentImessageShort } from './ReviewAgentVisuals'

/**
 * Renders a feature page (e.g. /features/gbp-post-generator) from Storyblok,
 * reusing styles/features.css so it matches the live pages. TEST ONLY —
 * rendered by /feature-preview/[slug]. No live route uses this.
 */

type Editable = { _uid: string; _editable?: string }

export type FpHeroBlock = Editable & TextStyleFields & {
  component: 'fp_hero'
  heading: string
  body?: string
  button_text?: string
  button_url?: string
  fine_print?: string
  definition_label?: string
  definition_body?: string
  image?: { filename?: string | null }
  image_alt?: string
  visual_type?: string
  mockup_url?: string
  mockup_photo?: { filename?: string | null }
  mockup_chip?: string
  mockup_title?: string
  mockup_meta?: string
  mockup_desc?: string
  button_bg_color?: string
  button_text_color?: string
  definition_border_color?: string
  definition_bg_color?: string
}

export type FpStepBlock = Editable & TextStyleFields & {
  component: 'fp_step'
  number: string
  heading: string
  body?: string
  button_hint?: string
  number_bg_color?: string
}

export type FpHowSectionBlock = Editable & {
  component: 'fp_how_section'
  label?: string
  heading: string
  steps?: FpStepBlock[]
}

export type FpBenefitBlock = Editable & TextStyleFields & {
  component: 'fp_benefit'
  number: string
  title: string
  teaser?: string
  body?: string
  number_color?: string
}

export type FpBenefitsSectionBlock = Editable & {
  component: 'fp_benefits_section'
  label?: string
  heading: string
  items?: FpBenefitBlock[]
}

export type FpMidCtaBlock = Editable & TextStyleFields & {
  component: 'fp_mid_cta'
  text: string
  button_text?: string
  button_url?: string
  fine_print?: string
  button_bg_color?: string
  bg_color?: string
}

export type FpStatItemBlock = Editable & TextStyleFields & {
  component: 'fp_stat_item'
  number: string
  unit?: string
  description?: string
  source?: string
}

export type FpStatStripBlock = Editable & {
  component: 'fp_stat_strip'
  stats?: FpStatItemBlock[]
  columns?: string
}

export type LpFaqItemBlock = Editable & TextStyleFields & {
  component: 'lp_faq_item'
  question: string
  answer: string
}

export type FpFaqSectionBlock = Editable & {
  component: 'fp_faq_section'
  label?: string
  heading: string
  items?: LpFaqItemBlock[]
}

export type FpExploreLinkBlock = Editable & {
  component: 'fp_explore_link'
  label: string
  url: string
}

export type FpExploreSectionBlock = Editable & {
  component: 'fp_explore_section'
  label?: string
  links?: FpExploreLinkBlock[]
}

export type FpAiHeroBlock = Editable & TextStyleFields & {
  component: 'fp_ai_hero'
  heading_line1?: string
  heading_line2?: string
  heading_line3?: string
  body?: string
  definition_label?: string
  definition_body?: string
  visual_type?: string
}

export type FpConvoSectionBlock = Editable & {
  component: 'fp_convo_section'
  label?: string
  heading: string
  body?: string
  items?: FpValueItemBlock[]
}

export type FpMsgCompareItemBlock = Editable & {
  component: 'fp_msg_compare_item'
  header: string
  message: string
  verdict?: string
  style?: string
}

export type FpMsgCompareSectionBlock = Editable & {
  component: 'fp_msg_compare_section'
  label?: string
  heading: string
  columns?: FpMsgCompareItemBlock[]
}

export type FpHiwStepBlock = Editable & {
  component: 'fp_hiw_step'
  number: string
  title: string
  body?: string
}

export type FpHiwSectionBlock = Editable & {
  component: 'fp_hiw_section'
  label?: string
  heading: string
  intro?: string
  steps?: FpHiwStepBlock[]
}

export type FpValueItemBlock = Editable & {
  component: 'fp_value_item'
  title: string
  body?: string
}

export type FpDetailSectionBlock = Editable & {
  component: 'fp_detail_section'
  label?: string
  heading: string
  intro?: string
  items?: FpValueItemBlock[]
  example_job_title?: string
  example_submitted_by?: string
  example_body?: string
  example_tags?: string
  example_checks?: string
}

export type FpCompareItemBlock = Editable & {
  component: 'fp_compare_item'
  title: string
  body?: string
}

export type FpCompareSectionBlock = Editable & {
  component: 'fp_compare_section'
  label?: string
  heading: string
  without_label?: string
  without_items?: FpCompareItemBlock[]
  with_label?: string
  with_items?: FpCompareItemBlock[]
}

export type FpMessageSectionBlock = Editable & TextStyleFields & {
  component: 'fp_message_section'
  badge?: string
  heading: string
  body?: string
  body2?: string
  body3?: string
}

export type FpGhostSectionBlock = Editable & TextStyleFields & {
  component: 'fp_ghost_section'
  badge?: string
  heading: string
  body?: string
  body2?: string
  body3?: string
}

export type FpDarkSectionBlock = Editable & TextStyleFields & {
  component: 'fp_dark_section'
  badge?: string
  heading: string
  body?: string
  body2?: string
  url_text?: string
  caption?: string
}

export type FpCtaBandBlock = Editable & TextStyleFields & {
  component: 'fp_cta_band'
  heading: string
  body?: string
  button_text?: string
  button_url?: string
  fine_print?: string
  button_bg_color?: string
  bg_color?: string
  text_color?: string
  layout?: string
}

export type FpBlock =
  | FpHeroBlock
  | FpHowSectionBlock
  | FpBenefitsSectionBlock
  | FpMidCtaBlock
  | FpStatStripBlock
  | FpFaqSectionBlock
  | FpExploreSectionBlock
  | FpCtaBandBlock
  | FpDarkSectionBlock
  | FpGhostSectionBlock
  | FpMessageSectionBlock
  | FpAiHeroBlock
  | FpHiwSectionBlock
  | FpDetailSectionBlock
  | FpCompareSectionBlock
  | FpConvoSectionBlock
  | FpMsgCompareSectionBlock

/** Only allow a plain CSS colour value through to an inline style. */
function safeColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  return /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%]+\)$|^var\(--[\w-]+\)$|^[a-z]+$/i.test(value.trim())
    ? value.trim()
    : undefined
}

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

function CtaLink({
  href,
  text,
  className,
  bgColor,
  textColor,
}: {
  href: string
  text: string
  className: string
  bgColor?: string
  textColor?: string
}) {
  const safe = safeHref(href)
  const style = {
    background: safeColor(bgColor),
    color: safeColor(textColor),
    borderColor: safeColor(bgColor),
  }
  return safe.startsWith('/') ? (
    <Link href={safe} className={className} style={style}>
      {text}
    </Link>
  ) : (
    <a href={safe} className={className} style={style} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  )
}

const plusIcon = (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

function Hero({ block }: { block: FpHeroBlock }) {
  return (
    <section {...editableProps(block)}>
      <div className="hero-wrap">
        <div className="hero-copy">
          <h1 style={headingStyle(block)}>{block.heading}</h1>
          {block.body && <p style={bodyStyle(block)}>{block.body}</p>}
          <div className="hero-cta">
            <CtaLink
              href={block.button_url ?? '/auth/register'}
              text={block.button_text || 'Start Free'}
              className="btn-primary"
              bgColor={block.button_bg_color}
              textColor={block.button_text_color}
            />
            {block.fine_print && <span className="hero-fine">{block.fine_print}</span>}
          </div>
          {block.definition_body && (
            <div
              className="hero-define"
              style={{
                borderLeftColor: safeColor(block.definition_border_color) ?? 'var(--google-blue)',
                background: safeColor(block.definition_bg_color),
              }}
            >
              {block.definition_label && <strong>{block.definition_label}</strong>} {block.definition_body}
            </div>
          )}
        </div>
        {block.visual_type === 'job_page_mockup' ? (
          <JobPageMockupVisual
            url={block.mockup_url}
            photo={block.mockup_photo?.filename ?? undefined}
            chip={block.mockup_chip}
            title={block.mockup_title}
            meta={block.mockup_meta}
            desc={block.mockup_desc}
          />
        ) : block.visual_type === 'portfolio_browser_mockup' ? (
          <PortfolioBrowserMockupVisual />
        ) : block.visual_type === 'before_after_slider' ? (
          <BeforeAfterSliderVisual />
        ) : block.visual_type === 'imessage_card' ? (
          <ReviewImessageVisual />
        ) : (
          block.image?.filename && (
            <img
              src={block.image.filename}
              alt={block.image_alt ?? ''}
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          )
        )}
      </div>
    </section>
  )
}

function AiHero({ block }: { block: FpAiHeroBlock }) {
  return (
    <section className="hero-dark" {...editableProps(block)}>
      <div className="hero-dark-inner">
        <div>
          <h1 style={headingStyle(block)}>
            {block.heading_line1}
            <br />
            {block.heading_line2 && <em>{block.heading_line2}</em>}
            <br />
            {block.heading_line3}
          </h1>
          {block.body && (
            <p className="hero-dark-sub" style={bodyStyle(block)}>
              {block.body}
            </p>
          )}
          {block.definition_body && (
            <div className="hero-define-dark">
              {block.definition_label && <strong>{block.definition_label}</strong>} {block.definition_body}
            </div>
          )}
        </div>
        {block.visual_type === 'imessage_thread' ? (
          <ReviewAgentImessageShort />
        ) : (
          <AICopywriterOutputPreview />
        )}
      </div>
    </section>
  )
}

function ConvoSection({ block }: { block: FpConvoSectionBlock }) {
  const items = block.items ?? []
  return (
    <section className="convo-section" {...editableProps(block)}>
      <div className="convo-inner">
        <div>
          {block.label && (
            <div className="section-label" style={{ color: 'rgba(249,115,22,0.75)' }}>
              {block.label}
            </div>
          )}
          <h2 className="section-title" style={{ color: '#fff' }}>
            {block.heading}
          </h2>
          {block.body && (
            <p
              className="hiw-sub"
              style={{ color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem', maxWidth: 460, marginBottom: 36 }}
            >
              {block.body}
            </p>
          )}
          <ul className="value-list">
            {items.map((item) => (
              <li key={item._uid} {...editableProps(item)}>
                <div className="vl-bar" />
                <div className="vl-text" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <strong style={{ color: '#fff' }}>{item.title}</strong>
                  {item.body}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ReviewAgentImessageExtended />
      </div>
    </section>
  )
}

function MsgCompareSection({ block }: { block: FpMsgCompareSectionBlock }) {
  const columns = block.columns ?? []
  return (
    <div className="compare-section" {...editableProps(block)}>
      {block.label && <div className="section-label">{block.label}</div>}
      <h2 className="section-title">{block.heading}</h2>
      <div className="compare-grid">
        {columns.map((col) => (
          <div
            className={`compare-col ${col.style === 'personalized' ? 'personalized' : 'generic'}`}
            key={col._uid}
            {...editableProps(col)}
          >
            <div className="compare-col-header">{col.header}</div>
            <div className="compare-col-body">
              <div className="compare-msg">{col.message}</div>
              {col.verdict && <div className="compare-verdict">{col.verdict}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HiwSection({ block }: { block: FpHiwSectionBlock }) {
  const steps = block.steps ?? []
  return (
    <div className="hiw-section" {...editableProps(block)}>
      {block.label && <div className="section-label">{block.label}</div>}
      <h2 className="section-title">{block.heading}</h2>
      {block.intro && <p className="hiw-sub">{block.intro}</p>}
      <div className="step-cards">
        {steps.map((step) => (
          <div className="step-card" key={step._uid} {...editableProps(step)}>
            <div className="sc-num">{step.number}</div>
            <div className="sc-title">{step.title}</div>
            {step.body && <p className="sc-desc">{step.body}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailSection({ block }: { block: FpDetailSectionBlock }) {
  const items = block.items ?? []
  const tags = (block.example_tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  const checks = (block.example_checks ?? '')
    .split('\n')
    .map((c) => c.trim())
    .filter(Boolean)

  return (
    <section className="detail-section" {...editableProps(block)}>
      <div className="detail-inner">
        <div className="detail-copy">
          {block.label && <div className="section-label">{block.label}</div>}
          <h2 className="section-title">{block.heading}</h2>
          {block.intro && <p className="detail-sub">{block.intro}</p>}
          <ul className="value-list">
            {items.map((item) => (
              <li key={item._uid} {...editableProps(item)}>
                <div className="vl-bar" />
                <div className="vl-text">
                  <strong>{item.title}</strong>
                  {item.body}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="example-card">
          <div className="ec-header">
            <div className="ec-title">
              {block.example_job_title}
              {block.example_submitted_by && <span>{block.example_submitted_by}</span>}
            </div>
            <div className="ec-ai-label">AI Draft</div>
          </div>
          {block.example_body && <p className="ec-body">{block.example_body}</p>}
          {tags.length > 0 && (
            <div className="ec-tags">
              {tags.map((tag) => (
                <span className="ec-tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="ec-actions">
            <div className="ec-btn primary">Publish Job Page</div>
            <div className="ec-btn secondary">Edit Draft</div>
          </div>
          {checks.length > 0 && (
            <div className="publish-auto">
              <div className="publish-auto-label">Also applied automatically at publish</div>
              <div className="publish-auto-list">
                {checks.map((check) => (
                  <div className="publish-auto-item" key={check}>
                    <div className="publish-auto-check">✓</div>
                    {check}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CompareSection({ block }: { block: FpCompareSectionBlock }) {
  const without = block.without_items ?? []
  const withItems = block.with_items ?? []
  return (
    <div className="compare-section" {...editableProps(block)}>
      {block.label && <div className="section-label">{block.label}</div>}
      <h2 className="section-title">{block.heading}</h2>
      <div className="compare-grid">
        <div className="compare-col without">
          <div className="compare-col-label">{block.without_label || 'Without'}</div>
          {without.map((row) => (
            <div className="compare-row" key={row._uid} {...editableProps(row)}>
              <div className="cr-mark x">✕</div>
              <div className="cr-text">
                <strong>{row.title}</strong>
                {row.body}
              </div>
            </div>
          ))}
        </div>
        <div className="compare-col with">
          <div className="compare-col-label">{block.with_label || 'With'}</div>
          {withItems.map((row) => (
            <div className="compare-row" key={row._uid} {...editableProps(row)}>
              <div className="cr-mark chk">✓</div>
              <div className="cr-text">
                <strong>{row.title}</strong>
                {row.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HowSection({ block }: { block: FpHowSectionBlock }) {
  const steps = block.steps ?? []
  return (
    <section className="how-section" {...editableProps(block)}>
      <div className="how-inner">
        {block.label && <div className="section-label">{block.label}</div>}
        <div className="section-title">{block.heading}</div>
        <div className="steps">
          {steps.map((step, i) => (
            <div className="step" key={step._uid} {...editableProps(step)}>
              <div
              className={`step-num${i === 0 ? ' active' : ''}`}
              style={{ background: safeColor(step.number_bg_color) }}
            >
              {step.number}
            </div>
              <h3 style={headingStyle(step)}>{step.heading}</h3>
              {step.body && <p style={bodyStyle(step)}>{step.body}</p>}
              {step.button_hint && (
                <div className="step-button-hint">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  {step.button_hint}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BenefitsSection({ block }: { block: FpBenefitsSectionBlock }) {
  const [open, setOpen] = useState<number | null>(null)
  const items = block.items ?? []
  return (
    <section className="benefits-section" {...editableProps(block)}>
      <div className="benefits-inner">
        {block.label && <div className="section-label">{block.label}</div>}
        <div className="section-title" style={{ marginBottom: '40px' }}>
          {block.heading}
        </div>
        {items.map((b, i) => (
          <div className={`benefit-item${open === i ? ' open' : ''}`} key={b._uid} {...editableProps(b)}>
            <button className="benefit-btn" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span className="benefit-num" style={{ color: safeColor(b.number_color) }}>
                {b.number}
              </span>
              <span className="benefit-text">
                <span className="benefit-title" style={headingStyle(b)}>
                  {b.title}
                </span>
                {b.teaser && (
                  <span className="benefit-teaser" style={bodyStyle(b)}>
                    {b.teaser}
                  </span>
                )}
              </span>
              <span className="benefit-icon">{plusIcon}</span>
            </button>
            <div className="benefit-body" style={bodyStyle(b)}>
              {b.body}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function MidCta({ block }: { block: FpMidCtaBlock }) {
  return (
    <div className="mid-cta" style={{ background: safeColor(block.bg_color) }} {...editableProps(block)}>
      <p style={headingStyle(block)}>{block.text}</p>
      <CtaLink
        href={block.button_url ?? '/auth/register'}
        text={block.button_text || 'Start Free'}
        className="btn-primary"
        bgColor={block.button_bg_color}
      />
      {block.fine_print && <span className="hero-fine">{block.fine_print}</span>}
    </div>
  )
}

function StatStrip({ block }: { block: FpStatStripBlock }) {
  const stats = block.stats ?? []

  if (block.columns === '3') {
    return (
      <div className="stat-strip-3" {...editableProps(block)}>
        <div className="stat-strip-3-inner">
          {stats.map((s) => (
            <div key={s._uid} {...editableProps(s)}>
              <div className="stat-number" style={headingStyle(s)}>
                <em>{s.number}</em>
                {s.unit}
              </div>
              {s.description && (
                <div className="stat-desc" style={bodyStyle(s)}>
                  {s.description}
                </div>
              )}
              {s.source && <div className="stat-source">{s.source}</div>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="stat-strip" {...editableProps(block)}>
      {stats.map((s, i) => (
        <Fragment key={s._uid}>
          <div {...editableProps(s)}>
            <div className="stat-number" style={headingStyle(s)}>
              <em>{s.number}</em>
              {s.unit}
            </div>
            {s.description && (
              <div className="stat-desc" style={bodyStyle(s)}>
                {s.description}
              </div>
            )}
            {s.source && <div className="stat-source">{s.source}</div>}
          </div>
          {i < stats.length - 1 && <div className="stat-divider" />}
        </Fragment>
      ))}
    </div>
  )
}

function FaqSection({ block }: { block: FpFaqSectionBlock }) {
  const [open, setOpen] = useState<number | null>(null)
  const items = block.items ?? []
  return (
    <section className="faq-section" {...editableProps(block)}>
      {block.label && <div className="section-label">{block.label}</div>}
      <h2 className="section-title">{block.heading}</h2>
      <div className="faq-list">
        {items.map((f, i) => (
          <div className={`faq-item${open === i ? ' open' : ''}`} key={f._uid} {...editableProps(f)}>
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
              <span style={headingStyle(f)}>{f.question}</span>
              <span className="faq-icon">{plusIcon}</span>
            </button>
            <div className="faq-a" style={bodyStyle(f)}>
              {f.answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ExploreSection({ block }: { block: FpExploreSectionBlock }) {
  const links = block.links ?? []
  return (
    <div className="explore-strip" {...editableProps(block)}>
      <div className="explore-inner">
        {block.label && <div className="explore-label">{block.label}</div>}
        <div className="explore-links">
          {links.map((link) => (
            <Link href={safeHref(link.url)} className="explore-link" key={link._uid} {...editableProps(link)}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageSection({ block }: { block: FpMessageSectionBlock }) {
  const [activeTab, setActiveTab] = useMessageTab()
  return (
    <section className="rr-msg-section" {...editableProps(block)}>
      <div className="rr-msg-inner">
        <div className="rr-msg-copy">
          {block.badge && <div className="rr-msg-badge">{block.badge}</div>}
          <h2 style={headingStyle(block)}>{block.heading}</h2>
          {block.body && <p style={bodyStyle(block)}>{block.body}</p>}
          {block.body2 && <p style={bodyStyle(block)}>{block.body2}</p>}
          {block.body3 && <p style={bodyStyle(block)}>{block.body3}</p>}
          <MessageTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <ReviewMessageCardVisual activeTab={activeTab} />
      </div>
    </section>
  )
}

function GhostSection({ block }: { block: FpGhostSectionBlock }) {
  return (
    <section className="ghost-section" {...editableProps(block)}>
      <div className="ghost-inner">
        <div className="ghost-copy">
          {block.badge && <div className="ghost-badge">{block.badge}</div>}
          <h2 style={headingStyle(block)}>{block.heading}</h2>
          {block.body && <p style={bodyStyle(block)}>{block.body}</p>}
          {block.body2 && <p style={bodyStyle(block)}>{block.body2}</p>}
          {block.body3 && <p style={bodyStyle(block)}>{block.body3}</p>}
        </div>
        <GhostCameraVisual />
      </div>
    </section>
  )
}

function DarkSection({ block }: { block: FpDarkSectionBlock }) {
  return (
    <section className="port-section" {...editableProps(block)}>
      <div className="port-inner">
        <div className="port-copy">
          {block.badge && <div className="port-badge">{block.badge}</div>}
          <h2 style={headingStyle(block)}>{block.heading}</h2>
          {block.body && <p style={bodyStyle(block)}>{block.body}</p>}
          {block.body2 && <p style={bodyStyle(block)}>{block.body2}</p>}
          {block.url_text && (
            <div className="port-url">
              <div className="port-url-dot" />
              <span className="port-url-text">{block.url_text}</span>
            </div>
          )}
        </div>
        <PortfolioPhoneMockupVisual caption={block.caption} />
      </div>
    </section>
  )
}

function CtaBand({ block }: { block: FpCtaBandBlock }) {
  const heading = (
    <h2 style={{ ...headingStyle(block), color: safeColor(block.text_color) ?? headingStyle(block).color }}>
      {block.heading}
    </h2>
  )
  const body = block.body && <p style={bodyStyle(block)}>{block.body}</p>

  if (block.layout === 'link_only') {
    return (
      <section
        className="cta-band"
        style={{ background: safeColor(block.bg_color), color: safeColor(block.text_color) }}
        {...editableProps(block)}
      >
        <div className="cta-inner">
          {heading}
          {body}
          {block.button_text && (
            <div className="cta-fine">
              <a href={safeHref(block.button_url)}>{block.button_text}</a>
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section
      className="cta-band"
      style={{ background: safeColor(block.bg_color), color: safeColor(block.text_color) }}
      {...editableProps(block)}
    >
      {heading}
      {body}
      <CtaLink
        href={block.button_url ?? '/auth/register'}
        text={block.button_text || 'Start Free'}
        className="btn-primary"
        bgColor={block.button_bg_color}
      />
      {block.fine_print && <div className="cta-fine">{block.fine_print}</div>}
    </section>
  )
}

export default function StoryblokFeaturePage({
  breadcrumbLabel,
  sections,
  darkBreadcrumb,
}: {
  breadcrumbLabel?: string
  sections: FpBlock[]
  darkBreadcrumb?: boolean
}) {
  return (
    <>
      <div className={darkBreadcrumb ? 'breadcrumb-dark' : 'breadcrumb'}>
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="current">{breadcrumbLabel}</span>
      </div>

      {sections.map((block) => {
        if (block.component === 'fp_hero') return <Hero block={block} key={block._uid} />
        if (block.component === 'fp_how_section') return <HowSection block={block} key={block._uid} />
        if (block.component === 'fp_benefits_section') return <BenefitsSection block={block} key={block._uid} />
        if (block.component === 'fp_mid_cta') return <MidCta block={block} key={block._uid} />
        if (block.component === 'fp_stat_strip') return <StatStrip block={block} key={block._uid} />
        if (block.component === 'fp_faq_section') return <FaqSection block={block} key={block._uid} />
        if (block.component === 'fp_explore_section') return <ExploreSection block={block} key={block._uid} />
        if (block.component === 'fp_cta_band') return <CtaBand block={block} key={block._uid} />
        if (block.component === 'fp_dark_section') return <DarkSection block={block} key={block._uid} />
        if (block.component === 'fp_ghost_section') return <GhostSection block={block} key={block._uid} />
        if (block.component === 'fp_message_section') return <MessageSection block={block} key={block._uid} />
        if (block.component === 'fp_ai_hero') return <AiHero block={block} key={block._uid} />
        if (block.component === 'fp_hiw_section') return <HiwSection block={block} key={block._uid} />
        if (block.component === 'fp_detail_section') return <DetailSection block={block} key={block._uid} />
        if (block.component === 'fp_compare_section') return <CompareSection block={block} key={block._uid} />
        if (block.component === 'fp_convo_section') return <ConvoSection block={block} key={block._uid} />
        if (block.component === 'fp_msg_compare_section')
          return <MsgCompareSection block={block} key={block._uid} />
        return null
      })}

      <footer className="feat-footer">
        <Link href="/" className="footer-brand">
          ProjectCheckin
        </Link>
        <div className="footer-links">
          <Link href="/pricing">Pricing</Link>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </div>
      </footer>
    </>
  )
}
