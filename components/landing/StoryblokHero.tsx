import Link from 'next/link'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'

/**
 * The landing page hero, rendered from Storyblok using styles/landing.css so
 * it matches the live page. TEST ONLY — rendered by /landing-preview.
 */

export type HeroBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_hero'
  headline_line1: string
  headline_line2?: string
  subhead?: string
  button_text?: string
  button_url?: string
  note?: string
  trust_items?: string
  show_visual?: boolean
}

function Check() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M11.5 4L5.5 10L2.5 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Only same-origin paths and http(s) links are allowed through from the CMS. */
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

export default function StoryblokHero({ block }: { block: HeroBlock }) {
  const trust = (block.trust_items ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const href = safeHref(block.button_url)
  const internal = href.startsWith('/')

  return (
    <section className="hero" id="main-content" {...editableProps(block)}>
      <div className="hero-inner">
        <h1 className="hero-h1" style={headingStyle(block)}>
          <span className="h1-line1">{block.headline_line1}</span>
          {block.headline_line2 && (
            <span className="h1-line2">
              <em>{block.headline_line2}</em>
            </span>
          )}
        </h1>

        <div className="hero-bottom">
          {block.subhead && (
            <p className="hero-sub" style={bodyStyle(block)}>
              {block.subhead}
            </p>
          )}

          <div className="hero-cta-col">
            {internal ? (
              <Link href={href} className="btn-primary">
                {block.button_text || 'Get Started'} <Arrow />
              </Link>
            ) : (
              <a href={href} className="btn-primary" target="_blank" rel="noopener noreferrer">
                {block.button_text || 'Get Started'} <Arrow />
              </a>
            )}

            {block.note && (
              <div className="spots-note">
                <span className="spots-dot"></span>
                {block.note}
              </div>
            )}

            {trust.length > 0 && (
              <div className="trust-row">
                {trust.map((item) => (
                  <span className="trust-i" key={item}>
                    <Check />
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
