import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink, guideHint } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Google Review Requests — Help & Support' }

export default function ReviewRequestsGuidePage() {
  return (
    <DashboardShell title="Google Review Requests">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          This guide covers sending a review request to a customer after a job, following each request on the Job Dashboard, linking the customer&apos;s Google review to the job, and showing that review on the job&apos;s page.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Available on the Titan plan.
        </p>

        <GuideSection title="Before You Start" defaultOpen>
          <p style={guideP}>
            <strong style={guideStrong}>Save your Google review link.</strong> Click <strong style={guideStrong}>Account</strong> in the left sidebar, open the <strong style={guideStrong}>Connections</strong> tab, open <strong style={guideStrong}>Enable Google Business Review Requests</strong>, paste your review link and click <strong style={guideStrong}>Save</strong>. The card explains where to find the link under <strong style={guideStrong}>How to find your Google review link</strong>.
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>Connect your Google Business Profile.</strong> ProjectCheckin can record your review requests without it, but it needs the connection to read the reviews your customers post. The steps are in{' '}
            <Link href="/help/guides/gbp-connect" style={guideLink}>Connect Your Google Business Profile</Link>.
          </p>
          <p style={guidePLast}>
            <strong style={guideStrong}>Save the customer&apos;s name on each job.</strong> Open the job on the Job Dashboard and fill in <strong style={guideStrong}>Customer Info</strong>. ProjectCheckin compares this name with the reviewer&apos;s name on Google to suggest which job a review belongs to. The name stays on your dashboard and never appears on a public page.
          </p>
        </GuideSection>

        <GuideSection title="How To Send a Review Request">
          <Step n={1}>Open the <Link href="/dashboard" style={guideLink}>Job Dashboard</Link> and click the job to expand it.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Request Google Review</strong>.</Step>
          <Step n={3}>Check the customer&apos;s name, mobile number and email. Edit the message and signature if you want to.</Step>
          <Step n={4}>
            Under <strong style={guideStrong}>Send via</strong>, choose <strong style={guideStrong}>Text</strong> or <strong style={guideStrong}>Email</strong>, then click <strong style={guideStrong}>Send via Text</strong> or <strong style={guideStrong}>Send via Email</strong>.
          </Step>
          <Step n={5}>Your phone&apos;s messaging app or your email app opens with the message filled in. Send it from there.</Step>
          <p style={guidePLast}>
            The link in the message starts with <strong style={guideStrong}>projectcheckin.com/r/</strong>. When your customer taps it, ProjectCheckin records the time and sends them straight to your Google review page, so the link works exactly like your own Google link.
          </p>
          <p style={guideHint}>
            If the button briefly reads &ldquo;Preparing link&rdquo;, ProjectCheckin is creating the job&apos;s link. It takes about a second.
          </p>
        </GuideSection>

        <GuideSection title="What ProjectCheckin Records">
          <p style={guideP}>
            Each job&apos;s <strong style={guideStrong}>Google Review</strong> box on the Job Dashboard lists, for text and for email separately, how many times you clicked Send and when you last did. It also shows the automatic follow-up email when ProjectCheckin sent one, and each time the review link was opened.
          </p>
          <p style={guideP}>
            Your phone or email app sends the message, so ProjectCheckin records your click on Send and cannot confirm that the message was delivered. Clicking <strong style={guideStrong}>Copy text</strong> is not recorded as a request.
          </p>
          <p style={guidePLast}>
            Some phones and email services open links on their own to build a preview or check for viruses. ProjectCheckin ignores the ones it can recognize, but a few look like a person, so an opened link usually means your customer tapped it and occasionally means a service checked it.
          </p>
        </GuideSection>

        <GuideSection title="When a Customer Posts a Review">
          <p style={guideP}>
            ProjectCheckin checks your Google reviews once a day, and once right after you connect your Business Profile. It looks only at reviews posted after your first review request from ProjectCheckin, so older reviews never fill your dashboard. The <strong style={guideStrong}>Google Review</strong> box shows the date of the last check.
          </p>
          <p style={guideP}>
            When the reviewer&apos;s name on Google matches the customer name on a job, and the review was posted after your first request for that job, the job shows <strong style={guideStrong}>Review to confirm</strong>. A name matches when the first name and last initial are the same (&ldquo;Sarah J.&rdquo; for Sarah Johnson), or when the last name is the same (&ldquo;The Jones family&rdquo; for Mark Jones).
          </p>
          <Step n={1}>Open the job and read the review in its <strong style={guideStrong}>Google Review</strong> box. The box explains why ProjectCheckin suggested it.</Step>
          <Step n={2}>
            Click <strong style={guideStrong}>Confirm</strong> if the review is from this customer. Click <strong style={guideStrong}>Not this job</strong> if it is not, and the review moves to the list of reviews that are not linked to a job.
          </Step>
          <p style={guidePLast}>
            Nothing appears on a public page until you click Confirm. Each job can have one review, and confirming a review removes the same suggestion from any other job.
          </p>
        </GuideSection>

        <GuideSection title="Reviews That Are Not Linked to a Job">
          <p style={guideP}>
            Some reviews cannot be matched: the reviewer posted anonymously, someone else in the household wrote it, or the name on Google differs from the name you saved. These appear in the panel above your job list titled <strong style={guideStrong}>New Google reviews: which job is this for?</strong>
          </p>
          <Step n={1}>Click the panel to open it.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Link to a job</strong> under the review.</Step>
          <Step n={3}>
            Choose the job. Jobs with a review request are listed first, and the search box finds a job by customer name or address.
          </Step>
          <Step n={4}>Click <strong style={guideStrong}>Link to selected job</strong>.</Step>
          <p style={guidePLast}>
            If a review came from someone you never logged as a job, click <strong style={guideStrong}>Not from a job</strong>. It moves to a hidden list at the bottom of the panel, where <strong style={guideStrong}>Restore</strong> brings it back.
          </p>
        </GuideSection>

        <GuideSection title="Where the Review Appears">
          <p style={guideP}>
            On the job&apos;s page on ProjectCheckin, a <strong style={guideStrong}>Customer Review</strong> section shows the reviewer&apos;s name, the stars, the date, the comment and your reply when you have written one, with a link to your reviews on Google. Google does not allow review text to be changed, so the name and comment appear exactly as they are on Google.
          </p>
          <p style={guideP}>
            If your WordPress site is connected, the job&apos;s post on your site gets the same section. The stars, date and Google link are part of the post. The reviewer&apos;s name, the comment and your reply are loaded from ProjectCheckin each time the page opens, because Google allows its review content to be kept for no more than 30 days at a time.
          </p>
          <p style={guidePLast}>
            If your WordPress site was connected with an account below Administrator (error code WP-105 in the{' '}
            <Link href="/help/guides/wordpress-publish#wp-105" style={guideLink}>WordPress guide</Link>), WordPress removes the part that loads the text, and the post shows only the stars, the date and the Google link.
          </p>
        </GuideSection>

        <GuideSection title="Replying to Reviews">
          <p style={guideP}>
            You write replies on Google. ProjectCheckin reads whether a review has a reply, wherever you wrote it, and shows <strong style={guideStrong}>Replied on Google</strong> or <strong style={guideStrong}>Not replied yet</strong> on the job.
          </p>
          <p style={guidePLast}>
            A job whose review has no reply shows a red <strong style={guideStrong}>Needs reply</strong> label, and a bar above your job list counts every linked review without a reply. Your reply appears on the job&apos;s page after the next daily check.
          </p>
        </GuideSection>

        <GuideSection title="Unlinking a Review">
          <p style={guidePLast}>
            If you linked a review to the wrong job, open the job and click <strong style={guideStrong}>Unlink from this job</strong>. The review leaves the job&apos;s page and its WordPress post and returns to the unlinked list, where you can link it to the right job.
          </p>
        </GuideSection>

        <GuideSection title="If a Review Changes or Disappears">
          <p style={guideP}>
            When a customer edits a review on Google, the new text appears at the next daily check. When a customer deletes a review, it is removed from the job and its page at the next daily check.
          </p>
          <p style={guidePLast}>
            Google allows review content to be kept for no more than 30 days between checks. If ProjectCheckin cannot reach your Google profile for 29 days, usually because the connection was removed, it hides the review&apos;s details on your dashboard, the job&apos;s page and your WordPress post. The link between the review and the job is kept, and everything returns after you reconnect in <strong style={guideStrong}>Account → Connections</strong>.
          </p>
        </GuideSection>

      </div>
    </DashboardShell>
  )
}
