/**
 * Blog post registry.
 *
 * Adding a post = add an entry here + add its body component to the
 * `postBodies` map in `app/blog/[slug]/page.tsx`. Everything else
 * (index listing, sitemap, metadata, JSON-LD, static params) reads
 * from this file, so nothing else needs touching.
 *
 * `publishedISO` drives both the visible date and the schema
 * `datePublished` field — keep it a real ISO date.
 */

export type BlogPost = {
  slug: string
  title: string
  /** Shown on the index page and used as the meta description fallback. */
  excerpt: string
  /** Meta description — kept separate so it can be tuned for search without changing on-page copy. */
  metaDescription: string
  category: string
  publishedISO: string
  modifiedISO: string
  /** Human-readable label, e.g. "August 2026". */
  publishedLabel: string
  readTimeMinutes: number
  /** Sub-headline under the H1 on the post page itself. */
  subhead: string
  /** Small label above the H1. */
  kicker: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'google-ranking-factors-2026',
    title: '11 Google Ranking Factors That Actually Matter for Service Businesses in 2026',
    excerpt:
      'The ranking factors Google has confirmed or clearly signaled matter this year, explained plainly, with one thing to do about each one this week.',
    metaDescription:
      'The Google ranking factors confirmed or clearly signaled for 2026, explained plainly — what each one means, how much it carries, and what to do about it this week.',
    category: 'Local SEO',
    publishedISO: '2026-08-12',
    modifiedISO: '2026-08-12',
    publishedLabel: 'August 2026',
    readTimeMinutes: 9,
    subhead:
      'The ranking factors Google has confirmed or clearly signaled matter this year, explained plainly, with one thing to do about each one this week.',
    kicker: 'Local SEO Guide — Updated for 2026',
  },
]

export const SITE_URL = 'https://projectcheckin.com'

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug)
}

/** Newest first, for the index listing. */
export function getPostsNewestFirst(): BlogPost[] {
  return [...BLOG_POSTS].sort(
    (a, b) => new Date(b.publishedISO).getTime() - new Date(a.publishedISO).getTime()
  )
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`
}
