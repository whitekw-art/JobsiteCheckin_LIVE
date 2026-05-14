import { Suspense } from 'react'
import { Metadata } from 'next'
import GBPPostGenerator from '@/components/GBPPostGenerator'

export const metadata: Metadata = {
  title: 'GBP Post Generator — Post Completed Jobs to Google Business Profile | ProjectCheckin',
  description:
    'Every job you publish can post to your Google Business Profile automatically. One button from your dashboard — ProjectCheckin writes the caption, attaches the photo, and posts it.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/gbp-post-generator',
  },
  openGraph: {
    title: 'GBP Post Generator — Post Completed Jobs to Google Business Profile',
    description:
      'Every job you publish can post to your Google Business Profile automatically. One button from your dashboard — ProjectCheckin writes the caption, attaches the photo, and posts it.',
    url: 'https://projectcheckin.com/features/gbp-post-generator',
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
      name: 'GBP Post Generator',
      item: 'https://projectcheckin.com/features/gbp-post-generator',
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
    'ProjectCheckin lets field service teams document completed jobs with photos and notes, then post those jobs to Google Business Profile automatically — one click from the dashboard.',
  featureList: [
    'One-click GBP posting from the dashboard',
    'Auto-generated post captions from job data',
    'Job photos attached to every post',
    'Google Search and Google Maps visibility',
    'Consistent posting cadence without extra work',
  ],
  offers: {
    '@type': 'Offer',
    price: '49.50',
    priceCurrency: 'USD',
    description: 'GBP Post Generator included on Pro, Elite, and Titan plans. Pro from $49.50/mo.',
  },
  url: 'https://projectcheckin.com',
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a GBP Post and where does it appear?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "A Google Business Profile (GBP) Post is a short update — photo plus caption — that appears on your business listing when someone searches for you in Google Search or Google Maps. It shows up in the 'Updates' section of your profile and is visible to anyone who finds your business on Google.",
      },
    },
    {
      '@type': 'Question',
      name: 'What does the auto-generated caption say?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "ProjectCheckin generates a caption from the job data your crew already entered: service type, city, and any notes. A typical post looks like: 'Iron door installation completed in Huntsville, AL. See the full project — photos, details, and more — on our project page.' The caption includes a link to the full Local Job Page for more detail.",
      },
    },
    {
      '@type': 'Question',
      name: 'Do I need to log into Google every time?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. You connect your Google Business Profile once from your Account settings. After that, clicking 'Post to Google Business' on any dashboard job card sends the post directly — no separate login, no copy-pasting, no browser switching.",
      },
    },
    {
      '@type': 'Question',
      name: 'GBP posts expire after 7 days — is that a problem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No — it works in your favor. If you publish one job per week, your Google Business Profile always shows a fresh post from the current week. The 7-day window means consistent job publishing translates directly into a constantly updated listing. Google rewards active profiles with better placement in local results.',
      },
    },
    {
      '@type': 'Question',
      name: 'How is this different from Local Job Pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Local Job Pages are permanent, indexed web pages that live on projectcheckin.com and build long-term search presence. GBP Posts are short-lived updates (7 days) that appear directly on your Google Business Profile — reaching people who are already searching for your business by name or category. They work together: the GBP post drives immediate attention, the Local Job Page captures long-term traffic.',
      },
    },
    {
      '@type': 'Question',
      name: 'Which plans include GBP posting?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "GBP posting is included on Pro, Elite, and Titan plans. Pro and Elite plans post to a job page hosted on projectcheckin.com. Titan plans post to a job page on the contractor's own domain — so the SEO credit and link authority goes directly to their own website.",
      },
    },
    {
      '@type': 'Question',
      name: "What if I don't have a Google Business Profile yet?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: "You'll need a Google Business Profile to use this feature — it's free to create at business.google.com. If you already have one but haven't verified it, Google requires verification before posts are visible. ProjectCheckin's Account settings include a step-by-step guide to connect your existing GBP.",
      },
    },
  ],
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to post a completed job to Google Business Profile with ProjectCheckin',
  description:
    'When a job is published in your dashboard, one button sends it as a Google Business Profile post — photo and caption included. No writing, no Google login required.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Publish a Job',
      text: "Your crew checks in after the job is done. You review it in the dashboard and click Publish. The job page goes live and is ready to post.",
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'Click Post to Google Business',
      text: 'A single button appears on every published job card in your dashboard. Click it. ProjectCheckin generates the caption from the job data — service type, city, notes — attaches the photo, and sends it to your Google Business Profile.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Your Listing Stays Fresh',
      text: 'The post appears in your Google Business Profile within minutes — visible in both Google Search and Google Maps to anyone searching for your business. A new job post each week means your listing always shows recent work.',
    },
  ],
}

export default function GBPPostGeneratorPage() {
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
        <GBPPostGenerator />
      </Suspense>
    </>
  )
}
