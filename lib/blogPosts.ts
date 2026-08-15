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
  /**
   * Optional index thumbnail, e.g. `/blog/thumbs/<slug>.png`.
   * Posts without one render as a text-only row with no placeholder and no
   * layout shift — the <Image> is simply omitted. Keep both fields together;
   * `thumbnailAlt` is required whenever `thumbnail` is set.
   */
  thumbnail?: string
  thumbnailAlt?: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'window-door-companies-get-found-2026',
    title: 'How Window, Door, and Garage Door Companies Get Found Online in 2026',
    excerpt:
      'The market stopped growing on its own this year, so the jobs go to the companies homeowners can actually find and verify.',
    metaDescription:
      'The 25C tax credit is gone and remodeling growth is slowing, so 2026 jobs go to whoever homeowners can find and verify. What the research says about how they actually shop for windows and doors.',
    category: 'Trade Guides',
    publishedISO: '2026-08-15',
    modifiedISO: '2026-08-15',
    publishedLabel: 'August 2026',
    readTimeMinutes: 10,
    subhead:
      'The market stopped growing on its own this year, so the jobs go to the companies homeowners can actually find and verify.',
    kicker: 'Trade Guide — Updated for 2026',
    thumbnail: '/blog/thumbs/window-door-companies-get-found-2026.png',
    thumbnailAlt: 'Line illustration of a front door with a target mark on it',
  },
  {
    slug: 'ai-overviews-what-the-data-shows',
    title: 'AI Overviews Are Cutting Clicks. Here’s What the Data Actually Shows.',
    excerpt:
      'The traffic drop is real and it’s measurable, but the response Google recommends is the same work that has always earned search visibility.',
    metaDescription:
      'Google’s AI Overviews are measurably reducing clicks to websites. Here’s what independent 2026 research from Pew, Oxford, and Washington University found, and what Google itself says to do about it.',
    category: 'AI Search',
    publishedISO: '2026-08-14',
    modifiedISO: '2026-08-14',
    publishedLabel: 'August 2026',
    readTimeMinutes: 9,
    subhead:
      'The traffic drop is real and it’s measurable, but the response Google recommends is the same work that has always earned search visibility.',
    kicker: 'AI Search — Updated for 2026',
    thumbnail: '/blog/thumbs/ai-overviews-what-the-data-shows.jpg',
    thumbnailAlt: 'Line illustration of scissors cutting the cord of a computer mouse',
  },
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
    thumbnail: '/blog/thumbs/google-ranking-factors-2026.png',
    thumbnailAlt: 'Illustration of a green zigzag arrow trending upward',
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
