import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import StoryblokBridge from '@/components/blog/StoryblokBridge'
import StoryblokPricingPage, { type PpBlock } from '@/components/pricing/StoryblokPricingPage'
import { getStory, googleFontsHref } from '@/lib/storyblok'
import '@/styles/features.css'
import '@/styles/pricing.css'

/**
 * TEST ROUTE — the pricing page rendered from Storyblok. No live route uses
 * this; the real /pricing page is untouched. Noindexed and frame-restricted
 * the same as the other preview routes (next.config.js STORYBLOK_PREVIEW_HEADERS).
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pricing page preview (internal)',
  robots: { index: false, follow: false },
}

type PricingPageContent = {
  component: 'pricing_page'
  sections?: PpBlock[]
}

export default async function PricingPreviewPage() {
  const story = await getStory<PricingPageContent>('pricing')
  if (!story) notFound()

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- test-only preview route */}
      <link rel="stylesheet" href={googleFontsHref()} />
      <StoryblokBridge />
      <MarketingNav />
      <StoryblokPricingPage sections={story.content.sections ?? []} />
    </>
  )
}
