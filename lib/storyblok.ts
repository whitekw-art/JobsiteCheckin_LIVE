/**
 * Storyblok content fetching (TEST ONLY — not wired into any live route).
 *
 * Used by /blog-preview/[slug] to prove a blog post can be edited in
 * Storyblok's dashboard and rendered with the site's existing blog design.
 * The live blog at /blog/[slug] is untouched and still reads from
 * lib/blogPosts.ts plus the hardcoded components in components/blog/.
 */

import type { CSSProperties } from 'react'

const STORYBLOK_CDN = 'https://api.storyblok.com/v2/cdn'

export type RichTextMark = {
  type: string
  attrs?: { href?: string; target?: string; linktype?: string }
}

export type RichTextNode = {
  type: string
  text?: string
  attrs?: { level?: number }
  marks?: RichTextMark[]
  content?: RichTextNode[]
}

export type StoryblokFaqItem = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'faq_item'
  question: string
  answer: string
}

export type StoryblokSource = TextStyleFields & {
  _uid: string
  _editable?: string
  component: 'source_item'
  label: string
  url: string
  detail?: string
}

/** Fields every block carries; `_editable` is what powers click-to-edit. */
type BlockBase = { _uid: string; _editable?: string }

export type IntroBlock = BlockBase &
  TextStyleFields & { component: 'intro_block'; text: string }
export type TocBlock = BlockBase & { component: 'toc_block'; heading?: string }
export type TextSection = BlockBase &
  TextStyleFields & {
    component: 'text_section'
    heading: string
    body?: RichTextNode
    divider_after?: boolean
  }
export type ImageBlock = BlockBase & {
  component: 'image_block'
  image?: { filename?: string | null; alt?: string | null }
  alt?: string
  caption?: string
}
export type FaqSection = BlockBase & {
  component: 'faq_section'
  heading?: string
  items?: StoryblokFaqItem[]
}
export type SourcesSection = BlockBase & {
  component: 'sources_section'
  heading?: string
  items?: StoryblokSource[]
}
export type CtaSection = BlockBase &
  TextStyleFields & {
    component: 'cta_section'
    headline?: string
    description?: string
    button_text?: string
    button_url?: string
  }

export type LeadinNote = BlockBase &
  TextStyleFields & { component: 'leadin_note'; text?: RichTextNode }

export type BarRow = BlockBase & {
  component: 'bar_row'
  label: string
  hint?: string
  percent?: number | string
  value_label?: string
}

export type FigureBarChart = BlockBase & {
  component: 'figure_bar_chart'
  title: string
  subtitle?: string
  bars?: BarRow[]
  axis_start?: string
  axis_end?: string
  source?: RichTextNode
  alt_text?: string
}

export type FactorBlock = BlockBase &
  TextStyleFields & {
    component: 'factor_block'
    number: string
    heading: string
    impact?: string
    body?: RichTextNode
    action_heading?: string
    action_body?: RichTextNode
    divider_after?: boolean
  }

export type PageBlock =
  | IntroBlock
  | TocBlock
  | TextSection
  | LeadinNote
  | FigureBarChart
  | FactorBlock
  | ImageBlock
  | FaqSection
  | SourcesSection
  | CtaSection

export type StoryblokBlogPost = {
  component: 'blog_post'
  kicker?: string
  title: string
  subhead?: string
  sections?: PageBlock[]
  excerpt?: string
  meta_description?: string
  category?: string
  published_date?: string
  updated_date?: string
  thumbnail?: { filename?: string | null }
  thumbnail_alt?: string
}

export type StoryblokStory<T = StoryblokBlogPost> = {
  id: number
  name: string
  slug: string
  published_at: string | null
  content: T
}

/**
 * Fetches one story by slug. Defaults to 'draft' so unpublished edits made in
 * the Storyblok editor are visible on the preview route immediately — that is
 * the whole point of a test page.
 */
export async function getStory<T = StoryblokBlogPost>(
  slug: string,
  version: 'draft' | 'published' = 'draft'
): Promise<StoryblokStory<T> | null> {
  const token = process.env.STORYBLOK_ACCESS_TOKEN
  if (!token) return null

  const url = `${STORYBLOK_CDN}/stories/${slug}?token=${token}&version=${version}`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = (await res.json()) as { story?: StoryblokStory<T> }
    return data.story ?? null
  } catch {
    return null
  }
}

/** Stable anchor id for a heading, so the table of contents can link to it. */
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’'"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Plain text of a rich-text node, used for headings and read-time counting. */
export function nodeText(node: RichTextNode): string {
  if (node.text) return node.text
  return (node.content ?? []).map(nodeText).join('')
}

