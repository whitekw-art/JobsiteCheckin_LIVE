import Link from 'next/link'
import { bodyStyle, editableProps, headingStyle, type TextStyleFields } from '@/lib/storyblok'

/**
 * The landing page's final call-to-action, rendered from Storyblok using
 * styles/landing.css. TEST ONLY — rendered by /landing-preview.
 */

export type FinalCtaBlock = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'lp_final_cta'
  heading: string
  body?: string
  button_text?: string
  button_url?: string
  note?: string
  secondary_text?: string
  secondary_url?: string
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

export default function StoryblokFinalCta({ block }: { block: FinalCtaBlock }) {
  const href = safeHref(block.button_url)
  const internal = href.startsWith('/')

  return (
    <section className="final" {...editableProps(block)}>
      <div className="final-inner">
        <h2 style={headingStyle(block)}>{block.heading}</h2>
        {block.body && <p style={bodyStyle(block)}>{block.body}</p>}

        {block.button_text &&
          (internal ? (
            <Link href={href} className="btn-primary" style={{ margin: '0 auto' }}>
              {block.button_text} <Arrow />
            </Link>
          ) : (
            <a
              href={href}
              className="btn-primary"
              style={{ margin: '0 auto' }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {block.button_text} <Arrow />
            </a>
          ))}

        {block.note && <p className="final-sub">{block.note}</p>}

        {block.secondary_text && (
          <a
            href={safeHref(block.secondary_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-demo-ghost"
          >
            {block.secondary_text} →
          </a>
        )}
      </div>
    </section>
  )
}
