import type { Metadata } from 'next'
import Link from 'next/link'
import MarketingNav from '@/components/MarketingNav'
import { getPostsNewestFirst, postUrl, SITE_URL } from '@/lib/blogPosts'
// MarketingNav ships no CSS of its own — it relies on the host page's
// stylesheet for .nav-inner/.logo-img/.nav-links/.feat-drop, and on
// `body { padding-top: 64px }` to clear its own fixed positioning.
// Every marketing subpage pairs it with features.css; without this a
// direct load of /blog renders the nav completely unstyled.
// blog.css is imported second so it wins on any tie.
import '@/styles/features.css'
import '@/styles/blog.css'

const BLOG_URL = `${SITE_URL}/blog`
const BLOG_DESCRIPTION =
  'Guides, quick reads, and tools to help you cut costs, innovate, and grow.'

export const metadata: Metadata = {
  title: 'Blog | ProjectCheckin',
  description: BLOG_DESCRIPTION,
  alternates: { canonical: BLOG_URL },
  openGraph: {
    title: 'ProjectCheckin Blog',
    description: BLOG_DESCRIPTION,
    url: BLOG_URL,
    siteName: 'ProjectCheckin',
    type: 'website',
    images: [{ url: '/og/og-default-v1.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectCheckin Blog',
    description: BLOG_DESCRIPTION,
    images: ['/og/og-default-v1.png'],
  },
}

export default function BlogIndexPage() {
  const posts = getPostsNewestFirst()

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'ProjectCheckin Blog',
    description: BLOG_DESCRIPTION,
    url: BLOG_URL,
    inLanguage: 'en-US',
    publisher: {
      '@type': 'Organization',
      name: 'ProjectCheckin',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt,
      datePublished: post.publishedISO,
      dateModified: post.modifiedISO,
      url: postUrl(post.slug),
      author: { '@type': 'Organization', name: 'ProjectCheckin', url: SITE_URL },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: BLOG_URL },
    ],
  }

  return (
    <div className="blog-root">
      <MarketingNav />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c'),
        }}
      />

      <header className="blog-index-header">
        <h1>ProjectCheckin Blog</h1>
        <p>The guides, quick reads, and tools to help you cut costs, innovate, and grow.</p>
      </header>

      <main className="blog-index-main">
        {posts.map((post, i) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-post-row">
            <div className="blog-post-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="blog-post-main">
              <div className="blog-post-cat">{post.category}</div>
              <h2 className="blog-post-title">{post.title}</h2>
              <p className="blog-post-excerpt">{post.excerpt}</p>
              <div className="blog-post-meta">
                <span>ProjectCheckin</span>
                <span>{post.readTimeMinutes} min read</span>
                <span>
                  <time dateTime={post.publishedISO}>{post.publishedLabel}</time>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </main>

      <footer className="blog-footer">
        <Link href="/">← Back to ProjectCheckin</Link>
      </footer>
    </div>
  )
}