/** Section headings, in block order — the source for the table of contents. */
export function extractSectionHeadings(
  sections: PageBlock[] | undefined
): { id: string; label: string }[] {
  return (sections ?? [])
    .filter(
      (block): block is TextSection | FactorBlock =>
        block.component === 'text_section' || block.component === 'factor_block'
    )
    .map((block) => ({ id: headingId(block.heading), label: block.heading }))
}

/** Read time from all body copy, so it never has to be typed in by hand. */
export function readTimeMinutes(sections: PageBlock[] | undefined): number {
  const text = (sections ?? [])
    .map((block) => {
      if (block.component === 'intro_block') return block.text ?? ''
      if (block.component === 'text_section') return block.body ? nodeText(block.body) : ''
      if (block.component === 'factor_block') {
        const body = block.body ? nodeText(block.body) : ''
        const action = block.action_body ? nodeText(block.action_body) : ''
        return `${block.heading} ${body} ${action}`
      }
      if (block.component === 'faq_section') {
        return (block.items ?? []).map((i) => `${i.question} ${i.answer}`).join(' ')
      }
      return ''
    })
    .join(' ')

  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 225))
}

/**
 * Curated font menu shown in Storyblok — must match the exact list used when
 * the "font" dropdown fields were created (scratchpad/shared-style-fields.mjs
 * FONT_PALETTE), so every value a customer can pick resolves to a real,
 * loadable Google Fonts family. Also used to build the <link> tag that
 * actually loads them.
 */
export const GOOGLE_FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Nunito',
  'Source Sans 3',
  'Work Sans',
  'DM Sans',
  'Rubik',
  'Merriweather',
  'Playfair Display',
  'Lora',
  'PT Serif',
  'Archivo',
  'Archivo Expanded',
  'Public Sans',
  'Fraunces',
]

/** Google Fonts CSS2 URL loading every curated family at common weights. */
export function googleFontsHref(): string {
  const families = GOOGLE_FONT_FAMILIES.map(
    (f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`
  ).join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/**
 * Any block styled through the shared font/color fields carries these — all
 * optional, all blank by default so an un-edited block renders exactly as
 * the page's own design intends.
 */
export type TextStyleFields = {
  heading_size?: number | string
  heading_font?: string
  heading_color?: string
  body_size?: number | string
  body_font?: string
  body_color?: string
}

/** Bounds prevent a typed-in size from breaking the page's layout. */
const MIN_FONT_PX = 10
const MAX_FONT_PX = 96

function safeFontSize(value: number | string | undefined): number | undefined {
  const n = typeof value === 'string' ? parseFloat(value) : value
  if (!Number.isFinite(n) || n === undefined) return undefined
  return Math.min(MAX_FONT_PX, Math.max(MIN_FONT_PX, n as number))
}

function safeFontFamily(value: string | undefined): string | undefined {
  if (!value) return undefined
  return GOOGLE_FONT_FAMILIES.includes(value) ? `'${value}', sans-serif` : undefined
}

const HEX_OR_VAR = /^#[0-9a-f]{3,8}$|^var\(--[\w-]+\)$/i

function safeTextColor(value: string | undefined): string | undefined {
  if (!value) return undefined
  return HEX_OR_VAR.test(value.trim()) ? value.trim() : undefined
}

/** Inline style for a block's heading, from its shared style fields. */
export function headingStyle(block: TextStyleFields): CSSProperties {
  return {
    fontSize: safeFontSize(block.heading_size),
    fontFamily: safeFontFamily(block.heading_font),
    color: safeTextColor(block.heading_color),
  }
}

/** Inline style for a block's body text, from its shared style fields. */
export function bodyStyle(block: TextStyleFields): CSSProperties {
  return {
    fontSize: safeFontSize(block.body_size),
    fontFamily: safeFontFamily(block.body_font),
    color: safeTextColor(block.body_color),
  }
}

/**
 * Click-to-edit wiring. Storyblok returns an HTML comment in `_editable`
 * describing the block; the visual editor looks for these data attributes to
 * know which block an element on the page belongs to. Returns nothing outside
 * the editor, since `_editable` is only present on draft content.
 */
export function editableProps(block: { _editable?: string }): Record<string, string> {
  const raw = block._editable
  if (!raw) return {}

  const match = raw.match(/\{.*\}/)
  if (!match) return {}

  try {
    const parsed = JSON.parse(match[0]) as { uid?: string; id?: string }
    if (!parsed.uid || !parsed.id) return {}
    return {
      'data-blok-c': match[0],
      'data-blok-uid': `${parsed.id}-${parsed.uid}`,
    }
  } catch {
    return {}
  }
}
