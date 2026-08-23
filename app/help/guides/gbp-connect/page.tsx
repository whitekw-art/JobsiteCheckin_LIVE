import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink, guideHint } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Connect Your Google Business Profile — Help & Support' }

export default function GbpConnectGuidePage() {
  return (
    <DashboardShell title="Connect Your Google Business Profile">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          Connecting takes about 30 seconds. After that, you can send a finished job straight to your Google listing — photo, description, and a link back to your work — without leaving ProjectCheckin.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Available on the Elite and Titan plans.
        </p>

        <GuideSection title="Before You Start — One Requirement" defaultOpen>
          <p style={guideP}>
            You need a Google Business Profile that is already <strong style={guideStrong}>verified</strong> and managed by a Google account you can sign into. That&apos;s the listing that shows up on Google Maps and in the box on the right when someone searches your business name.
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>Not sure whether you have one?</strong> Search your business name on Google. If a panel appears with your address, hours, and photos, and you see options to edit it when signed in, you have one.
          </p>
          <p style={guidePLast}>
            If you don&apos;t have one yet, or someone else set it up and you can&apos;t get in, work through the <strong style={guideStrong}>I Don&apos;t Have a Profile Yet</strong> section further down first.
          </p>
        </GuideSection>

        <GuideSection title="How To Connect">
          <Step n={1}>In ProjectCheckin, click <strong style={guideStrong}>Account</strong> in the left sidebar.</Step>
          <Step n={2}>Click the <strong style={guideStrong}>Connections</strong> tab at the top.</Step>
          <Step n={3}>Find <strong style={guideStrong}>Connect Your Google Business Profile</strong> and click it to open it.</Step>
          <Step n={4}>Click the <strong style={guideStrong}>Connect Google Business Profile</strong> button.</Step>
          <Step n={5}>
            Google takes over and asks which Google account to use. <strong style={guideStrong}>Pick the account that manages your business listing</strong> — see the next section if you&apos;re not certain which one that is.
          </Step>
          <Step n={6}>Google shows what ProjectCheckin is asking permission to do. Click <strong style={guideStrong}>Continue</strong> or <strong style={guideStrong}>Allow</strong>.</Step>
          <Step n={7}>You land back in ProjectCheckin automatically. The card now says <strong style={guideStrong}>Active</strong> with a green dot, and shows which business it&apos;s connected to.</Step>
          <p style={guidePLast}>
            That&apos;s it. Go to your <Link href="/dashboard" style={guideLink}>Job Dashboard</Link>, open any published job, and you&apos;ll see a <strong style={guideStrong}>Post to Google</strong> button.
          </p>
          <p style={guideHint}>
            We never see or store your Google password. Google handles the sign-in and only tells us that you approved access.
          </p>
        </GuideSection>

        <GuideSection title="Which Google Account Do I Pick?">
          <p style={guideP}>
            This is the step people get wrong most often, so it&apos;s worth slowing down for.
          </p>
          <p style={guideP}>
            Google shows the accounts <strong style={guideStrong}>you</strong> are signed into on <strong style={guideStrong}>your</strong> device. You want the one that manages your business listing — often a business address, sometimes an old personal Gmail you used when the business was new.
          </p>
          <p style={guideP}>
            If you pick the wrong one, the connection still succeeds, but that account manages no business. You&apos;ll see a message saying no business listing was found. Nothing breaks — just connect again with the right account.
          </p>
          <p style={guidePLast}>
            <strong style={guideStrong}>Can&apos;t remember which account?</strong> Go to <strong style={guideStrong}>business.google.com</strong> and sign in. Whichever account shows your business there is the one to use. Your email address appears in the top-right corner of that page.
          </p>
        </GuideSection>

        <GuideSection title="It Says No Business Listing Was Found">
          <p style={guideP}>
            This is the most common message people hit, and it almost always means one of two things.
          </p>
          <Step n={1}>
            <strong style={guideStrong}>You signed in with the wrong Google account.</strong> Click <strong style={guideStrong}>Try a different Google account</strong> on the card and pick the one that manages your listing. This is the likelier of the two by a wide margin.
          </Step>
          <Step n={2}>
            <strong style={guideStrong}>You don&apos;t have a verified profile yet.</strong> Work through the next section, then come back and click <strong style={guideStrong}>Check again</strong> on the card. You will not have to sign in a second time.
          </Step>
          <p style={guidePLast}>
            Both buttons are right on the card in <strong style={guideStrong}>Account → Connections</strong>.
          </p>
        </GuideSection>

        <GuideSection title="I Don't Have a Profile Yet">
          <p style={guideP}>
            Setting one up is free and worth doing regardless of ProjectCheckin — it&apos;s how you show up on Google Maps at all. Google&apos;s own instructions are the ones to follow, since their screens change from time to time:
          </p>
          <Step n={1}>
            Go to <strong style={guideStrong}>business.google.com/add</strong> and click <strong style={guideStrong}>Add your business to Google</strong>.
          </Step>
          <Step n={2}>
            Enter your business name and follow the prompts for category, service area, phone, and website.
          </Step>
          <Step n={3}>
            <strong style={guideStrong}>Choose your business category carefully.</strong> Pick the narrowest one that&apos;s actually accurate — &ldquo;Garage Door Supplier&rdquo; rather than &ldquo;Contractor.&rdquo; It affects which searches you turn up in more than any other single field.
          </Step>
          <Step n={4}>
            If you work at customers&apos; homes rather than from a storefront, say so when Google asks. Setting yourself up as a storefront when you don&apos;t have one customers can visit is the most common reason profiles get suspended.
          </Step>
          <Step n={5}>
            Verify the business. Google picks which methods you&apos;re offered based on your business type and location — usually some combination of phone, text, email, a video call, or a postcard sent to your address.
          </Step>
          <p style={guideP}>
            Verification review can take up to five business days. Postcards take longer — most arrive within 14 days, and the code expires after 30. While you&apos;re waiting, <strong style={guideStrong}>don&apos;t change your business name, address, or category</strong>, because that cancels the code and you start over.
          </p>
          <p style={guidePLast}>
            If Google offers a <strong style={guideStrong}>video call</strong>, you&apos;ll need to be at your business location during business hours, ready to show signage, your equipment or vehicles, and something proving you run the place — keys, a work area, that sort of thing. Have it lined up before you start the call.
          </p>
          <p style={guideHint}>
            Full details, and the current list of what Google accepts, are on Google&apos;s own help pages at support.google.com/business.
          </p>
        </GuideSection>

        <GuideSection title="Someone Else Already Claimed My Business">
          <p style={guideP}>
            This happens more than you&apos;d think — an old employee, a web designer, or a marketing company set it up years ago and still holds it.
          </p>
          <p style={guideP}>
            Google won&apos;t hand a verified profile over automatically. Search your business on Google Maps, select the listing, and choose the option to claim it. Google will walk you through <strong style={guideStrong}>requesting ownership from whoever currently holds it</strong>, and contacts them on your behalf.
          </p>
          <p style={guidePLast}>
            If they don&apos;t respond within a few days, Google may let you take over. This is worth starting sooner rather than later, since the waiting period runs regardless of what else you&apos;re doing.
          </p>
        </GuideSection>

        <GuideSection title="I Manage More Than One Location">
          <p style={guideP}>
            If your Google account manages several businesses, we ask which one to post to. Pick it from the dropdown and click <strong style={guideStrong}>Save selection</strong>.
          </p>
          <p style={guidePLast}>
            Right now ProjectCheckin posts to <strong style={guideStrong}>one listing at a time</strong>. Choose your main one. To switch later, disconnect and connect again, then pick the other.
          </p>
        </GuideSection>

        <GuideSection title="How Posting Works">
          <p style={guideP}>
            Once connected, every published job gets a <strong style={guideStrong}>Post to Google</strong> button on its card in your Job Dashboard. One click sends the job type, location, your description, a photo, and a link.
          </p>
          <p style={guideP}>
            You can also turn on <strong style={guideStrong}>Post jobs automatically</strong> in the same Connections card. With that on, publishing a job sends it to Google on its own — you don&apos;t have to click anything.
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>Google archives a post after 6 months.</strong> That&apos;s Google&apos;s own behavior, not a limit we set. It&apos;s also the reason posting as you finish work matters — a listing showing this month&apos;s jobs reads as an active business, and one showing work from two years ago doesn&apos;t.
          </p>
          <p style={guidePLast}>
            Changed your mind about a job? <strong style={guideStrong}>Remove from Google</strong> on the job card takes the post down. Unpublishing a job removes its post automatically, too.
          </p>
        </GuideSection>

        <GuideSection title="How To Disconnect">
          <Step n={1}>Go to <strong style={guideStrong}>Account</strong> → <strong style={guideStrong}>Connections</strong>.</Step>
          <Step n={2}>Open the <strong style={guideStrong}>Connect Your Google Business Profile</strong> card.</Step>
          <Step n={3}>Click <strong style={guideStrong}>Disconnect</strong> and confirm.</Step>
          <p style={guidePLast}>
            Your Google Business Profile itself is untouched, and <strong style={guideStrong}>posts already on your listing stay there</strong> — they&apos;re your content on your profile. This only stops ProjectCheckin from adding new ones.
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
