import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, GuideSubsection, Step, guideP, guidePLast, guideStrong, guideLink, guideHint } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Set Up Google Search Console — Help & Support' }

export default function GscSetupGuidePage() {
  return (
    <DashboardShell title="Set Up Google Search Console">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          Google Search Console is a free tool from Google. It tells you what people typed into Google right before they found your business, how often you showed up, and how many people clicked. This guide walks you through setting it up from scratch.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Already have Search Console set up? Skip this and go straight to the <Link href="/help/guides/gsc-connect" style={guideLink}>Connect Google Search Console</Link> guide.
        </p>

        <GuideSection title="Before You Start" defaultOpen>
          <p style={guideP}>
            Three things to have ready:
          </p>
          <Step n={1}>
            <strong style={guideStrong}>A Google account.</strong> Any Gmail address works. Use the one you want tied to your business long-term — you&apos;ll sign in with this same account when you connect to ProjectCheckin, so pick one you won&apos;t lose access to.
          </Step>
          <Step n={2}>
            <strong style={guideStrong}>Your website address.</strong> The one people type to find you, like <code>www.yourbusiness.com</code>.
          </Step>
          <Step n={3}>
            <strong style={guideStrong}>A way to edit your website</strong> — or the phone number of whoever built it. You&apos;ll need to add one small piece of code, once. If someone else manages your site, they can do this part in about two minutes.
          </Step>
          <p style={guidePLast}>
            Total time: about 15 minutes. You only ever do this once.
          </p>
        </GuideSection>

        <GuideSection title="Step 1 — Add Your Website to Search Console">
          <Step n={1}>Go to <strong style={guideStrong}>search.google.com/search-console</strong> in your web browser.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Start now</strong> and sign in with your Google account.</Step>
          <Step n={3}>
            You&apos;ll see two boxes side by side: <strong style={guideStrong}>Domain</strong> on the left and <strong style={guideStrong}>URL prefix</strong> on the right. Use the <strong style={guideStrong}>URL prefix</strong> box on the right. It&apos;s the easier one.
          </Step>
          <Step n={4}>
            Type your full website address into that box, exactly as it appears in your browser&apos;s address bar — including the <code>https://</code> part. For example: <code>https://www.yourbusiness.com</code>
          </Step>
          <Step n={5}>Click <strong style={guideStrong}>Continue</strong>.</Step>
          <p style={guidePLast}>
            Google now needs you to prove the website is really yours. That&apos;s Step 2.
          </p>
          <p style={guideHint}>
            Not sure whether your address uses &ldquo;www&rdquo; or not? Open your website, then copy exactly what shows in the address bar. Google treats <code>www.yourbusiness.com</code> and <code>yourbusiness.com</code> as two different websites, so this has to match.
          </p>
        </GuideSection>

        <GuideSection title="Step 2 — Prove the Website Is Yours">
          <p style={guideP}>
            Google calls this <strong style={guideStrong}>verifying</strong>. It shows you a list of methods. You only need <strong style={guideStrong}>one</strong> of them to work — ignore the rest.
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>Start here:</strong> if the list shows <strong style={guideStrong}>Google Analytics</strong> or <strong style={guideStrong}>Google Tag Manager</strong> and you already use either one, click it and hit <strong style={guideStrong}>Verify</strong>. It usually finishes instantly with nothing else to do.
          </p>
          <p style={guideP}>
            Otherwise, use the <strong style={guideStrong}>HTML tag</strong> method. Click <strong style={guideStrong}>HTML tag</strong> to expand it, then click the <strong style={guideStrong}>Copy</strong> button next to the line of code. It looks something like this:
          </p>
          <p style={{ ...guideP, fontFamily: "'Courier New', monospace", fontSize: 11.5, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 13px', wordBreak: 'break-all' }}>
            &lt;meta name=&quot;google-site-verification&quot; content=&quot;AbC123...&quot; /&gt;
          </p>
          <p style={guideP}>
            Now find your website platform below and follow those steps to paste it in. <strong style={guideStrong}>Leave the Search Console tab open</strong> — you&apos;ll come back to it.
          </p>

          <GuideSubsection title="WordPress">
            <Step n={1}>Log into your WordPress admin — usually <code>yoursite.com/wp-admin</code>.</Step>
            <Step n={2}>Most WordPress sites have an SEO plugin. In the left menu, look for <strong style={guideStrong}>Yoast SEO</strong>, <strong style={guideStrong}>Rank Math</strong>, or <strong style={guideStrong}>All in One SEO</strong>.</Step>
            <Step n={3}>
              <strong style={guideStrong}>If you have Yoast SEO:</strong> click Yoast SEO → <strong style={guideStrong}>Settings</strong> → <strong style={guideStrong}>Site connections</strong>. Paste the code into the <strong style={guideStrong}>Google</strong> box, then click <strong style={guideStrong}>Save changes</strong>.
            </Step>
            <Step n={4}>
              <strong style={guideStrong}>If you have Rank Math:</strong> click Rank Math → <strong style={guideStrong}>General Settings</strong> → <strong style={guideStrong}>Webmaster Tools</strong>. Paste into the <strong style={guideStrong}>Google Search Console</strong> box and save.
            </Step>
            <Step n={5}>
              <strong style={guideStrong}>If you have no SEO plugin:</strong> go to <strong style={guideStrong}>Appearance → Theme File Editor</strong>, open <code>header.php</code>, and paste the code on its own line right before <code>&lt;/head&gt;</code>. Click <strong style={guideStrong}>Update File</strong>. If that sounds risky, install the free plugin <strong style={guideStrong}>Insert Headers and Footers</strong> instead and paste it there — it&apos;s safer and does the same job.
            </Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
          </GuideSubsection>

          <GuideSubsection title="Squarespace">
            <Step n={1}>Log into squarespace.com and open your site.</Step>
            <Step n={2}>Open <strong style={guideStrong}>Code Injection</strong>. The quickest way to find it is the search box in your Squarespace admin — type &ldquo;code injection&rdquo; and click the result. (It lives under Website Tools, but Squarespace has moved this menu around between versions, so searching is more reliable than clicking through.)</Step>
            <Step n={3}>Paste the code into the <strong style={guideStrong}>Header</strong> box — the top one.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Save</strong>.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
            <p style={guideHint}>Code Injection is included on the Core, Plus, and Advanced plans (and some older plans). If you can&apos;t find it at all, your plan likely doesn&apos;t include it — verify through Google Analytics instead, or use the HTML file method in Search Console.</p>
          </GuideSubsection>

          <GuideSubsection title="Wix">
            <Step n={1}>Log into wix.com and open your site&apos;s dashboard.</Step>
            <Step n={2}>In the left menu click <strong style={guideStrong}>SEO &amp; GEO</strong>.</Step>
            <Step n={3}>Scroll down to <strong style={guideStrong}>Tools and settings</strong> and click <strong style={guideStrong}>Site Verification</strong>.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Google</strong> to expand that section, then paste the code into the field.</Step>
            <Step n={5}>Click <strong style={guideStrong}>Save</strong>.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
            <p style={guideHint}>Your site has to be published first, and &ldquo;Let search engines index your site&rdquo; must be turned on in your SEO settings. Wix also offers a guided SEO Setup Checklist that connects you to Google in one flow — if you see it, that works too.</p>
          </GuideSubsection>

          <GuideSubsection title="GoDaddy Websites + Marketing">
            <p style={guideP}>
              <strong style={guideStrong}>The HTML tag method does not work on GoDaddy&apos;s website builder.</strong> GoDaddy only lets you add custom code inside a page&apos;s content, and Google requires this tag in the page&apos;s hidden header area. Pasting it into a page section will fail verification. Use one of these instead:
            </p>
            <p style={guideP}><strong style={guideStrong}>Option 1 — Google Analytics (easiest if you already use it).</strong> GoDaddy has a built-in Google Analytics connection in your site&apos;s Settings. Once Analytics is connected, go back to Search Console, expand the <strong style={guideStrong}>Google Analytics</strong> verification method, and click <strong style={guideStrong}>Verify</strong>.</p>
            <p style={guideP}><strong style={guideStrong}>Option 2 — Verify through your domain instead.</strong> This works no matter what your site is built with, as long as your domain is registered at GoDaddy:</p>
            <Step n={1}>In Search Console, add your website again — but this time use the <strong style={guideStrong}>Domain</strong> box on the left instead of URL prefix. Enter just <code>yourbusiness.com</code>, with no <code>https://</code> and no <code>www</code>.</Step>
            <Step n={2}>Google shows you a <strong style={guideStrong}>TXT record</strong>. Click <strong style={guideStrong}>Copy</strong>.</Step>
            <Step n={3}>In a new tab, log into godaddy.com, click your name in the top-right, and choose <strong style={guideStrong}>My Products</strong>.</Step>
            <Step n={4}>Find your domain and click <strong style={guideStrong}>DNS</strong> next to it.</Step>
            <Step n={5}>Click <strong style={guideStrong}>Add New Record</strong>. Set <strong style={guideStrong}>Type</strong> to <strong style={guideStrong}>TXT</strong>, set <strong style={guideStrong}>Name</strong> to <code>@</code>, and paste the copied value into <strong style={guideStrong}>Value</strong>. Leave TTL as-is.</Step>
            <Step n={6}>Click <strong style={guideStrong}>Save</strong>, then go back to Search Console and click <strong style={guideStrong}>Verify</strong>.</Step>
            <p style={guidePLast}>
              DNS changes can take a few minutes to an hour. If it fails on the first try, wait 15 minutes and click Verify again — the record is fine, Google just hasn&apos;t seen it yet.
            </p>
          </GuideSubsection>

          <GuideSubsection title="Webflow">
            <Step n={1}>Open your project in Webflow.</Step>
            <Step n={2}>Open <strong style={guideStrong}>Site settings</strong>, then click the <strong style={guideStrong}>Custom code</strong> tab.</Step>
            <Step n={3}>Paste the code into the <strong style={guideStrong}>Head code</strong> field.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Save changes</strong>, then <strong style={guideStrong}>Publish</strong> your site. Custom code does not go live until you publish.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
          </GuideSubsection>

          <GuideSubsection title="Someone Else Built My Website">
            <p style={guideP}>
              This is normal and it&apos;s a quick ask. Send them this message:
            </p>
            <p style={{ ...guideP, background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
              &ldquo;Hi — I&apos;m setting up Google Search Console for our website. Can you add this verification tag to the &lt;head&gt; section of the site and let me know when it&apos;s live? Here&apos;s the code: [paste the code here]&rdquo;
            </p>
            <p style={guidePLast}>
              Once they tell you it&apos;s done, go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.
            </p>
          </GuideSubsection>

          <GuideSubsection title="Plain HTML Website">
            <Step n={1}>Open the HTML file for your homepage — usually called <code>index.html</code>.</Step>
            <Step n={2}>Open it with Notepad (Windows) or TextEdit (Mac). Don&apos;t use Microsoft Word — it can break the file.</Step>
            <Step n={3}>Press Ctrl+F (Cmd+F on Mac) and search for <code>&lt;/head&gt;</code>.</Step>
            <Step n={4}>Click right before <code>&lt;/head&gt;</code> and paste the code on its own line.</Step>
            <Step n={5}>Save the file and upload it back to your web host, the same way you normally would.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
          </GuideSubsection>
        </GuideSection>

        <GuideSection title="Step 3 — Confirm It Worked">
          <p style={guideP}>
            After you click Verify, Google shows one of two things:
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>&ldquo;Ownership verified&rdquo;</strong> — you&apos;re done. Click <strong style={guideStrong}>Go to property</strong> and you&apos;ll land on your new dashboard.
          </p>
          <p style={guideP}>
            <strong style={guideStrong}>&ldquo;Verification failed&rdquo;</strong> — almost always one of these three:
          </p>
          <Step n={1}>You didn&apos;t publish your site after pasting the code. Squarespace, Wix, GoDaddy, and Webflow all need a <strong style={guideStrong}>Publish</strong> click before changes go live.</Step>
          <Step n={2}>The code went into the Footer box instead of the Header box. It has to be the header.</Step>
          <Step n={3}>The website address you typed in Step 1 doesn&apos;t match your real one — usually a missing or extra <code>www</code>. Go back and add it again the other way.</Step>
          <p style={guidePLast}>
            Fix whichever it was and click <strong style={guideStrong}>Verify</strong> again. You can retry as many times as you need.
          </p>
        </GuideSection>

        <GuideSection title="Step 4 — Connect It To ProjectCheckin">
          <p style={guidePLast}>
            Now that Google knows the site is yours, follow the <Link href="/help/guides/gsc-connect" style={guideLink}>Connect Google Search Console</Link> guide. That part takes about 30 seconds.
          </p>
        </GuideSection>

        <GuideSection title="Why Am I Seeing Zeros?">
          <p style={guideP}>
            This is normal, and it isn&apos;t a mistake. Google only starts recording your search data <strong style={guideStrong}>from the day you verify</strong>. It does not fill in history from before that.
          </p>
          <p style={guidePLast}>
            Expect a few days before any numbers appear, and two to three weeks before they tell you much. Google&apos;s reporting also runs two to three days behind, so the last couple of days always look emptier than they really are.
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
