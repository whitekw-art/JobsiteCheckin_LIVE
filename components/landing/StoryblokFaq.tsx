'use client'

import { useState } from 'react'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'

/**
 * The landing page's FAQ, rendered from Storyblok using styles/landing.css.
 * Client component so it keeps the live page's single-open accordion
 * behaviour. TEST ONLY — rendered by /landing-preview.
 */

export type LpFaqItem = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_faq_item'
  question: string
  answer: string
}

export type LpFaqSectionBlock = {
  _uid: string
  _editable?: string
  component: 'lp_faq_section'
  heading?: string
  items?: LpFaqItem[]
}

function FaqArrow() {
  return (
    <span className="faq-arr">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path
          d="M3 5l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

export default function StoryblokFaq({ block }: { block: LpFaqSectionBlock }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const items = block.items ?? []
  if (items.length === 0) return null

  return (
    <section className="faq" id="faq" {...editableProps(block)}>
      <div className="faq-inner">
        <div className="faq-head">
          <h2>{block.heading || 'Questions we hear a lot'}</h2>
        </div>
        {items.map((item, i) => (
          <div
            className={`faq-item${openIndex === i ? ' open' : ''}`}
            key={item._uid}
            {...editableProps(item)}
          >
            <button
              className="faq-q"
              onClick={() => setOpenIndex((v) => (v === i ? null : i))}
              aria-expanded={openIndex === i}
            >
              <span style={headingStyle(item)}>{item.question}</span>
              <FaqArrow />
            </button>
            <div className="faq-a" style={bodyStyle(item)}>
              {item.answer}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
