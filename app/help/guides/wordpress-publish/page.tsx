import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, GuideSubsection, Step, guideP, guidePLast, guideStrong, guideLink } from '@/components/HelpGuideSections'

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

        <GuideSection title="Step 2 — How Your Jobs Appear">
          <p style={guideP}><strong style={guideStrong}>Every job always becomes its own post.</strong> When you publish a job, ProjectCheckin makes it a permanent post on your site, found under <strong style={guideStrong}>Posts → All Posts</strong>. Each gets a clean web address like <code>yoursite.com/wood-doors-atlanta-ga/</code>, its full photos, and search-friendly data. WordPress also groups these posts into automatic list pages by service and by city. This is the engine behind your SEO — nothing ever disappears.</p>
          <p style={guideP}><strong style={guideStrong}>On top of that, you can highlight jobs on pages you already have.</strong> Have a page that ranks — like an &ldquo;Areas We Serve&rdquo; or a service page? Point ProjectCheckin at it, and your recent matching jobs show up there as a short list, each linking to its full post. Your own words on the page are never changed or deleted — we only add the highlight list, and it sends visitors and search authority to your posts.</p>
          <p style={guideP}><strong style={guideStrong}>To highlight jobs on an existing page:</strong></p>
          <Step n={1}>In the WordPress card, click <strong style={guideStrong}>Add a page</strong>.</Step>
          <Step n={2}>Pick the location and/or service these jobs cover (or leave them on &ldquo;Any&rdquo; for a catch-all).</Step>
          <Step n={3}>Paste the full web address of your page.</Step>
          <Step n={4}>Click <strong style={guideStrong}>Save page</strong>.</Step>
        </GuideSection>

        <GuideSection title="If Your Page Was Built With a Page Builder">
          <p style={guideP}>Some pages are designed with a page builder such as Divi, Elementor, or WPBakery. ProjectCheckin cannot add the job list to these pages, so it leaves them unchanged. Every job still becomes its own post under <strong style={guideStrong}>Posts → All Posts</strong>, the same as for any other page.</p>
          <p style={guideP}><strong style={guideStrong}>To show the job list on a page, map a page made in the standard WordPress editor:</strong></p>
          <Step n={1}>In WordPress, go to <strong style={guideStrong}>Pages → Add New</strong>. The new page opens in the standard WordPress editor. Leave the Divi or Elementor button unclicked, because clicking it turns the page into a builder page.</Step>
          <Step n={2}>Add a title and any text you want on the page, then click <strong style={guideStrong}>Publish</strong>.</Step>
          <Step n={3}>In the WordPress card in ProjectCheckin, click <strong style={guideStrong}>Add a page</strong>, paste the address of the new page, and click <strong style={guideStrong}>Save page</strong>, the same as in the steps above.</Step>
          <p style={guidePLast}>ProjectCheckin recognizes Divi, Elementor, and WPBakery pages and shows a notice with code WP-201 when you save one. It cannot recognize every page builder. If the job list does not appear on a page you mapped, create a new page in the standard editor as above and map that one instead.</p>
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
          <p style={guideP}><strong style={guideStrong}>Step 3 — Do nothing for everything else.</strong> Every job already becomes its own post automatically, so your one-off jobs in places you haven&apos;t mapped are still covered — hands-free. Keep the &ldquo;Auto-post every job&rdquo; switch on (it is by default).</p>
          <p style={guidePLast}><strong style={guideStrong}>In short:</strong> keep auto-posting on, highlight jobs on the strong pages you already have, build new pages only for your top city-and-service combos, and let the rest fill in on its own.</p>
        </GuideSection>

        <GuideSection title="If a Job Doesn&apos;t Post to Your Site">
          <p style={guideP}>When a published job does not reach your WordPress site, your Job Dashboard marks it <strong style={guideStrong}>Not posted to WordPress</strong>. If you edited a job that was already on your site, the mark reads <strong style={guideStrong}>Latest changes not posted to WordPress</strong>, and the earlier version stays on your site until the new one goes through.</p>
          <p style={guideP}><strong style={guideStrong}>If the WordPress card says Reconnect needed (code WP-101):</strong> ProjectCheckin can no longer log into your site, and the account owner receives one email about it. This usually happens after the Application Password is deleted or regenerated, or after the WordPress username changes. Jobs already on your site stay there.</p>
          <Step n={1}>In WordPress, go to <strong style={guideStrong}>Users → Profile → Application Passwords</strong> and add a new one.</Step>
          <Step n={2}>In ProjectCheckin, open <strong style={guideStrong}>Account</strong>, then the <strong style={guideStrong}>Connections</strong> tab, and open the WordPress card. Paste the new password, check your username, and click <strong style={guideStrong}>Reconnect</strong>.</Step>
          <Step n={3}>Open your Job Dashboard and click <strong style={guideStrong}>Post to WordPress</strong> on each marked job. Jobs post one at a time, so the other buttons stay locked until the current post finishes.</Step>
          <p style={guideP}><strong style={guideStrong}>If the WordPress card says Connected, jobs blocked (code WP-102):</strong> your site refused ProjectCheckin&apos;s request. The usual causes are a security plugin, your web host&apos;s firewall, or a WordPress user that no longer has permission to publish posts. Ask your web host or website developer to allow ProjectCheckin to use the WordPress REST API, then click Post to WordPress on each marked job.</p>
          <p style={guidePLast}><strong style={guideStrong}>If the WordPress card says Connected:</strong> the usual cause is a busy web host or a site that was down for a few minutes. Wait a few minutes, then click Post to WordPress on the marked job.</p>
        </GuideSection>

        <GuideSection
          title="Error Codes"
          id="error-codes"
          openForHashes={['wp-101', 'wp-102', 'wp-103', 'wp-104', 'wp-105', 'wp-106', 'wp-201', 'wp-no-code']}
        >
          <p style={guideP}>When something goes wrong with your WordPress connection or a mapped page, ProjectCheckin shows a code that starts with WP-. Find the code below to see what caused it and how to fix it.</p>

          <GuideSubsection title="WP-101: ProjectCheckin can no longer log into your site" id="wp-101">
            <p style={guideP}>WordPress rejected the saved login, and a second check confirmed it. This usually happens after the Application Password is deleted or regenerated, or after the WordPress username changes. Jobs already on your site stay there.</p>
            <Step n={1}>In WordPress, go to <strong style={guideStrong}>Users → Profile → Application Passwords</strong> and add a new one.</Step>
            <Step n={2}>In ProjectCheckin, open <strong style={guideStrong}>Account</strong>, then the <strong style={guideStrong}>Connections</strong> tab, and open the WordPress card. Paste the new password, check your username, and click <strong style={guideStrong}>Reconnect</strong>.</Step>
            <Step n={3}>On your Job Dashboard, click <strong style={guideStrong}>Post to WordPress</strong> on each job marked as not posted.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-102: Your site refused the request" id="wp-102">
            <p style={guideP}>Your site blocked ProjectCheckin. The usual causes are a security plugin, your web host&apos;s firewall, or a WordPress user that can no longer publish posts.</p>
            <Step n={1}>Ask your web host or website developer to allow ProjectCheckin to use the WordPress REST API.</Step>
            <Step n={2}>In WordPress, check under <strong style={guideStrong}>Users</strong> that the connected account can still publish posts.</Step>
            <Step n={3}>Click <strong style={guideStrong}>Post to WordPress</strong> on each marked job, or <strong style={guideStrong}>Try again</strong> on the page in the WordPress card.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-103: Your web host did not answer in time" id="wp-103">
            <p style={guideP}>Your web host was busy, limited how many requests it accepts, or your site was down for a few minutes.</p>
            <Step n={1}>Wait a few minutes.</Step>
            <Step n={2}>Click <strong style={guideStrong}>Post to WordPress</strong> on the marked job, or <strong style={guideStrong}>Try again</strong> on the page in the WordPress card.</Step>
            <Step n={3}>If the code keeps coming back over a day, ask your web host whether your plan limits how many requests the site accepts.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-104: WordPress did not save the post or the job list" id="wp-104">
            <p style={guideP}>WordPress answered ProjectCheckin but did not save the job post or the job list, for a reason the other codes do not cover.</p>
            <Step n={1}>Click <strong style={guideStrong}>Post to WordPress</strong> on the marked job, or <strong style={guideStrong}>Try again</strong> on the page in the WordPress card.</Step>
            <Step n={2}>If the code comes back, check that you can publish a post in WordPress yourself with the connected account, and ask your web host or website developer to check the site&apos;s error log.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-105: The connected account is below Administrator" id="wp-105">
            <p style={guideP}>WordPress removes scripts and maps from posts written by an account without full publishing rights. Your job posts still publish, but without their map and without the hidden details that describe each job to Google. An Administrator account keeps them; on a standard single-site WordPress install, an Editor account also keeps them.</p>
            <Step n={1}>Log into WordPress with an Administrator account.</Step>
            <Step n={2}>Go to <strong style={guideStrong}>Users → Profile → Application Passwords</strong> and add one named ProjectCheckin.</Step>
            <Step n={3}>In the WordPress card in ProjectCheckin, click <strong style={guideStrong}>Change account</strong>, enter that username and the new password, and save.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-106: Your site address changed or WordPress could not be found" id="wp-106">
            <p style={guideP}>Your site sent ProjectCheckin to a different address, or ProjectCheckin could not find WordPress at the saved address. This usually happens after a website moves to a new address, switches between an address with www and one without it, or turns off the WordPress REST API.</p>
            <Step n={1}>Open your website in a browser and note the exact address it shows, including whether it starts with www.</Step>
            <Step n={2}>In the WordPress card in ProjectCheckin, click <strong style={guideStrong}>Change account</strong>, enter that exact address with your username and an Application Password, and save.</Step>
            <Step n={3}>If the code comes back, ask your web host or website developer whether the WordPress REST API is turned off.</Step>
          </GuideSubsection>

          <GuideSubsection title="WP-201: The page was built with a page builder" id="wp-201">
            <p style={guideP}>The page you mapped was designed with a page builder such as Divi, Elementor or WPBakery, and ProjectCheckin cannot add the job list to it. Every job still becomes its own post under <strong style={guideStrong}>Posts → All Posts</strong>.</p>
            <Step n={1}>In WordPress, go to <strong style={guideStrong}>Pages → Add New</strong>. Leave the Divi or Elementor button unclicked, because clicking it turns the page into a builder page.</Step>
            <Step n={2}>Add a title and any text you want on the page, then click <strong style={guideStrong}>Publish</strong>.</Step>
            <Step n={3}>In the WordPress card in ProjectCheckin, remove the old page, click <strong style={guideStrong}>Add a page</strong>, paste the address of the new page, and click <strong style={guideStrong}>Save page</strong>.</Step>
          </GuideSubsection>

          <GuideSubsection title="The job list is missing and no code is shown" id="wp-no-code">
            <p style={guideP}>ProjectCheckin saved the job list, but something on your site keeps it from showing. The usual causes are a page builder ProjectCheckin does not recognize (for example Beaver Builder, Bricks, Oxygen, Breakdance or Brizy), a page cache that still serves an older copy of the page, a theme that prints page content in its own way, or a security plugin that removes the list.</p>
            <Step n={1}>Clear your site&apos;s page cache from your caching plugin or your web host&apos;s dashboard, then open the page in a private browser window.</Step>
            <Step n={2}>If the page was built with a page builder, follow the WP-201 steps to create a page in the standard editor and map it.</Step>
            <Step n={3}>If the list is still missing, ask your web host or website developer to check whether a plugin or the theme removes it.</Step>
          </GuideSubsection>
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
