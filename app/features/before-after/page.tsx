import { Suspense } from 'react'
import { Metadata } from 'next'
import BeforeAfter from '@/components/BeforeAfter'

export const metadata: Metadata = {
  title: 'Before & After Photos — Show Transformations That Close Jobs | ProjectCheckin',
  description:
    'Your crew tags a photo Before and After on every job. ProjectCheckin pairs them and publishes a drag-to-reveal slider on the public job page automatically. No editing. No extra steps.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/before-after',
  },
  openGraph: {
    title: 'Before & After Photos — Show Transformations That Close Jobs',
    description:
      'Your crew tags a photo Before and After on every job. ProjectCheckin pairs them and publishes a drag-to-reveal slider on the public job page automatically. No editing. No extra steps.',
    url: 'https://projectcheckin.com/features/before-after',
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
      name: 'Before & After',
      item: 'https://projectcheckin.com/features/before-after',
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
    'ProjectCheckin lets field service teams document completed jobs with photos and notes, automatically publishing before/after comparison sliders and indexed local job pages.',
  featureList: [
    'Before/After photo tagging',
    'Ghost overlay camera for matched shots',
    'Drag-to-reveal comparison slider on public job pages',
    'GPS-tagged and timestamped job documentation',
    'Automatic local job page creation',
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
      name: 'Does my crew need to take photos in any specific order?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No specific order required. In the check-in form, there are Before and After tag buttons for each photo. Your crew can tag them at any point — while photographing, after the job, or when publishing. The ghost overlay camera appears automatically when they tap After and select which Before photo to pair with it.',
      },
    },
    {
      '@type': 'Question',
      name: 'What if the crew forgets to take the before photo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "The job publishes normally with all other photos. The slider only appears on the job page when both a Before and After photo are present. If only one is tagged, the photo still saves to the job record and your gallery — it just won't create a slider. No data is lost and the rest of the job page is unaffected.",
      },
    },
    {
      '@type': 'Question',
      name: "Can I use this for jobs that aren't visible transformations?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. HVAC techs photograph the old unit and the new installation. Electricians photograph the old panel and the upgraded one. Plumbers photograph the problem and the fix. Any job that starts in one state and ends in another — which is nearly every service call — produces a meaningful before/after.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where does the slider appear?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The drag-to-reveal slider appears automatically on the public job page when both a Before and After photo are tagged and the job is published. The same job page also shows your other job photos, business info, and a contact/estimate button. The slider is the featured element at the top of the page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I do multiple before/after pairs on one job?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can tag multiple photos as Before and multiple as After on the same job. The job page will display the primary pair as the featured slider, with the remaining tagged photos in the photo gallery below. Large jobs — like a whole-house repaint or a multi-room remodel — can show several distinct before/after moments.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is the before photo visible to the public?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Yes — and that's the point. The before photo is what makes the after meaningful. Prospects need to see where you started to appreciate what you delivered. The slider keeps both in view simultaneously, letting anyone drag back and forth to see the full extent of the work. The before photo isn't a liability — it's the evidence that makes the after photo a proof of skill.",
      },
    },
  ],
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to publish a before/after comparison slider with ProjectCheckin',
  description:
    'When your crew finishes a job, they tag a Before and After photo in the app. ProjectCheckin automatically publishes a drag-to-reveal comparison slider on the public job page.',
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Tag the Before',
      text: 'When your crew arrives, they open the app, tap Before, and take a photo. The photo is GPS-tagged and timestamped automatically.',
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'Ghost Camera Guides the After',
      text: 'When the job is done, they tap After. The before photo appears at 40% opacity on screen — a ghost — so they can line up the same angle and shoot a perfectly matched after shot.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Slider Goes Live',
      text: 'Publish the job and the drag-to-reveal comparison slider appears automatically on the public job page. Prospects can drag left and right to see the full transformation. No editing or design work required.',
    },
  ],
}

export default function BeforeAfterPage() {
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
        <BeforeAfter />
      </Suspense>
    </>
  )
}
