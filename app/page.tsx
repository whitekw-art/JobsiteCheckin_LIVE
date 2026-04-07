import type { Metadata } from 'next'
import { Suspense } from 'react'
import LandingPage from '@/components/LandingPage'

export const metadata: Metadata = {
  title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
  description:
    'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for contractors.',
  alternates: { canonical: 'https://projectcheckin.com/' },
  openGraph: {
    title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
    description:
      'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist. ProjectCheckin turns completed jobs into automatic Google pages for contractors.',
    url: 'https://projectcheckin.com/',
    siteName: 'ProjectCheckin',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Does my crew need a smartphone?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Your crew can check in from any smartphone on the job, but it\'s not required. Photos can be taken with any camera and uploaded later from a computer. The check-in form runs in any browser — phone, tablet, or desktop.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need a website to use this?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Every published job gets its own page on our domain — customers can find you on Google without you having a website at all. If you do have a website, our Pro tier lets you embed those pages directly on your site too.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many jobs do we need to see results?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Consistency matters more than volume. Even a job or two a week adds up to real Google presence over 90 days. The more you check in, the faster your presence builds — but there\'s no minimum to get started.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the 90-day guarantee work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Check in at least 3 times per week for 90 days. If your dashboard doesn\'t show real traffic — page views, phone taps, or website clicks — email us. We verify your activity data and refund your last 2 months. No forms, no arguments.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I control which jobs get published?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every job starts private. You review it and publish when you\'re ready. You can edit, unpublish, or keep any job internal at any time. Your crew checks in; you decide what goes on Google.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I cancel anytime?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Month-to-month. No contracts. No cancellation fees. Cancel any time from your account — takes 30 seconds.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does my job page actually show up on Google?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Each job your crew checks in becomes a live web page at its own URL — built with your business name, location, service type, and job photos. Google indexes these pages the same way it indexes any other website. Most pages start appearing in search results within a few days of publishing.',
      },
    },
    {
      '@type': 'Question',
      name: 'What trades and industries does this work for?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Any trade that does work at customer locations — door and window companies, HVAC, plumbing, roofing, flooring, painting, electrical, landscaping, and more. If you do jobs at job sites and want those jobs showing up when local customers search, this was built for you.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to know anything about SEO to use this?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nothing. Every job page is built with search-optimized structure, local schema markup, and your job details automatically applied. That covers traditional Google search — and we also optimize for AI search tools like ChatGPT and Perplexity, which are increasingly where customers find local businesses. You check in — we handle all of it.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from just having a website?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A website is one page that rarely changes. ProjectCheckin creates a new page for every job — each one targeting the specific search terms a customer uses when they need exactly what you just completed. More pages means more ways Google can find you for more searches.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to my job pages if I cancel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Your published job pages stay live for 30 days after cancellation so you don\'t lose rankings overnight. After that, the pages are taken offline. We\'ll make sure you can retain everything — your job history, notes, and photos — before anything disappears.',
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
