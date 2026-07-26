import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'WordPress Publishing Guide — Help & Support' }

export default function WordPressPublishingGuidePage() {
  return (
    <DashboardShell title="WordPress Publishing Guide">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          This guide shows you how to send your ProjectCheckin jobs straight onto your own WordPress website. Once it&apos;s set up, every new job you publish shows up on your site on its own — you don&apos;t have to touch it again.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          This is the deepest way to connect your work to your site. If you want the paste-in widget or your own web address instead, see the <Link href="/help/guides/widget-install" style={guideLink}>Widget Installation Guide</Link> or the <Link href="/help/guides/cname-hosting" style={guideLink}>CNAME Subdomain Hosting Guide</Link>.
        </p>

        <GuideSection title="Before You Start" defaultOpen>
          <p style={guideP}>You need two things:</p>
          <Step n={1}>A WordPress site that&apos;s live on the internet (not one running only on your own computer).</Step>
          <Step n={2}>A WordPress account with full admin rights.</Step>
        </GuideSection>

        <GuideSection title="Step 1 — Connect Your Site">
          <Step n={1}>Log into ProjectCheckin. Click <strong style={guideStrong}>Account</strong>, then the <strong style={guideStrong}>Connections</strong> tab.</Step>
          <Step n={2}>Find <strong style={guideStrong}>Publish Into Your WordPress Site</strong> and open it.</Step>
          <Step n={3}>In a second tab, log into your WordPress admin. Go to <strong style={guideStrong}>Users → Profile → Application Passwords</strong>. Type &ldquo;ProjectCheckin&rdquo; as the name and click <strong style={guideStrong}>Add New Application Password</strong>. Copy the password it shows you — WordPress only shows it once.</Step>
          <Step n={4}>Back in ProjectCheckin, type your site address, your WordPress username, and the password you copied. Click <strong style={guideStrong}>Connect WordPress</strong>.</Step>
          <p style={guideP}>You should see a green <strong style={guideStrong}>Connected</strong> tag. From now on, every job you publish goes to your site on its own.</p>
          <p style={guidePLast}><strong style={guideStrong}>Good to know:</strong> When you first connect, ProjectCheckin also sends up any jobs you already published in the past. You don&apos;t have to re-publish them by hand.</p>
        </GuideSection>

        <GuideSection title="Step 2 — Decide Where Your Jobs Go">
          <p style={guideP}>You have two choices for each job. You can use both at the same time.</p>
          <p style={guideP}><strong style={guideStrong}>Choice A — Let ProjectCheckin make a new post for each job.</strong> This is the default. If you do nothing else, every job becomes its own blog post on your site, found under <strong style={guideStrong}>Posts → All Posts</strong> in your WordPress admin. Each one gets a clean web address based on the job, like <code>yoursite.com/wood-doors-atlanta-ga/</code>. WordPress also groups these posts into automatic list pages by service and by city. This is a great catch-all for one-off jobs in places you don&apos;t have a page for yet.</p>
          <p style={guideP}><strong style={guideStrong}>Choice B — Feed jobs into a page you already have.</strong> Already have a page that ranks — like an &ldquo;Areas We Serve&rdquo; page or a service page? Point ProjectCheckin at it, and matching jobs get added right onto that page. Your own words on the page are never changed or deleted. We only ever add job content.</p>
          <p style={guideP}><strong style={guideStrong}>To set up Choice B:</strong></p>
          <Step n={1}>In the WordPress card, click <strong style={guideStrong}>Add a page</strong>.</Step>
          <Step n={2}>Pick the location and/or service these jobs cover (or leave them on &ldquo;Any&rdquo;).</Step>
          <Step n={3}>Paste the full web address of your page.</Step>
          <Step n={4}>Click <strong style={guideStrong}>Save page</strong>.</Step>
        </GuideSection>

        <GuideSection title="Step 3 (Optional) — Choose Exactly Where Jobs Land on the Page">
          <p style={guideP}>By default, jobs are added to the bottom of the page. If you want them somewhere specific, place a marker where you want them:</p>
          <Step n={1}>In the <strong style={guideStrong}>Add a page</strong> form, click <strong style={guideStrong}>Optional: choose exactly where it lands</strong> and copy the marker.</Step>
          <Step n={2}>Open your page in WordPress. Click the three-dot menu (top-right) and choose <strong style={guideStrong}>Code editor</strong>.</Step>
          <Step n={3}>The page turns into plain text. Click the exact spot where you want jobs to appear.</Step>
          <Step n={4}>Paste the marker.</Step>
          <Step n={5}>Click the three-dot menu again and choose <strong style={guideStrong}>Exit code editor</strong>. Then click <strong style={guideStrong}>Update</strong>.</Step>
          <p style={guidePLast}><strong style={guideStrong}>Important:</strong> Don&apos;t paste the marker into the normal editor view — WordPress quietly drops it. Use the Code editor, like the steps above.</p>
        </GuideSection>

        <GuideSection title="How to Get the Most SEO Value">
          <p style={guideP}>Follow these three steps in order. Each one matters most before you move to the next.</p>
          <p style={guideP}><strong style={guideStrong}>Step 1 — Map the pages you already have first.</strong> If you have a page with real history — even one that only matches the city (a &ldquo;Charleston&rdquo; page) or only the service (an &ldquo;Iron Doors&rdquo; page) — map it. An older page almost always outranks a brand-new one. Point your jobs at these first.</p>
          <p style={guideP}><strong style={guideStrong}>Step 2 — Then build new city + service pages for your top work.</strong> Once your existing pages are mapped (or if you don&apos;t have any worth using), make a fresh page on your site for each main city-and-service you want to win — like &ldquo;Charleston Iron Doors.&rdquo; A new page starts with no history and can take months to climb, so only do this for your most important work. Then map your jobs to it.</p>
          <p style={guideP}><strong style={guideStrong}>Step 3 — Do nothing for everything else.</strong> Any job that doesn&apos;t match a page you mapped becomes its own blog post on its own (Choice A above). That&apos;s steady, hands-off coverage for your one-off jobs.</p>
          <p style={guidePLast}><strong style={guideStrong}>In short:</strong> use existing pages first, then build new pages only for your top city-and-service combos, and let the rest fill in on its own.</p>
        </GuideSection>

        <GuideSection title="If You Ever Cancel">
          <p style={guidePLast}>If you downgrade or cancel, your job content is taken back off your WordPress site, but your own pages are never changed or deleted. Nothing is lost in ProjectCheckin. The moment you return to the Titan plan, everything comes back on its own.</p>
        </GuideSection>

        <GuideSection title="Need Help?">
          <p style={guidePLast}>If you get stuck on any step above, reach out and we&apos;ll walk you through it.</p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
