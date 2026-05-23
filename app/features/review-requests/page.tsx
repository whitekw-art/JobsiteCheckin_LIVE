import { Suspense } from 'react'
import { Metadata } from 'next'
import ReviewRequests from '@/components/ReviewRequests'

export const metadata: Metadata = {
  title: 'Review Requests — Get More Google Reviews After Every Job | ProjectCheckin',
  description:
    'One tap from your dashboard sends a pre-written review request from your own phone number, with your Google review link already included. No platform fees. Works by text and email.',
  alternates: {
    canonical: 'https://projectcheckin.com/features/review-requests',
  },
  openGraph: {
    title: 'Review Requests — Get More Google Reviews After Every Job',
    description:
      'One tap from your dashboard sends a pre-written review request from your own phone number, with your Google review link already included. No platform fees.',
    url: 'https://projectcheckin.com/features/review-requests',
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
      name: 'Review Requests',
      item: 'https://projectcheckin.com/features/review-requests',
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
    'ProjectCheckin lets field service teams document completed jobs and send review requests directly from their own phone — pre-written, personalized, with the Google review link already embedded.',
  featureList: [
    'One-tap review request from dashboard',
    'Pre-written message with customer name and Google review link',
    "Sends from contractor's own phone number via native Messages app",
    'Email option via native Mail app',
    'Automated follow-up email system',
    'Google review link configured once in account settings',
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
      name: 'What number does the review request text come from?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Your own phone number. The review request opens in your phone's native Messages app with the message pre-written and the recipient pre-filled. It goes from your number — not a platform or shared sending pool. The customer sees your name and number exactly as if you typed it yourself.",
      },
    },
    {
      '@type': 'Question',
      name: 'Does sending review requests cost anything extra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "No. Review Requests are included in all paid plans. There's no per-message fee because the message sends through your native Messages or Mail app. The automated follow-up email system is also included at no extra cost.",
      },
    },
    {
      '@type': 'Question',
      name: 'Can I edit the review request message before it sends?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Nothing sends automatically. The review request modal shows the pre-written message in an editable text area. Once you tap the Text or Email button, the message opens in your native app where you can make final changes before tapping send. You always control what goes out.',
      },
    },
    {
      '@type': 'Question',
      name: "What if I don't have the customer's phone number?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The review request modal shows whichever contact options you\'ve saved. If you only have email, it shows the Email button. If you only have a phone number, it shows Text. If you have both, both are available. You can add contact info at any time by editing the job record from your dashboard.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does anything send automatically, or do I always tap send?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The initial review request text or email requires your tap — nothing goes out automatically. The follow-up email system is different: once configured, it sends an automated reminder email a set number of days after the job is published. You control the timing and message template in account settings.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where do I set up my Google review link?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "In your account under Connections. There's a Google Review Link field where you paste your Google Business Profile review URL. Once saved, it's automatically included in every review request. If the link isn't configured, the modal shows a warning before you send.",
      },
    },
    {
      '@type': 'Question',
      name: 'What if Google removes a review after it\'s posted?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Google occasionally removes reviews for policy violations — usually spam detection, not anything you did wrong. The best defense is volume: the more reviews you have, the less any single removal affects your profile. A consistent ask-after-every-job system protects you better than a one-time push.",
      },
    },
  ],
}

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to send a Google review request with ProjectCheckin',
  description:
    "After finishing a job, tap Request Review on the job card. A pre-written message opens in your native Messages app with the customer's name and your Google review link already included.",
  step: [
    {
      '@type': 'HowToStep',
      position: '1',
      name: 'Save customer info during check-in',
      text: "When your crew checks in, they enter the customer's name and phone number. It takes 20 seconds and stays attached to the job record.",
    },
    {
      '@type': 'HowToStep',
      position: '2',
      name: 'Tap Request Review on the job card',
      text: 'One button in your dashboard. A pre-written message opens in your native Messages app, addressed to your customer with your Google review link already included.',
    },
    {
      '@type': 'HowToStep',
      position: '3',
      name: 'Customer gets a text from your number',
      text: 'The message goes from your own phone — not a platform. They tap the link and land directly on your Google review page, ready to write.',
    },
  ],
}

export default function ReviewRequestsPage() {
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
        <ReviewRequests />
      </Suspense>
    </>
  )
}
