import type { Metadata } from 'next'
import LandingPage from '@/components/LandingPage'
import { faqs } from '@/lib/homeFaqs'

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
    images: [{ url: '/og/og-default-v1.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ProjectCheckin \u2014 Turn Every Job Into Your Next Customer | Free to Join',
    description:
      'Every job your crew completes becomes a searchable page that brings in the next customer. Free to join the waitlist.',
    images: ['/og/og-default-v1.png'],
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
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
        highPrice: '299.00',
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
      <LandingPage registrationOpen={registrationOpen} />
    </>
  )
}
