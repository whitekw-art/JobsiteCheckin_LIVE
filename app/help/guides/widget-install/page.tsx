import type { Metadata } from 'next'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, GuideSubsection, Step, guideP, guidePLast, guideStrong } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Widget Installation Guide — Help & Support' }

export default function WidgetInstallGuidePage() {
  return (
    <DashboardShell title="Widget Installation Guide">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 8px' }}>
          This guide shows you how to put your ProjectCheckin job photos on your own website. Once it&apos;s set up, every new job you publish shows up on your site automatically — you never have to do this again after the first time.
        </p>

        <GuideSection title="Before You Start" defaultOpen>
          <p style={guideP}>You need one small piece of code called your &ldquo;embed code.&rdquo; Here&apos;s how to get it:</p>
          <Step n={1}>Log into ProjectCheckin.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Account</strong> in the left sidebar.</Step>
          <Step n={3}>Click the <strong style={guideStrong}>Connections</strong> tab.</Step>
          <Step n={4}>Find the section called <strong style={guideStrong}>Website Integration for Local SEO</strong>.</Step>
          <Step n={5}>Click <strong style={guideStrong}>Copy code</strong>. This copies two lines of code to your clipboard — you&apos;ll paste them in the steps below.</Step>
          <p style={guidePLast}>Keep that browser tab open. You&apos;ll come back to it to hit &ldquo;Copy code&rdquo; again if you need to.</p>
        </GuideSection>

        <GuideSection title="WordPress">
          <Step n={1}>Log into your WordPress site. You&apos;ll land on the WordPress Dashboard.</Step>
          <Step n={2}>On the left side, find <strong style={guideStrong}>Pages</strong>, and click it. Open the page where you want your work to show up (or click <strong style={guideStrong}>Add New</strong> to make a new page first).</Step>
          <Step n={3}>You&apos;ll see the page editor. Click the <strong style={guideStrong}>+</strong> button (it adds a new block to the page).</Step>
          <Step n={4}>A search box pops up. Type <strong style={guideStrong}>Custom HTML</strong> and click it when it appears in the list.</Step>
          <Step n={5}>A big empty box appears on your page. Click inside it.</Step>
          <Step n={6}>Paste the code you copied earlier (Ctrl+V on Windows, Cmd+V on Mac).</Step>
          <Step n={7}>Look at the top-right corner of the screen. Click the blue <strong style={guideStrong}>Update</strong> button (or <strong style={guideStrong}>Publish</strong>, if this is a brand-new page).</Step>
          <Step n={8}>Visit your page in a new browser tab to see it live.</Step>
          <p style={guidePLast}><strong style={guideStrong}>Where do I find the + button?</strong> It&apos;s usually a small circle with a plus sign, either at the very top of the editor or wherever your cursor is clicked on the page.</p>
        </GuideSection>

        <GuideSection title="Squarespace">
          <Step n={1}>Log into Squarespace.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Pages</strong> on the left, then click the page where you want your work to show up.</Step>
          <Step n={3}>Click the <strong style={guideStrong}>Edit</strong> button that appears over the page.</Step>
          <Step n={4}>Move your mouse over the spot on the page where you want the widget. A black <strong style={guideStrong}>+</strong> icon will appear — click it.</Step>
          <Step n={5}>A menu of block types opens. Scroll down until you see <strong style={guideStrong}>Code</strong>, and click it.</Step>
          <Step n={6}>A code box opens. Paste the code you copied earlier (Ctrl+V or Cmd+V) into that box.</Step>
          <Step n={7}>Click <strong style={guideStrong}>Apply</strong> (usually in the top-right of that small window).</Step>
          <Step n={8}>Click <strong style={guideStrong}>Save</strong> in the top-right of the page editor.</Step>
          <Step n={9}>Click <strong style={guideStrong}>Publish</strong> if this page isn&apos;t live yet.</Step>
          <p style={guidePLast}><strong style={guideStrong}>Tip:</strong> If you don&apos;t see &ldquo;Code&rdquo; in the block menu, scroll down further — it&apos;s often near the bottom, under a section called &ldquo;More.&rdquo;</p>
        </GuideSection>

        <GuideSection title="Webflow">
          <Step n={1}>Open your site in the Webflow Designer (the main editing tool, not the live site).</Step>
          <Step n={2}>Go to the page where you want your work to show up.</Step>
          <Step n={3}>On the left side, find the <strong style={guideStrong}>Add Elements</strong> panel (it usually looks like a plus sign or a stack of shapes).</Step>
          <Step n={4}>Look for an element called <strong style={guideStrong}>Embed</strong>. Click and drag it onto your page, wherever you want the widget to appear.</Step>
          <Step n={5}>A small box with <code>&lt;/&gt;</code> in it will appear on your page. Double-click it.</Step>
          <Step n={6}>A code window pops up. Paste the code you copied earlier (Ctrl+V or Cmd+V).</Step>
          <Step n={7}>Click <strong style={guideStrong}>Save &amp; Close</strong>.</Step>
          <Step n={8}>In the top-right corner of Webflow, click <strong style={guideStrong}>Publish</strong>, then confirm.</Step>
          <p style={guidePLast}><strong style={guideStrong}>Note:</strong> Webflow won&apos;t show the widget content while you&apos;re still inside the Designer — you have to Publish and then visit your real site to see it working.</p>
        </GuideSection>

        <GuideSection title="Wix">
          <Step n={1}>Log into Wix and open the <strong style={guideStrong}>Editor</strong> for your site (click <strong style={guideStrong}>Edit Site</strong> from your dashboard).</Step>
          <Step n={2}>Go to the page where you want your work to show up.</Step>
          <Step n={3}>On the left side, click the <strong style={guideStrong}>+ Add Elements</strong> button (or <strong style={guideStrong}>Add Panel</strong>).</Step>
          <Step n={4}>Look for <strong style={guideStrong}>Embed Code</strong> (sometimes listed under &ldquo;More&rdquo; or &ldquo;Embed &amp; Social&rdquo;). Click it, then choose <strong style={guideStrong}>Embed HTML</strong> or <strong style={guideStrong}>Custom Element</strong>.</Step>
          <Step n={5}>A gray box will appear on your page — this is a placeholder. Click it, then click <strong style={guideStrong}>Enter Code</strong>.</Step>
          <Step n={6}>Paste the code you copied earlier (Ctrl+V or Cmd+V) into the box that opens.</Step>
          <Step n={7}>Click <strong style={guideStrong}>Update</strong> (or the checkmark) to save the code.</Step>
          <Step n={8}>Resize the gray box on your page if it looks too small — drag its corners so there&apos;s room for your job photos to show.</Step>
          <Step n={9}>Click <strong style={guideStrong}>Publish</strong> in the top-right corner of the Wix Editor.</Step>
        </GuideSection>

        <GuideSection title="Plain HTML / Custom-Built Website">
          <p style={guideP}>This is for websites that aren&apos;t built with one of the tools above — for example, a site someone coded for you, or one you built yourself with a plain HTML file.</p>
          <Step n={1}>Find the HTML file for the page where you want your work to show up. If someone else built your site, ask them for it — or log into your web hosting account (GoDaddy, Bluehost, Netlify, etc.) and look for a section called <strong style={guideStrong}>File Manager</strong> or <strong style={guideStrong}>Site Files</strong>.</Step>
          <Step n={2}>Right-click that file and choose <strong style={guideStrong}>Open With</strong>, then pick <strong style={guideStrong}>Notepad</strong> (on Windows) or <strong style={guideStrong}>TextEdit</strong> (on Mac). Do not use Microsoft Word — it can break the file.</Step>
          <Step n={3}>Press <strong style={guideStrong}>Ctrl+F</strong> (Windows) or <strong style={guideStrong}>Cmd+F</strong> (Mac) to open a search box inside the text editor. Search for: <code>&lt;/body&gt;</code> — this is a specific marker near the end of the file, you don&apos;t need to understand what it means, just find it.</Step>
          <Step n={4}>Click your mouse right before <code>&lt;/body&gt;</code> and paste the code you copied earlier (Ctrl+V or Cmd+V).</Step>
          <Step n={5}>Save the file (Ctrl+S or Cmd+S).</Step>
          <Step n={6}>Upload the saved file back to your hosting provider, the same way you found it. Most hosts show a <strong style={guideStrong}>Save</strong>, <strong style={guideStrong}>Upload</strong>, or <strong style={guideStrong}>Publish</strong> button after you make changes.</Step>
          <Step n={7}>Visit your website in a browser to confirm it worked.</Step>
          <p style={guidePLast}><strong style={guideStrong}>Stuck?</strong> Most web hosts (GoDaddy, Bluehost, Netlify, etc.) offer live chat support. You can say exactly this: <em>&ldquo;I need to add one HTML snippet right before &lt;/body&gt; on one page of my site.&rdquo;</em> Most support agents can do this for you in a few minutes.</p>
        </GuideSection>

        <GuideSection title="Updating or Replacing Your Widget Code">
          <p style={guideP}>Most people never need to do this. Your widget updates itself automatically every time you publish a new job — you don&apos;t touch the code again. You only need to replace the code if our support team asks you to refresh it, or if something looks broken and you want to paste in a clean copy.</p>
          <p style={guideP}>Replacing the code is just like installing it, with one difference: instead of adding new code, you <strong style={guideStrong}>find your existing widget code, delete it, and paste a fresh copy in its place.</strong> Everything inside the code stays the same — you&apos;re simply swapping the old block for a new one.</p>
          <p style={guidePLast}><strong style={guideStrong}>First, get a fresh copy of your code</strong> the same way you did originally: ProjectCheckin → <strong style={guideStrong}>Account</strong> → <strong style={guideStrong}>Connections</strong> → <strong style={guideStrong}>Website Integration for Local SEO</strong> → <strong style={guideStrong}>Copy code</strong>. Then follow the steps for your website below.</p>

          <GuideSubsection title="WordPress — replace the code">
            <Step n={1}>Log into WordPress, click <strong style={guideStrong}>Pages</strong>, and open the page where your work currently shows up.</Step>
            <Step n={2}>Click into the page to edit it. Find the block that holds your widget — it&apos;s a <strong style={guideStrong}>Custom HTML</strong> block containing a line with <code>pc-widget</code> in it. Can&apos;t spot it? Click the list view icon (three stacked lines, top-left of the editor) to see every block, and look for &ldquo;Custom HTML.&rdquo;</Step>
            <Step n={3}>Click inside that block, select everything in it, and delete it.</Step>
            <Step n={4}>Paste your fresh code. Don&apos;t retype or change anything inside it — just swap the whole block.</Step>
            <Step n={5}>Click <strong style={guideStrong}>Update</strong> (top-right) to save.</Step>
          </GuideSubsection>

          <GuideSubsection title="Squarespace — replace the code">
            <Step n={1}>Log into Squarespace, open the page where your work currently shows up, and click <strong style={guideStrong}>Edit</strong>.</Step>
            <Step n={2}>Click the <strong style={guideStrong}>Code</strong> block that holds your widget (you&apos;ll see your <code>pc-widget</code> code inside it) to open it.</Step>
            <Step n={3}>Select everything in the box and delete it, then paste your fresh code in its place.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Apply</strong>, then click <strong style={guideStrong}>Save</strong> (top-right). Click <strong style={guideStrong}>Publish</strong> if the page isn&apos;t live.</Step>
          </GuideSubsection>

          <GuideSubsection title="Webflow — replace the code">
            <Step n={1}>Open your site in the Webflow Designer and go to the page where your work currently shows up.</Step>
            <Step n={2}>Find the <strong style={guideStrong}>Embed</strong> element that holds your widget — the small <code>&lt;/&gt;</code> box showing your <code>pc-widget</code> code. Double-click it to open the code window.</Step>
            <Step n={3}>Select everything in the window and delete it, then paste your fresh code in its place.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Save &amp; Close</strong>, then click <strong style={guideStrong}>Publish</strong> (top-right) and confirm.</Step>
          </GuideSubsection>

          <GuideSubsection title="Wix — replace the code">
            <Step n={1}>Log into Wix, click <strong style={guideStrong}>Edit Site</strong> to open the Editor, and go to the page where your work currently shows up.</Step>
            <Step n={2}>Click the <strong style={guideStrong}>Embed HTML</strong> (or <strong style={guideStrong}>Custom Element</strong>) box that holds your widget, then click <strong style={guideStrong}>Enter Code</strong> (or <strong style={guideStrong}>Edit Code</strong>).</Step>
            <Step n={3}>Select everything in the box and delete it, then paste your fresh code in its place.</Step>
            <Step n={4}>Click <strong style={guideStrong}>Update</strong> (or the checkmark) to save, then click <strong style={guideStrong}>Publish</strong> (top-right).</Step>
          </GuideSubsection>

          <GuideSubsection title="Plain HTML / Custom-Built Website — replace the code">
            <Step n={1}>Find the same HTML file you originally added the widget to.</Step>
            <Step n={2}>Right-click it and choose <strong style={guideStrong}>Open With</strong> → <strong style={guideStrong}>Notepad</strong> (Windows) or <strong style={guideStrong}>TextEdit</strong> (Mac). Do not use Microsoft Word — it can break the file.</Step>
            <Step n={3}>Press <strong style={guideStrong}>Ctrl+F</strong> (Windows) or <strong style={guideStrong}>Cmd+F</strong> (Mac) and search for: <code>pc-widget</code>. That&apos;s your existing snippet — three lines: a comment, a <code>&lt;div id=&quot;pc-widget&quot;...&gt;</code> line, and a <code>&lt;script src=&quot;...&quot;&gt;</code> line.</Step>
            <Step n={4}>Select all three of those lines and delete them, then paste your fresh code in their place. Don&apos;t retype or edit anything inside it — just swap the whole block, old for new.</Step>
            <Step n={5}>Save the file (Ctrl+S or Cmd+S), then upload it back to your host the same way you found it.</Step>
            <p style={guidePLast}><strong style={guideStrong}>Stuck?</strong> Your web host&apos;s live chat can usually do this in a few minutes — just say: <em>&ldquo;I need to replace an existing HTML snippet with a new one on one page of my site.&rdquo;</em></p>
          </GuideSubsection>
        </GuideSection>

        <GuideSection title="Common Problems">
          <p style={guideP}><strong style={guideStrong}>I don&apos;t see anything on my page after pasting the code.</strong> Check three things, in order:</p>
          <Step n={1}>Did you click <strong style={guideStrong}>Update</strong>, <strong style={guideStrong}>Save</strong>, or <strong style={guideStrong}>Publish</strong> after pasting? The code doesn&apos;t take effect until the page is saved and published.</Step>
          <Step n={2}>Have you published at least one job in ProjectCheckin? If you haven&apos;t published any jobs yet, the widget will show a message that says &ldquo;No projects published yet&rdquo; — that&apos;s normal, not an error.</Step>
          <Step n={3}>Wait a few minutes and reload the page. New jobs can take up to 5 minutes to show up after you publish them.</Step>
          <p style={guideP}><strong style={guideStrong}>I see a small gray or empty box instead of my photos.</strong> This usually means the code didn&apos;t paste correctly, or got cut off. Go back to Account → Connections, click <strong style={guideStrong}>Copy code</strong> again, delete the old code from your website, and paste a fresh copy.</p>
          <p style={guidePLast}><strong style={guideStrong}>The widget looks broken or unstyled.</strong> Make sure you pasted both lines of the code (there are two — a <code>&lt;div&gt;</code> line and a <code>&lt;script&gt;</code> line). If only one made it in, delete what&apos;s there and paste the whole thing again.</p>
        </GuideSection>

        <GuideSection title="Need Help?">
          <p style={guidePLast}>If you get stuck on any step above, reach out and we&apos;ll walk you through it.</p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
