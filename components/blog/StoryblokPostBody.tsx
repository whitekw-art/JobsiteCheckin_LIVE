import { Fragment, type ReactNode } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  bodyStyle,
  editableProps,
  extractSectionHeadings,
  headingId,
  headingStyle,
  type PageBlock,
  type RichTextNode,
  type StoryblokBlogPost,
} from '@/lib/storyblok'

/**
 * Renders a Storyblok-authored blog post using the site's existing blog.css
 * classes, so a post edited in the Storyblok dashboard is visually identical
 * to the hardcoded posts in components/blog/.
 *
 * Each block carries Storyblok's click-to-edit attributes, so clicking an
 * element inside the visual editor opens that block's fields.
 *
 * TEST ONLY — used by /blog-preview/[slug]. No live route renders this.
 */

/**
 * Scheme allowlist for any URL that arrives as CMS content. Mirrors the
 * `safeHref()` gate already used in public/widget.v1.js — a `javascript:` or
 * `data:` href rendered into an anchor is an XSS vector, and CMS fields are
 * user-supplied input even when the only user is us.
 */
function safeHref(href: string | undefined): string {
  if (!href) return '#'
  if (href.startsWith('/') && !href.startsWith('//')) return href
  if (href.startsWith('#')) return href
  try {
    const url = new URL(href)
    if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'mailto:') {
      return href
    }
  } catch {
    // Not a parseable absolute URL — fall through to the safe default.
  }
  return '#'
}

/** Inline text with its marks (links, italic, bold) applied. */
function renderText(node: RichTextNode, key: string): ReactNode {
  const text = node.text ?? ''
  let out: ReactNode = text

  for (const mark of node.marks ?? []) {
    if (mark.type === 'italic') out = <em>{out}</em>
    else if (mark.type === 'bold') out = <strong>{out}</strong>
    else if (mark.type === 'link') {
      const href = safeHref(mark.attrs?.href)
      out = href.startsWith('/') ? (
        <Link href={href}>{out}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {out}
        </a>
      )
    }
  }

  return <Fragment key={key}>{out}</Fragment>
}

function renderInline(nodes: RichTextNode[] | undefined, keyPrefix: string): ReactNode[] {
  return (nodes ?? []).map((child, i) => renderText(child, `${keyPrefix}-${i}`))
}

/** One block-level rich-text node inside a section. */
function renderNode(node: RichTextNode, key: string): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return <p key={key}>{renderInline(node.content, key)}</p>
    case 'heading': {
      const level = node.attrs?.level ?? 3
      if (level === 4) return <h4 key={key}>{renderInline(node.content, key)}</h4>
      return <h3 key={key}>{renderInline(node.content, key)}</h3>
    }
    case 'bullet_list':
      return (
        <ul key={key}>
          {(node.content ?? []).map((li, i) => (
            <li key={`${key}-${i}`}>
              {(li.content ?? []).map((c, j) => renderNode(c, `${key}-${i}-${j}`))}
            </li>
          ))}
        </ul>
      )
    case 'ordered_list':
      return (
        <ol key={key}>
          {(node.content ?? []).map((li, i) => (
            <li key={`${key}-${i}`}>
              {(li.content ?? []).map((c, j) => renderNode(c, `${key}-${i}-${j}`))}
            </li>
          ))}
        </ol>
      )
    case 'horizontal_rule':
      return <hr className="blog-divider" key={key} />
    default:
      return null
  }
}

function renderRichText(body: RichTextNode | undefined, keyPrefix: string): ReactNode[] {
  return (body?.content ?? []).map((node, i) => renderNode(node, `${keyPrefix}-${i}`))
}

