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
            <Step n={2}>In the left menu click <strong style={guideStrong}>Settings</strong>.</Step>
            <Step n={3}>Click <strong style={guideStrong}>Developer Tools</strong>, then <strong style={guideStrong}>Code Injection</strong>.</Step>
            <Step n={4}>Paste the code into the <strong style={guideStrong}>Header</strong> box (the top one).</Step>
            <Step n={5}>Click <strong style={guideStrong}>Save</strong> in the top-left.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
            <p style={guideHint}>Code Injection needs a paid Squarespace plan. On a free trial you won&apos;t see it — use the HTML file method in Search Console instead, or verify through Google Analytics.</p>
          </GuideSubsection>

          <GuideSubsection title="Wix">
            <Step n={1}>Log into wix.com and open your site&apos;s dashboard.</Step>
            <Step n={2}>In the left menu click <strong style={guideStrong}>Marketing &amp; SEO</strong>, then <strong style={guideStrong}>SEO Tools</strong>.</Step>
            <Step n={3}>Click <strong style={guideStrong}>Site Verification</strong> (on some accounts it&apos;s called <strong style={guideStrong}>Verify your site</strong>).</Step>
            <Step n={4}>Paste the code into the <strong style={guideStrong}>Google</strong> box.</Step>
            <Step n={5}>Click <strong style={guideStrong}>Save</strong>.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
            <p style={guideHint}>Wix also has a one-click Search Console connection under Marketing &amp; SEO. If you see it, that works too and skips the copy-paste entirely.</p>
          </GuideSubsection>

          <GuideSubsection title="GoDaddy Website Builder">
            <Step n={1}>Log into godaddy.com and open your website in the editor.</Step>
            <Step n={2}>Click <strong style={guideStrong}>Settings</strong>, then look for <strong style={guideStrong}>Site-wide Code</strong> or <strong style={guideStrong}>Custom Code</strong>.</Step>
            <Step n={3}>Paste the code into the <strong style={guideStrong}>Head</strong> or <strong style={guideStrong}>Header</strong> box.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Save</strong>, then <strong style={guideStrong}>Publish</strong> your site. The code isn&apos;t live until you publish.</Step>
            <p style={guidePLast}>Go back to the Search Console tab and click <strong style={guideStrong}>Verify</strong>.</p>
          </GuideSubsection>

          <GuideSubsection title="Webflow">
            <Step n={1}>Open your project in Webflow.</Step>
            <Step n={2}>Click the <strong style={guideStrong}>Settings</strong> gear icon, then the <strong style={guideStrong}>Custom Code</strong> tab.</Step>
            <Step n={3}>Paste the code into the <strong style={guideStrong}>Head Code</strong> box.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Save Changes</strong>, then <strong style={guideStrong}>Publish</strong> your site. It won&apos;t work until you publish.</Step>
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
