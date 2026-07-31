import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Google Search Console Setup Guide — Help & Support' }

export default function GscSetupGuidePage() {
  return (
    <DashboardShell title="Google Search Console Setup Guide">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          Google Search Console is a free tool from Google that shows you what people actually searched for before they landed on your website — and how often you showed up. Once you connect it, those numbers appear right on your Reporting page in ProjectCheckin.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          You only need this guide if ProjectCheckin told you it couldn&apos;t find a verified website on your Google account. If your connection already worked, there&apos;s nothing to do here.
        </p>

        <GuideSection title="What &ldquo;Verified&rdquo; Means — Read This First" defaultOpen>
          <p style={guideP}>
            Google won&apos;t show anyone a website&apos;s search data until that person has proven they actually own the website. Google calls this <strong style={guideStrong}>verifying</strong> it. It&apos;s a one-time thing you do on Google&apos;s site, and it&apos;s free.
          </p>
          <p style={guideP}>
            This is why connecting to ProjectCheckin isn&apos;t enough on its own. Signing in with Google lets us <em>ask</em> for your data — but if you&apos;ve never verified your website with Google, there&apos;s simply no data there yet for us to show you.
          </p>
          <p style={guidePLast}>
            The whole process below usually takes about 10-15 minutes, plus a wait of a few days before real numbers start appearing.
          </p>
        </GuideSection>

        <GuideSection title="Step 1 — Add Your Website to Google Search Console">
          <Step n={1}>Go to <strong style={guideStrong}>search.google.com/search-console</strong> and sign in with the same Google account you use for your business.</Step>
          <Step n={2}>If this is your first time, Google shows you a &ldquo;Welcome&rdquo; screen asking for a website. If you&apos;ve been here before, click the dropdown in the top-left and choose <strong style={guideStrong}>Add property</strong>.</Step>
          <Step n={3}>You&apos;ll see two boxes side by side: <strong style={guideStrong}>Domain</strong> and <strong style={guideStrong}>URL prefix</strong>. Use the <strong style={guideStrong}>URL prefix</strong> box on the right — it&apos;s the easier of the two to verify.</Step>
          <Step n={4}>Type your full website address exactly as it appears in your browser, including the <code>https://</code> part (for example <code>https://www.yourbusiness.com</code>), then click <strong style={guideStrong}>Continue</strong>.</Step>
          <p style={guidePLast}>
            Google now asks you to prove you own it. That&apos;s the next step.
          </p>
        </GuideSection>

        <GuideSection title="Step 2 — Prove You Own It (Pick the Easiest Option)">
          <p style={guideP}>
            Google offers several ways to verify. You only need <strong style={guideStrong}>one</strong> of them to work. They&apos;re listed below easiest-first — try them in this order.
          </p>
          <p style={guideP}><strong style={guideStrong}>Option A — Already use Google Analytics?</strong> If your website already has Google Analytics on it, and it&apos;s under this same Google account, expand the <strong style={guideStrong}>Google Analytics</strong> option and click <strong style={guideStrong}>Verify</strong>. It usually works instantly with nothing else to do.</p>
          <p style={guideP}><strong style={guideStrong}>Option B — Already use Google Tag Manager?</strong> Same idea. Expand <strong style={guideStrong}>Google Tag Manager</strong> and click <strong style={guideStrong}>Verify</strong>.</p>
          <p style={guideP}><strong style={guideStrong}>Option C — The HTML file.</strong> Expand <strong style={guideStrong}>HTML file</strong>, download the small file Google gives you, and upload it to your website so it sits at the top level (so it&apos;s reachable at something like <code>yourbusiness.com/google123abc.html</code>). If someone else manages your website, forward them the file and ask them to &ldquo;upload this to the root of the site&rdquo; — it&apos;s a routine request and takes them a minute. Then come back and click <strong style={guideStrong}>Verify</strong>.</p>
          <p style={guideP}><strong style={guideStrong}>Option D — The HTML tag.</strong> Expand <strong style={guideStrong}>HTML tag</strong> and copy the line of code. If your site runs on WordPress, Squarespace, Wix, or Webflow, each has a box in its settings for exactly this kind of code — usually labelled something like &ldquo;header code,&rdquo; &ldquo;custom code,&rdquo; or &ldquo;code injection.&rdquo; Paste it there, save, then click <strong style={guideStrong}>Verify</strong>.</p>
          <p style={guidePLast}>
            Once any one of these succeeds, you&apos;ll see a &ldquo;Ownership verified&rdquo; message. That&apos;s the hard part done.
          </p>
        </GuideSection>

        <GuideSection title="Step 3 — Connect It To ProjectCheckin">
          <Step n={1}>Come back to ProjectCheckin and click <strong style={guideStrong}>Account</strong> in the left sidebar.</Step>
          <Step n={2}>Click the <strong style={guideStrong}>Connections</strong> tab.</Step>
          <Step n={3}>Find <strong style={guideStrong}>Connect Google Search Console</strong> and click it to expand it.</Step>
          <Step n={4}>If you already connected before and just verified your site now, click <strong style={guideStrong}>Check again</strong> — you don&apos;t need to sign in a second time. Otherwise click <strong style={guideStrong}>Connect Google Search Console</strong> and approve the request on Google&apos;s screen.</Step>
          <Step n={5}>If you have more than one website on your Google account, pick the one you want from the dropdown and click <strong style={guideStrong}>Save selection</strong>.</Step>
          <p style={guidePLast}>
            That&apos;s it. Your search numbers will show on the <Link href="/reporting" style={guideLink}>Reporting</Link> page.
          </p>
        </GuideSection>

        <GuideSection title="Why Am I Seeing Zeros?">
          <p style={guideP}>
            This is normal and almost never a mistake. Google only starts collecting your search data <strong style={guideStrong}>from the day you verify</strong> — it doesn&apos;t backfill history you missed. Expect a few days before numbers appear, and a couple of weeks before they mean much.
          </p>
          <p style={guidePLast}>
            Google&apos;s data also runs two to three days behind, so the last day or two will always look emptier than it really is. That&apos;s Google&apos;s reporting delay, not a problem with your website or with ProjectCheckin.
          </p>
        </GuideSection>

        <GuideSection title="Still Stuck?">
          <p style={guidePLast}>
            If verification keeps failing, or you&apos;re not sure who manages your website, get in touch from the <Link href="/help" style={guideLink}>Help &amp; Support</Link> page and we&apos;ll walk through it with you.
          </p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