/** One draggable page block. */
function renderBlock(block: PageBlock, toc: { id: string; label: string }[]): ReactNode {
  const edit = editableProps(block)

  switch (block.component) {
    case 'intro_block':
      return (
        <p className="blog-lead" style={bodyStyle(block)} key={block._uid} {...edit}>
          {block.text}
        </p>
      )

    case 'toc_block':
      if (toc.length === 0) return null
      return (
        <nav className="blog-toc" aria-label="Table of contents" key={block._uid} {...edit}>
          <h2>{block.heading || 'In This Article'}</h2>
          <ol>
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>
      )

    case 'text_section':
      return (
        <Fragment key={block._uid}>
          <section className="blog-section" id={headingId(block.heading)} {...edit}>
            <h2 style={headingStyle(block)}>{block.heading}</h2>
            <div style={bodyStyle(block)}>{renderRichText(block.body, block._uid)}</div>
          </section>
          {block.divider_after && <hr className="blog-divider" />}
        </Fragment>
      )

    case 'leadin_note':
      return (
        <div className="blog-leadin" style={bodyStyle(block)} key={block._uid} {...edit}>
          {renderRichText(block.text, block._uid)}
        </div>
      )

    case 'figure_bar_chart': {
      const bars = block.bars ?? []
      return (
        <figure className="blog-fig" role="group" aria-label={block.alt_text} key={block._uid} {...edit}>
          <div className="blog-fig-title">{block.title}</div>
          {block.subtitle && <div className="blog-fig-sub">{block.subtitle}</div>}

          {bars.map((bar) => {
            const pct = Math.max(0, Math.min(100, Number(bar.percent) || 0))
            return (
              <div className="blog-bar-row" key={bar._uid} {...editableProps(bar)}>
                <div className="blog-bar-label">
                  {bar.label}
                  {bar.hint && <span className="blog-bar-hint"> ({bar.hint})</span>}
                </div>
                <div className="blog-bar-track">
                  <div className="blog-bar-rail">
                    <div className="blog-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="blog-bar-val">{bar.value_label || `${pct}%`}</div>
                </div>
              </div>
            )
          })}

          <div className="blog-fig-axis">
            <span>{block.axis_start || '0%'}</span>
            <span>{block.axis_end || '100%'}</span>
          </div>

          {block.source && (
            <figcaption className="blog-fig-source">
              {renderRichText(block.source, `${block._uid}-src`)}
            </figcaption>
          )}
        </figure>
      )
    }

    case 'factor_block':
      return (
        <Fragment key={block._uid}>
          <section className="blog-factor" id={headingId(block.heading)} {...edit}>
            <div className="blog-factor-head">
              <div className="blog-factor-num" aria-hidden="true">
                {block.number}
              </div>
              <div className="blog-factor-titlewrap">
                <h2 style={headingStyle(block)}>{block.heading}</h2>
                {block.impact && (
                  <span className={`blog-impact blog-impact-${block.impact}`}>
                    {block.impact.charAt(0).toUpperCase() + block.impact.slice(1)}
                  </span>
                )}
              </div>
            </div>
            <div className="blog-factor-body" style={bodyStyle(block)}>
              {renderRichText(block.body, block._uid)}
              {block.action_body && (
                <>
                  <h3 className="blog-action">{block.action_heading || 'Do This Week'}</h3>
                  {renderRichText(block.action_body, `${block._uid}-act`)}
                </>
              )}
            </div>
          </section>
          {block.divider_after && <hr className="blog-divider" />}
        </Fragment>
      )

    case 'image_block': {
      const src = block.image?.filename
      if (!src) return null
      return (
        <figure className="blog-shot" key={block._uid} {...edit}>
          <Image
            src={src}
            alt={block.alt || block.image?.alt || ''}
            width={960}
            height={540}
            style={{ height: 'auto' }}
          />
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
    }

    case 'faq_section': {
      const items = block.items ?? []
      if (items.length === 0) return null
      return (
        <section className="blog-faq" id="faq" key={block._uid} {...edit}>
          <h2>{block.heading || 'Frequently Asked Questions'}</h2>
          {items.map((item) => (
            <details className="blog-faq-item" key={item._uid} {...editableProps(item)}>
              <summary>
                <h3 style={headingStyle(item)}>{item.question}</h3>
              </summary>
              <p style={bodyStyle(item)}>{item.answer}</p>
            </details>
          ))}
        </section>
      )
    }

    case 'sources_section': {
      const items = block.items ?? []
      if (items.length === 0) return null
      return (
        <section className="blog-sources" key={block._uid} {...edit}>
          <h2>{block.heading || 'Sources'}</h2>
          <ul>
            {items.map((source) => (
              <li key={source._uid} style={bodyStyle(source)} {...editableProps(source)}>
                <a href={safeHref(source.url)} target="_blank" rel="noopener noreferrer">
                  {source.label}
                </a>
                {source.detail}
              </li>
            ))}
          </ul>
        </section>
      )
    }

    case 'cta_section':
      if (!block.headline && !block.button_url) return null
      return (
        <div className="blog-cta" key={block._uid} {...edit}>
          {block.headline && <h2 style={headingStyle(block)}>{block.headline}</h2>}
          {block.description && <p style={bodyStyle(block)}>{block.description}</p>}
          {block.button_url && (
            <div className="blog-cta-row">
              <a
                href={safeHref(block.button_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="blog-btn"
              >
                {block.button_text || 'Book a Demo'}
              </a>
            </div>
          )}
        </div>
      )

    default:
      return null
  }
}

export default function StoryblokPostBody({ post }: { post: StoryblokBlogPost }) {
  const sections = post.sections ?? []
  const toc = extractSectionHeadings(sections)

  return <>{sections.map((block) => renderBlock(block, toc))}</>
}
