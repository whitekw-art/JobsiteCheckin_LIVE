import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import StoryblokPostBody from '@/components/blog/StoryblokPostBody'
import StoryblokBridge from '@/components/blog/StoryblokBridge'
import { getStory, googleFontsHref, readTimeMinutes } from '@/lib/storyblok'
import '@/styles/features.css'
import '@/styles/blog.css'

/**
 * TEST ROUTE — renders a Storyblok-authored blog post with the site's real
 * blog design, so the CMS can be evaluated without touching the live blog.
 *
 * Deliberately kept out of: lib/blogPosts.ts, app/sitemap.ts, the blog index,
 * and middleware's public-path allowlist. It is noindex'd below as a second
 * guard, so it can never be crawled or indexed even if linked accidentally.
 *
 * The live post at /blog/how-to-get-google-reviews-2026 is untouched.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Blog preview (internal)',
  robots: { index: false, follow: false },
}

export default async function BlogPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getStory(slug)

  if (!story) notFound()

  const post = story.content
  const published = post.published_date ?? story.published_at ?? ''
  const publishedLabel = published
    ? new Date(published).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="blog-root">
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- test-only preview route, not the live blog */}
      <link rel="stylesheet" href={googleFontsHref()} />
      <StoryblokBridge />
      <MarketingNav />

      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '12px 20px 0',
          fontSize: 13,
          color: '#8a6d3b',
        }}
      >
        Preview only — this page is not on the live site and is not indexed by Google.
      </div>

      <nav className="blog-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/blog">Blog</Link> / {post.category}
      </nav>

      <header className="blog-header">
        <div className="blog-kicker">{post.kicker}</div>
        <h1>{post.title}</h1>
        <p className="blog-subhead">{post.subhead}</p>
        <div className="blog-meta">
          <span>ProjectCheckin</span>
          <span>{readTimeMinutes(post.sections)} min read</span>
          {publishedLabel && <time dateTime={published}>Updated {publishedLabel}</time>}
        </div>
      </header>

      <article className="blog-article">
        <StoryblokPostBody post={post} />
      </article>

      <footer className="blog-footer">
        <Link href="/blog">← Back to all posts</Link>
      </footer>
    </div>
  )
}
