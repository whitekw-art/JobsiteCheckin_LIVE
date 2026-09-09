import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import MarketingNav from '@/components/MarketingNav'
import StoryblokBridge from '@/components/blog/StoryblokBridge'
import StoryblokBento, { type BentoSectionBlock } from '@/components/landing/StoryblokBento'
import StoryblokHero, { type HeroBlock } from '@/components/landing/StoryblokHero'
import StoryblokStats, { type StatsSectionBlock } from '@/components/landing/StoryblokStats'
import StoryblokHow, { type HowSectionBlock } from '@/components/landing/StoryblokHow'
import StoryblokAspiration, {
  type AspirationSectionBlock,
} from '@/components/landing/StoryblokAspiration'
import StoryblokFaq, { type LpFaqSectionBlock } from '@/components/landing/StoryblokFaq'
import StoryblokFinalCta, { type FinalCtaBlock } from '@/components/landing/StoryblokFinalCta'
import { getStory, googleFontsHref } from '@/lib/storyblok'
import '@/styles/landing.css'

/**
 * TEST ROUTE — the landing page's feature-tile section, rendered from Storyblok
 * so the tiles can be reordered, re-worded, and recoloured from the dashboard.
 *
 * The live landing page (app/page.tsx -> components/LandingPage.tsx) is
 * untouched and still fully hardcoded. Kept out of the sitemap and marked
 * noindex; framing is restricted to Storyblok in next.config.js.
 */

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Landing page preview (internal)',
  robots: { index: false, follow: false },
}

type LandingBlock =
  | HeroBlock
  | StatsSectionBlock
  | BentoSectionBlock
  | HowSectionBlock
  | AspirationSectionBlock
  | LpFaqSectionBlock
  | FinalCtaBlock

type LandingContent = {
  component: 'landing_page'
  sections?: LandingBlock[]
}

export default async function LandingPreviewPage() {
  const story = await getStory('landing-preview')
  if (!story) notFound()

  const content = story.content as unknown as LandingContent
  const sections = content.sections ?? []

  return (
    <div className="lp-root">
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- test-only preview route */}
      <link rel="stylesheet" href={googleFontsHref()} />
      <StoryblokBridge />
      <MarketingNav />

      <div
        style={{
          maxWidth: 900,
          margin: '0 auto',
          padding: '12px 20px 0',
          fontSize: 13,
          color: '#8a6d3b',
        }}
      >
        Preview only — this is not your live landing page and is not indexed by Google.
      </div>

      {sections.map((block) => {
        if (block.component === 'lp_hero') return <StoryblokHero block={block} key={block._uid} />
        if (block.component === 'lp_stats_section')
          return <StoryblokStats block={block} key={block._uid} />
        if (block.component === 'lp_bento_section')
          return <StoryblokBento block={block} key={block._uid} />
        if (block.component === 'lp_how_section') return <StoryblokHow block={block} key={block._uid} />
        if (block.component === 'lp_aspiration_section')
          return <StoryblokAspiration block={block} key={block._uid} />
        if (block.component === 'lp_faq_section') return <StoryblokFaq block={block} key={block._uid} />
        if (block.component === 'lp_final_cta')
          return <StoryblokFinalCta block={block} key={block._uid} />
        return null
      })}
    </div>
  )
}
