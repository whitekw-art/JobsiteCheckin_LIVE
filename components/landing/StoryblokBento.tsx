'use client'

import { useState } from 'react'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'
import { BentoVisual } from './BentoVisuals'

/**
 * Renders the landing page's feature-tile section from Storyblok content,
 * reusing styles/landing.css so the result matches the live page.
 *
 * Client component because each tile keeps the live page's expand/collapse
 * behaviour. TEST ONLY — rendered by /landing-preview.
 */

export type BentoCardBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_bento_card'
  label?: string
  title: string
  description?: string
  bullets_left?: string
  bullets_right?: string
  footnote?: string
  visual?: string
  width?: string
  label_color?: string
  background_color?: string
  border_color?: string
  padding?: number | string
  min_height?: number | string
  radius?: number | string
}

export type BentoSectionBlock = {
  _uid: string
  _editable?: string
  component: 'lp_bento_section'
  eyebrow?: string
  heading: string
  intro?: string
  cards?: BentoCardBlock[]
  layout?: string
  gap?: number | string
  stretch?: boolean
}

/** A CMS number field arrives as a string; fall back when it is blank. */
const px = (value: number | string | undefined, fallback: number): number => {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(n) ? (n as number) : fallback
}

const lines = (value: string | undefined): string[] =>
  (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

/** Only allow a plain CSS colour value through to an inline style. */
function safeColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  return /^#[0-9a-f]{3,8}$|^rgba?\([\d\s.,%]+\)$|^[a-z]+$/i.test(value.trim())
    ? value.trim()
    : undefined
}

function BentoCard({ card }: { card: BentoCardBlock }) {
  const [open, setOpen] = useState(false)
  const left = lines(card.bullets_left)
  const right = lines(card.bullets_right)
  const hasDetail = Boolean(card.description) || left.length > 0 || right.length > 0

  return (
    <div
      className="bc"
      style={{
        background: safeColor(card.background_color),
        border: safeColor(card.border_color) ? `1px solid ${safeColor(card.border_color)}` : undefined,
        padding: px(card.padding, 32),
        borderRadius: px(card.radius, 18),
        minHeight: card.min_height ? px(card.min_height, 0) : undefined,
      }}
      {...editableProps(card)}
    >
      {card.label && (
        <span className="bc-label" style={{ color: safeColor(card.label_color) }}>
          {card.label}
        </span>
      )}

      <div className="bc-title-row">
        <div className="bc-title" style={headingStyle(card)}>
          {card.title}
        </div>
        {hasDetail && (
          <button
            type="button"
            className={`bc-toggle${open ? ' open' : ''}`}
            aria-expanded={open}
            aria-label={open ? 'Collapse details' : 'Expand details'}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 5l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {hasDetail && (
        <div className={`bc-collapse${open ? ' open' : ''}`}>
          {card.description && (
            <div className="bc-desc" style={bodyStyle(card)}>
              {card.description}
            </div>
          )}
          {(left.length > 0 || right.length > 0) && (
            <div className="bc-bullets">
              {left.length > 0 && (
                <ul className="bc-blist">
                  {left.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {right.length > 0 && (
                <ul className="bc-blist">
                  {right.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <BentoVisual kind={card.visual} />

      {card.footnote && (
        <p style={{ fontSize: 11, color: 'rgba(15,23,42,0.45)', marginTop: 10, marginBottom: 0 }}>
          {card.footnote}
        </p>
      )}
    </div>
  )
}

export default function StoryblokBento({ block }: { block: BentoSectionBlock }) {
  const cards = block.cards ?? []
  const packed = (block.layout ?? 'packed') === 'packed'
  const gap = px(block.gap, 24)
  const stretch = block.stretch !== false

  return (
    <section className="bento-section" {...editableProps(block)}>
      <div className="bento-head">
        {block.eyebrow && <span className="section-label">{block.eyebrow}</span>}
        <h2 className="section-h2">{block.heading}</h2>
        {block.intro && <p className="bento-sub">{block.intro}</p>}
      </div>

      {/*
        A real grid rather than two fixed columns: tiles fill left to right in
        exactly the order they appear in the CMS list, and a tile marked
        full-width spans both columns. This is what makes "drag anything
        anywhere" behave the way an editor expects. Styles are scoped here
        rather than added to landing.css so the live landing page is untouched.
      */}
      <div className={packed ? 'sb-bento-packed' : 'sb-bento-grid'}>
        {cards.map((card) => (
          <div
            className={card.width === 'full' ? 'sb-bento-cell sb-bento-cell-full' : 'sb-bento-cell'}
            key={card._uid}
          >
            <BentoCard card={card} />
          </div>
        ))}
      </div>

      <style>{`
        .sb-bento-grid, .sb-bento-packed {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        /* Rows: strict left-to-right order. Short tiles leave space under them
           unless stretch is on, which is the trade-off for keeping order. */
        .sb-bento-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: ${gap}px;
          align-items: ${stretch ? 'stretch' : 'start'};
        }
        .sb-bento-grid .sb-bento-cell-full { grid-column: 1 / -1; }
        .sb-bento-grid .sb-bento-cell { display: flex; }
        .sb-bento-grid .sb-bento-cell > .bc { width: 100%; }

        /* Tight packing: tiles stack with no leftover space, flowing down the
           left column and continuing down the right. */
        .sb-bento-packed {
          column-count: 2;
          column-gap: ${gap}px;
        }
        .sb-bento-packed .sb-bento-cell {
          break-inside: avoid;
          margin-bottom: ${gap}px;
        }
        .sb-bento-packed .sb-bento-cell-full { column-span: all; }

        @media (max-width: 860px) {
          .sb-bento-grid { grid-template-columns: minmax(0, 1fr); }
          .sb-bento-grid .sb-bento-cell-full { grid-column: auto; }
          .sb-bento-packed { column-count: 1; }
        }
      `}</style>
    </section>
  )
}
