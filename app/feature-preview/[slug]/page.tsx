import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import StoryblokBridge from '@/components/blog/StoryblokBridge'
import StoryblokFeaturePage, {
  type FpBlock,
} from '@/components/feature/StoryblokFeaturePage'
import { getStory, googleFontsHref } from '@/lib/storyblok'
import '@/styles/features.css'
import '@/styles/portfolio.css'
import '@/styles/review-requests.css'

/**
 * TEST ROUTE — a feature page (e.g. GBP Post Generator) rendered from
 * Storyblok. No live route uses this; the real /features/* pages are
 * untouched. Noindexed and frame-restricted the same as the other preview
 * routes (next.config.js STORYBLOK_PREVIEW_HEADERS).
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Feature page preview (internal)',
  robots: { index: false, follow: false },
}

type FeaturePageContent = {
  component: 'feature_page'
  breadcrumb_label?: string
  sections?: FpBlock[]
}

export default async function FeaturePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const story = await getStory<FeaturePageContent>(slug)
  if (!story) notFound()

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- test-only preview route */}
      <link rel="stylesheet" href={googleFontsHref()} />
      <StoryblokBridge />
      <MarketingNav />
      <StoryblokFeaturePage
        breadcrumbLabel={story.content.breadcrumb_label}
        sections={story.content.sections ?? []}
        darkBreadcrumb={story.content.sections?.[0]?.component === 'fp_ai_hero'}
      />
    </>
  )
}
