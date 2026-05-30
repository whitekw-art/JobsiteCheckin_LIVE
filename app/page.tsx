import type { Metadata } from 'next'
import { Suspense } from 'react'
import LandingPage from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
  description:
    'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for field service businesses.',
  alternates: { canonical: 'https://projectcheckin.com/' },
  openGraph: {
    title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
    description:
      'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for field service businesses.',
    url: 'https://projectcheckin.com/',
    siteName: 'ProjectCheckin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
    description:
      'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist.',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does my crew need to download an app?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No download required. Your crew opens a link in a mobile browser, takes photos, adds a description, and submits. Most people are running in under two minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the GBP posting work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'After each job is published, ProjectCheckin generates a GBP post for you — formatted and ready. You copy it and paste it into your GBP. Takes about 30 seconds. Full auto-posting is coming in a future update.',
      },
    },
    {
      '@type': 'Question',
      name: 'What trades does this work for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Any field service business where the work is done on-site and can be photographed. Roofing, flooring, painting, HVAC, landscaping, plumbing, electrical, remodeling — if your crew goes to a job site, it works.',
      },
    },
    {
      '@type': 'Question',
      name: 'What\'s the difference between a project page and my portfolio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every job gets its own project page — a standalone before/after link you can send in a quote. Your portfolio is the full library of all published jobs as a public-facing showcase.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from posting on Google myself?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Posting yourself means gathering photos, writing copy, logging in, and doing it after every job. Most contractors try for two weeks and stop. ProjectCheckin makes it one step your crew handles at the job site — so it happens every job, without you thinking about it.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is there a contract or commitment?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No contract, no commitment. Cancel anytime from your account settings. You keep every project page and portfolio entry you\'ve published — they stay live as long as you\'re a subscriber.',
      },
    },
    {
      '@type': 'Question',
      name: 'My crew isn\'t tech-savvy. Will they actually use this?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No app to download, no account to create. You send your crew a link — they open it in their phone browser, take photos, add a quick note, and hit submit. Most crews are doing it on their first job. If they can text, they can do this.',
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to get set up?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Under 10 minutes. Create your account, add your business info, and send your crew the check-in link. Your first job can be published the same day.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get more Google reviews from customers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The biggest reason contractors don\'t get reviews is they never ask — or they ask too late. ProjectCheckin sends a personalized review request to your customer automatically after each job is published, while the work is still fresh. Text or email, one tap, pre-written. Most contractors see more review conversations in their first month than they did all year.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get my contracting business to show up on Google?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Google ranks local businesses that are active, documented, and reviewed. Every job you publish through ProjectCheckin creates a location-specific page Google can index, a Google Business Profile post showing recent activity, and a review request to your customer. Do that consistently and your Google presence builds with every job your crew completes.',
      },
    },
  ],
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://projectcheckin.com/#organization',
      name: 'ProjectCheckin',
      url: 'https://projectcheckin.com',
      description:
        'ProjectCheckin helps field service businesses turn completed jobs into Google-indexed pages that bring in new customers automatically.',
      foundingDate: '2025',
      areaServed: 'US',
      knowsAbout: [
        'Local SEO for contractors',
        'Job check-in software',
        'Field service management',
        'Google Business Profile optimization',
      ],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://projectcheckin.com/#webapp',
      name: 'ProjectCheckin',
      url: 'https://projectcheckin.com',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      description:
        'Job check-in software that automatically creates Google-indexed pages for every completed job, building local search presence for field service businesses without any SEO knowledge required.',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '149.50',
        offerCount: '4',
      },
      featureList: [
        'Automatic Google-indexed job pages',
        'Photo capture and upload',
        'Team check-in management',
        'Local SEO schema markup',
        'Portfolio pages per business',
        'Job performance analytics',
      ],
    },
  ],
}

export default function HomePage() {
  const registrationOpen = process.env.REGISTRATION_OPEN === 'true'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Suspense>
        <LandingPage registrationOpen={registrationOpen} />
      </Suspense>
    </>
  )
}
