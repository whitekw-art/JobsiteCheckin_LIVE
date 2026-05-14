import { Suspense } from 'react'
import { Metadata } from 'next'
import AICopywriterAgent from '@/components/AICopywriterAgent'

export const metadata: Metadata = {
  title: 'AI Copywriter Agent — Photos In, Published Pages Out | ProjectCheckin',
  description:
    'Your crew submits photos. Your AI copywriting agent reads every image and writes a complete, keyword-rich job description — ready to review and publish. No typing required.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/ai-copywriter',
  },
  openGraph: {
    title: 'AI Copywriter Agent — Photos In, Published Pages Out',
    description:
      'Your crew submits photos. Your AI copywriting agent reads every image and writes a complete, keyword-rich job description — ready to review and publish.',
    url: 'https://projectcheckin.com/features/ai-copywriter',
    siteName: 'ProjectCheckin',
    type: 'website',
  },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://projectcheckin.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'AI Copywriter Agent',
      item: 'https://projectcheckin.com/features/ai-copywriter',
    },
  ],
}

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ProjectCheckin AI Copywriter Agent',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'iOS, Android, Web',
  description:
    'An AI agent that reads job photos submitted by field crews and automatically writes location-specific, SEO-optimized job descriptions — ready to review and publish with one click.',
  featureList: [
    'AI-powered photo analysis for job description generation',
    'Location-specific content with city, address, and trade keywords',
    'Schema markup, image alt text, and internal links at every publish',
    'Editable AI drafts before publishing',
    'Automatic before/after photo tagging recognition',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Included in Titan plan. Coming soon.',
  },
  url: 'https://projectcheckin.com',
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How the AI Copywriter Agent works',
  description:
    'Your crew submits job photos. The AI agent reads every image, writes a complete job description, and prepares a draft for you to review and publish in 30 seconds.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Crew checks in with photos',
      text: 'Address, trade, and a few job photos. Notes are optional — the AI doesn\'t need them to write a good description.',
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'AI agent reads every photo',
      text: 'Identifies what was done — materials, scope, before and after state — directly from the images. No notes needed from your crew.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Draft appears on your dashboard',
      text: 'You review the generated description. Edit anything you want, or publish as-is. It takes 30 seconds.',
    },
    {
      '@type': 'HowToStep',
      position: '4',
      name: 'Job page goes live',
      text: 'A location-specific, indexed page — tied to the job address — goes live and starts building your local search presence.',
    },
  ],
}

export default function AICopywriterAgentPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Suspense>
        <AICopywriterAgent />
      </Suspense>
    </>
  )
}
