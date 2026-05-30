import { Suspense } from 'react'
import { Metadata } from 'next'
import LocalJobPages from '@/components/LocalJobPages'

export const metadata: Metadata = {
  title: 'Local Job Pages — Every Job Creates a Searchable Page | ProjectCheckin',
  description:
    'Every completed job becomes an indexed Google page with your photos, location, and business info. Automatic local presence, zero extra work from your team.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/local-job-pages',
  },
  openGraph: {
    title: 'Local Job Pages — Every Job Creates a Searchable Page',
    description:
      'Every completed job becomes an indexed Google page with your photos, location, and business info. Automatic local presence, zero extra work from your team.',
    url: 'https://projectcheckin.com/features/local-job-pages',
    siteName: 'ProjectCheckin',
    type: 'website',
    images: [{ url: '/og/og-default-v1.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Local Job Pages — Every Job Creates a Searchable Page',
    description:
      'Every completed job becomes an indexed Google page with your photos, location, and business info. Automatic local presence, zero extra work from your team.',
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
      name: 'Local Job Pages',
      item: 'https://projectcheckin.com/features/local-job-pages',
    },
  ],
}

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ProjectCheckin',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'iOS, Android, Web',
  description:
    'ProjectCheckin lets field service teams document completed jobs with photos and notes, automatically creating indexed local job pages and a public portfolio.',
  featureList: [
    'Location-tagged job documentation',
    'Photo documentation with before/after tagging',
    'Automatic local job page creation',
    'Google Business Profile posting',
    'Review request workflow',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free plan available. Paid plans from $49.50/mo.',
  },
  url: 'https://projectcheckin.com',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a Local Job Page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Local Job Page is a public webpage created automatically when your team publishes a completed job on ProjectCheckin. It includes your photos, service type, exact address, and business contact info — structured with schema markup so Google can index and understand each job.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does my team actually use it on the job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'When your team arrives, they open the app, select the job type, enter the address, and take photos. The whole process takes under two minutes. ProjectCheckin timestamps and GPS-tags everything automatically — no manual data entry needed later.',
      },
    },
    {
      '@type': 'Question',
      name: 'What happens to the photos after a job is published?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Every photo is saved to the job record in your dashboard, organized by job automatically. You can tag photos as before or after, add notes, and publish the job as a page that customers and prospects can view.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this as proof if a customer disputes the work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Every published job page creates a timestamped, GPS-tagged record of the work done — photos, notes, job address, and date are all saved and accessible from your dashboard at any time.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do Local Job Pages help my business show up on Google?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Each Local Job Page is indexed by Google with location-specific metadata — city, state, and service type in the URL, title, and schema markup. Individual pages rank for specific long-tail searches. Across hundreds of published jobs, your business builds a local search presence that compounds over time.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many photos can I take per job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'As many as the job requires. Monthly photo limits apply by plan: Free includes 50 photos/month, Pro 500, Elite 2,000, and Titan is unlimited.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need my own website for this to work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. ProjectCheckin creates a public job page and a portfolio page for your business automatically — no website or technical setup required. Every completed job gets a shareable link, and your portfolio builds itself as jobs are published.',
      },
    },
  ],
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to create a Local Job Page with ProjectCheckin',
  description:
    'When your crew finishes a job, they take photos and enter the address. ProjectCheckin automatically builds an indexed, schema-optimized local job page.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Take Photos',
      text: 'Your crew opens the app at the job site, enters the address, and takes photos. The whole process takes under two minutes — nothing to fill out after the job is done.',
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'We Build the Page',
      text: 'ProjectCheckin formats the job page automatically with a location-specific URL, title, and meta description; schema markup including LocalBusiness, GeoCoordinates, and ImageObject; sitemap inclusion; and your business contact info with a call-to-action.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Live on Google',
      text: 'A public, indexed page goes live with your photos, service type, location, and business name. Backlinks to your website accumulate. Your portfolio grows with every publish.',
    },
  ],
}

export default function LocalJobPagesPage() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <Suspense>
        <LocalJobPages />
      </Suspense>
    </>
  )
}
