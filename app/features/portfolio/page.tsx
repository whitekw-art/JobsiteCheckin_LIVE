import { Suspense } from 'react'
import { Metadata } from 'next'
import Portfolio from '@/components/Portfolio'

export const metadata: Metadata = {
  title: 'Job Portfolio — Share Every Completed Job with One Link | ProjectCheckin',
  description:
    'Every job you publish automatically appears in a public portfolio at your own ProjectCheckin URL. Send one link to any potential customer — they see real photos, real locations, and real dates from your actual completed work.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/portfolio',
  },
  openGraph: {
    title: 'Job Portfolio — Share Every Completed Job with One Link',
    description:
      'Every job you publish automatically appears in a public portfolio at your own ProjectCheckin URL. Send one link to any potential customer — they see real photos, real locations, and real dates from your actual completed work.',
    url: 'https://projectcheckin.com/features/portfolio',
    siteName: 'ProjectCheckin',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Job Portfolio — Share Every Completed Job with One Link',
    description:
      'Every job you publish automatically appears in a public portfolio at your own ProjectCheckin URL. Send one link to any potential customer.',
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
      name: 'Job Portfolio',
      item: 'https://projectcheckin.com/features/portfolio',
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
    'ProjectCheckin lets field service teams document completed jobs with photos and notes, then publishes them to a shareable public portfolio — updated automatically with every job published from the dashboard.',
  featureList: [
    'Public portfolio at a permanent, shareable URL',
    'Portfolio updates automatically when jobs are published',
    'Filter by job type — visitors see only relevant work',
    'Real photos, locations, and dates from actual completed jobs',
    'Dashboard stays private; portfolio is public — separation is built in',
    'Job records tied to the organization, not an individual device',
  ],
  offers: {
    '@type': 'Offer',
    price: '49.50',
    priceCurrency: 'USD',
    description: 'Job Portfolio included on all plans, including free. Pro from $49.50/mo.',
  },
  url: 'https://projectcheckin.com',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a Job Portfolio on ProjectCheckin?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Job Portfolio is a public page at a URL specific to your business — projectcheckin.com/portfolio/your-business. It displays every job you have published from your dashboard, organized by job type with photos, location, and date. Visitors can filter by job category and click through to individual job pages for more detail. The portfolio updates automatically each time you publish a new job — no separate maintenance required.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do jobs get added to the portfolio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Jobs are added to your portfolio when you click Publish on a job record in your dashboard. When a job is submitted through the check-in app, it appears in your private dashboard first. You review it, and when it is ready, you publish it. Publishing makes the job live as a public page and adds it to your portfolio at the same time. Jobs that have not been published do not appear in the portfolio.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I control which jobs appear in my portfolio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Only published jobs appear in your portfolio. Jobs that have been submitted but not yet published remain in your private dashboard and are not visible publicly. If you publish a job and later want to remove it from your portfolio, you can unpublish it from your dashboard and it will be removed from the public view.',
      },
    },
    {
      '@type': 'Question',
      name: 'What information is visible on the public portfolio page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The public portfolio shows the job type, the city and state where the work was done, the photos submitted with the job, and the date the job was completed. Each job card links to a full job page with all associated photos and a description. Your business phone number and website link appear at the top of your portfolio page. Customer names, customer contact details, and internal dashboard notes are never shown publicly.',
      },
    },
    {
      '@type': 'Question',
      name: "Is my customer's information visible on the portfolio?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Customer names, phone numbers, and email addresses are stored in your private dashboard only. They are never shown on your public portfolio or on individual public job pages. The public view shows job type, location, photos, and dates — all of which are work documentation, not customer data.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can anyone see my portfolio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes — your portfolio is a public page. Anyone with the URL can view it without logging in. That is by design: you share the URL with anyone so they can see your work without needing an account. Your dashboard, by contrast, is private and requires authentication. Only you and the admin users you have authorized can access dashboard data.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between the dashboard and the portfolio?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The dashboard is your private workspace — where job submissions land, where you manage records, publish jobs, send review requests, and view all data associated with your account. Only you and authorized admin users can access it. The portfolio is the public-facing output — a shareable gallery at a public URL that shows only the jobs you have chosen to publish. Publishing from your dashboard is what creates and keeps your portfolio current.',
      },
    },
  ],
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to build a shareable job portfolio with ProjectCheckin',
  description:
    'Every job submitted through ProjectCheckin and published from the dashboard appears in a shareable public portfolio automatically — no separate gallery to maintain.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Submit a job through the check-in app',
      text: 'Your crew checks in after the job is done — photos, location, job type, and any notes. The record appears in your private dashboard immediately.',
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'Review and publish from your dashboard',
      text: 'Review the job record in your dashboard. When it looks right, click Publish. The job goes live as a public page and is added to your portfolio at the same time — one action produces both results.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Share the portfolio link',
      text: 'Your portfolio URL stays the same — add it to your email signature, bid proposals, Google Business Profile, or text it directly. Every new job you publish appears there automatically. The link is always current.',
    },
  ],
}

export default function PortfolioPage() {
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
        <Portfolio />
      </Suspense>
    </>
  )
}
