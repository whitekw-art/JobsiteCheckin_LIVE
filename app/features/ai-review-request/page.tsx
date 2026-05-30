import { Suspense } from 'react'
import { Metadata } from 'next'
import AIReviewRequestAgent from '@/components/AIReviewRequestAgent'

export const metadata: Metadata = {
  title: 'AI Review Request Agent — Personalized Review Texts & Replies | ProjectCheckin',
  description:
    'Your AI agent writes a personalized review request from your job data — customer name, address, what was done — and handles replies automatically. Complaints escalate to you immediately.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/ai-review-request',
  },
  openGraph: {
    title: 'AI Review Request Agent — Personalized Review Texts & Replies',
    description:
      'Your AI agent writes a personalized review request from your job data and handles replies automatically. Complaints escalate to you immediately.',
    url: 'https://projectcheckin.com/features/ai-review-request',
    siteName: 'ProjectCheckin',
    type: 'website',
    images: [{ url: '/og/og-default-v1.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Review Request Agent — Personalized Review Texts & Replies',
    description:
      'Your AI agent writes a personalized review request from your job data and handles replies automatically. Complaints escalate to you immediately.',
    images: ['/og/og-default-v1.png'],
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
      name: 'AI Review Request Agent',
      item: 'https://projectcheckin.com/features/ai-review-request',
    },
  ],
}

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ProjectCheckin AI Review Request Agent',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'iOS, Android, Web',
  description:
    'An AI agent that reads job check-in data — customer name, address, and scope of work — and writes a personalized review request message. Handles customer replies automatically; escalates complaints to the contractor immediately.',
  featureList: [
    'AI-personalized review request messages using real job data',
    'Automated reply handling using job records and business profile',
    'Instant escalation of complaints and disputes to the contractor',
    'Sends via contractor\'s own phone or email — no third-party number',
    'Google review link pre-populated in every draft',
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
  name: 'How the AI Review Request Agent works',
  description:
    'Your AI review agent reads every job on file — customer name, address, trade, and what was done — and writes a personalized review request message ready to send in one tap.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Job is published',
      text: 'Customer name, phone or email, and job details are on file from check-in.',
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'Your AI agent writes the message',
      text: 'References the customer\'s name, the specific address, and what your crew actually did. Every draft is unique to that job.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Review modal opens pre-filled',
      text: 'Edit anything — or send as-is. The draft is yours. Takes about 10 seconds to review.',
    },
    {
      '@type': 'HowToStep',
      position: '4',
      name: 'Your AI agent handles replies',
      text: 'Customer writes back with a question? Your AI agent answers using your job data and business profile. Complaints escalate to you immediately.',
    },
  ],
}

export default function AIReviewRequestAgentPage() {
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
        <AIReviewRequestAgent />
      </Suspense>
    </>
  )
}
