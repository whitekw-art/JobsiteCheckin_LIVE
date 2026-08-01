import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink, guideHint } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Connect Google Search Console — Help & Support' }

export default function GscConnectGuidePage() {
  return (
    <DashboardShell title="Connect Google Search Console">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          Connecting takes about 30 seconds. Once it&apos;s done, your real Google search numbers show up on your Reporting page — what people searched for, how often you appeared, and how many clicked through.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Available on the Elite and Titan plans.
        </p>

        <GuideSection title="Before You Start — One Requirement" defaultOpen>
          <p style={guideP}>
            You need Google Search Console already set up for your website, under a Google account you can sign into.
          </p>
          <p style={guideP}>
            If you&apos;ve never set that up, do the <Link href="/help/guides/gsc-setup" style={guideLink}>Set Up Google Search Console</Link> guide first. Connecting without it will work, but there will be no data for us to show you.
          </p>
          <p style={guidePLast}>
            <strong style={guideStrong}>Not sure whether you have it?</strong> Go to <strong style={guideStrong}>search.google.com/search-console</strong> and sign in. If you see your website listed with charts, you&apos;re set. If it asks you to add a website, you need the setup guide first.
          </p>
        </GuideSection>

        <GuideSection title="How To Connect">
          <Step n={1}>In ProjectCheckin, click <strong style={guideStrong}>Account</strong> in the left sidebar.</Step>
          <Step n={2}>Click the <strong style={guideStrong}>Connections</strong> tab at the top.</Step>
          <Step n={3}>Find <strong style={guideStrong}>Connect Google Search Console</strong> and click it to open it.</Step>
          <Step n={4}>Click the blue <strong style={guideStrong}>Connect Google Search Console</strong> button.</Step>
          <Step n={5}>
            Google takes over from here and asks you to choose a Google account. <strong style={guideStrong}>Pick the account that has your Search Console on it</strong> — see the section below if you&apos;re not sure which one that is.
          </Step>
          <Step n={6}>Google shows what ProjectCheckin is asking for: permission to view your Search Console data. Click <strong style={guideStrong}>Continue</strong> or <strong style={guideStrong}>Allow</strong>.</Step>
          <Step n={7}>You land back in ProjectCheckin automatically. The card now says <strong style={guideStrong}>Active</strong> with a green dot.</Step>
          <p style={guidePLast}>
            That&apos;s the whole thing. Click <Link href="/reporting" style={guideLink}>Reporting</Link> in the sidebar to see your numbers.
          </p>
          <p style={guideHint}>
            We never see or store your Google password. Google handles the sign-in and only tells us that you approved access.
          </p>
        </GuideSection>

        <GuideSection title="Which Google Account Do I Pick?">
          <p style={guideP}>
            This is the one step people get wrong, so it&apos;s worth being careful.
          </p>
          <p style={guideP}>
            Google shows you the accounts <strong style={guideStrong}>you</strong> are signed into on <strong style={guideStrong}>your</strong> computer. Pick the one you used when you set up Search Console for your website.
          </p>
          <p style={guideP}>
            If you pick a different Google account — a personal one, or an old business address — the connection still succeeds, but that account has no website attached to it. You&apos;ll get a message saying no verified website was found. Nothing breaks; just disconnect and reconnect with the right account.
          </p>
          <p style={guidePLast}>
            <strong style={guideStrong}>Can&apos;t remember which account?</strong> Go to <strong style={guideStrong}>search.google.com/search-console</strong>. Whichever account shows your website there is the one to use. Your email address is in the top-right corner of that page.
          </p>
        </GuideSection>

        <GuideSection title="It Asked Me To Choose A Website">
          <p style={guideP}>
            If your Google account has more than one website in Search Console, we ask which one to report on. Pick your main business website from the dropdown and click <strong style={guideStrong}>Save selection</strong>.
          </p>
          <p style={guidePLast}>
            Only one website at a time shows on your Reporting page. To switch later, disconnect and connect again, then choose the other one.
          </p>
        </GuideSection>

        <GuideSection title="It Says No Verified Website Was Found">
          <p style={guideP}>
            This means the Google account you picked doesn&apos;t own any website in Search Console yet. It&apos;s the most common message people see, and it&apos;s easy to sort out. Two possibilities:
          </p>
          <Step n={1}>
            <strong style={guideStrong}>You picked the wrong Google account.</strong> Click <strong style={guideStrong}>Disconnect</strong>, then connect again and choose the right one.
          </Step>
          <Step n={2}>
            <strong style={guideStrong}>You haven&apos;t set up Search Console yet.</strong> Follow the <Link href="/help/guides/gsc-setup" style={guideLink}>Set Up Google Search Console</Link> guide, then come back here and click <strong style={guideStrong}>Check again</strong>. You will not need to sign in a second time.
          </Step>
          <p style={guidePLast}>
            The <strong style={guideStrong}>Check again</strong> button is right on the card — use it after you finish verifying with Google.
          </p>
        </GuideSection>

        <GuideSection title="My Numbers Are All Zero">
          <p style={guideP}>
            Normal, especially in the first couple of weeks. Google only records search data <strong style={guideStrong}>from the day you verified your website</strong> — it doesn&apos;t backfill anything from before that.
          </p>
          <p style={guidePLast}>
            Google&apos;s reporting also runs two to three days behind. The most recent days will always look emptier than they really are. Give it two to three weeks before judging the numbers.
          </p>
        </GuideSection>

        <GuideSection title="How To Disconnect">
          <Step n={1}>Go to <strong style={guideStrong}>Account</strong> → <strong style={guideStrong}>Connections</strong>.</Step>
          <Step n={2}>Open the <strong style={guideStrong}>Connect Google Search Console</strong> card.</Step>
          <Step n={3}>Click <strong style={guideStrong}>Disconnect</strong> and confirm.</Step>
          <p style={guidePLast}>
            Your Search Console account itself is untouched — this only stops ProjectCheckin from reading it. Your search data disappears from your Reporting page until you connect again. Nothing in Google is deleted, ever.
          </p>
        </GuideSection>

        <GuideSection title="Still Stuck?">
          <p style={guidePLast}>
            Get in touch from the <Link href="/help" style={guideLink}>Help &amp; Support</Link> page and we&apos;ll walk through it with you.
          </p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
