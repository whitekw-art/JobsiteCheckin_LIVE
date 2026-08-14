import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import GoogleRankingFactors2026, {
  FAQ_ITEMS as RANKING_FACTORS_FAQ,
} from '@/components/blog/GoogleRankingFactors2026'
import AiOverviews2026, {
  FAQ_ITEMS as AI_OVERVIEWS_FAQ,
} from '@/components/blog/AiOverviews2026'
import {
  BLOG_POSTS,
  getPostBySlug,
  getPostsNewestFirst,
  postUrl,
  SITE_URL,
} from '@/lib/blogPosts'
// See the note in app/blog/page.tsx — MarketingNav depends on the host
// page's stylesheet, so features.css must load alongside blog.css or a
// direct load of a post renders the nav unstyled.
import '@/styles/features.css'
import '@/styles/blog.css'

/**
 * Post body + its FAQ, keyed by slug. Adding a post means adding an entry
 * here and one in `lib/blogPosts.ts` — nothing else in this route changes.
 */
const POST_CONTENT: Record<
  string,
  { Body: () => React.ReactElement; faq: { q: string; a: string }[] }
> = {
  'google-ranking-factors-2026': {
    Body: GoogleRankingFactors2026,
    faq: RANKING_FACTORS_FAQ,
  },
  'ai-overviews-what-the-data-shows': {
    Body: AiOverviews2026,
    faq: AI_OVERVIEWS_FAQ,
  },
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found | ProjectCheckin' }
  }

  const url = postUrl(post.slug)
  const ogImage = '/og/og-default-v1.png'

  return {
    title: `${post.title} | ProjectCheckin`,
    description: post.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url,
      siteName: 'ProjectCheckin',
      type: 'article',
      publishedTime: post.publishedISO,
      modifiedTime: post.modifiedISO,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  const content = post ? POST_CONTENT[post.slug] : undefined

  if (!post || !content) notFound()

  const url = postUrl(post.slug)
  const { Body, faq } = content
  const otherPosts = getPostsNewestFirst().filter((p) => p.slug !== post.slug)

  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.publishedISO,
    dateModified: post.modifiedISO,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    image: `${SITE_URL}/og/og-default-v1.png`,
    articleSection: post.category,
    inLanguage: 'en-US',
    author: {
      '@type': 'Organization',
      name: 'ProjectCheckin',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'ProjectCheckin',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  }

  return (
    <div className="blog-root">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <nav className="blog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / {post.category}
      </nav>

      <header className="blog-header">
        <div className="blog-kicker">{post.kicker}</div>
        <h1>{post.title}</h1>
        <p className="blog-subhead">{post.subhead}</p>
        <div className="blog-meta">
          <span>ProjectCheckin</span>
          <span>{post.readTimeMinutes} min read</span>
          <time dateTime={post.publishedISO}>Updated {post.publishedLabel}</time>
        </div>
      </header>

      <article className="blog-article">
        <Body />

        <div className="blog-related">
          <h2>Keep Reading</h2>
          <ul>
            {/* Other posts first, so every post cross-links to the rest of the
                blog automatically as new ones are added. */}
            {otherPosts.map((other) => (
              <li key={other.slug}>
                <Link href={`/blog/${other.slug}`}>{other.title}</Link>
              </li>
            ))}
            <li>
              <Link href="/features/local-job-pages">
                How Local Job Pages turn finished work into indexed pages
              </Link>
            </li>
            <li>
              <Link href="/features/gbp-post-generator">
                Posting completed jobs to your Google Business Profile
              </Link>
            </li>
            <li>
              <Link href="/blog">All posts</Link>
            </li>
          </ul>
        </div>
      </article>

      <footer className="blog-footer">
        <Link href="/blog">← Back to all posts</Link>
      </footer>
    </div>
  )
}
