import type { Metadata } from 'next'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, Step, guideP, guidePLast, guideStrong, guideLink } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'CNAME Subdomain Hosting Guide — Help & Support' }

export default function CnameHostingGuidePage() {
  return (
    <DashboardShell title="CNAME Subdomain Hosting Guide">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          This guide shows you how to give your ProjectCheckin job pages a real address on your own website — like <code>our-work.yoursite.com</code> — instead of a widget you paste into a page. Once it&apos;s set up, every new job you publish shows up there automatically. You never have to touch it again after this one-time setup.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          This is different from the embed widget. If you&apos;re looking for that guide instead, see the <Link href="/help/guides/widget-install" style={guideLink}>Widget Installation Guide</Link>.
        </p>

        <GuideSection title="Before You Start — What You're Actually Doing" defaultOpen>
          <p style={guideP}>
            You&apos;re going to add one setting called a &ldquo;DNS record&rdquo; at the company where you bought your website&apos;s domain name (the part after the &ldquo;@&rdquo; in your email, like <code>yoursite.com</code>). This is usually <strong style={guideStrong}>not</strong> the same company that built your website — it might be GoDaddy, Namecheap, Cloudflare, or somewhere else. If you&apos;re not sure who that is, check an old email receipt for &ldquo;domain registration,&rdquo; or ask whoever set up your website.
          </p>
          <p style={guideP}><strong style={guideStrong}>Step 1 — Get your DNS record from ProjectCheckin:</strong></p>
          <Step n={1}>Log into ProjectCheckin.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Account</strong> in the left sidebar.</Step>
          <Step n={3}>Click the <strong style={guideStrong}>Connections</strong> tab.</Step>
          <Step n={4}>Find the section called <strong style={guideStrong}>Host Your Work Directly On Your Own Site</strong>.</Step>
          <Step n={5}>Type the subdomain you want (like <code>our-work</code>) and click <strong style={guideStrong}>Get My DNS Record</strong>.</Step>
          <Step n={6}>You&apos;ll see three pieces of information: <strong style={guideStrong}>Type</strong>, <strong style={guideStrong}>Host</strong>, and <strong style={guideStrong}>Value</strong>. Keep this tab open — you&apos;ll copy the Value in the steps below.</Step>
          <p style={guidePLast}>That&apos;s the only thing you need from ProjectCheckin. Everything else below happens at your domain company&apos;s website.</p>
        </GuideSection>

        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '22px 0 0' }}>
          <strong style={guideStrong}>Step 1 — Add the DNS Record.</strong> Find your domain company below and follow those steps.
        </p>

        <GuideSection title="GoDaddy">
          <Step n={1}>Log into godaddy.com.</Step>
          <Step n={2}>Click your name or profile icon in the top-right, then click <strong style={guideStrong}>My Products</strong>.</Step>
          <Step n={3}>Find your domain name in the list and click the <strong style={guideStrong}>DNS</strong> button next to it.</Step>
          <Step n={4}>Look for a button called <strong style={guideStrong}>Add</strong> or <strong style={guideStrong}>Add New Record</strong>.</Step>
          <Step n={5}>A form appears. Set it up like this: <strong style={guideStrong}>Type</strong> → CNAME, <strong style={guideStrong}>Name/Host</strong> → your subdomain (e.g. <code>our-work</code>), <strong style={guideStrong}>Value/Points to</strong> → the value shown in ProjectCheckin, <strong style={guideStrong}>TTL</strong> → leave default.</Step>
          <Step n={6}>Click <strong style={guideStrong}>Save</strong>.</Step>
          <Step n={7}>Go back to the ProjectCheckin tab and click <strong style={guideStrong}>I&apos;ve Added It — Verify</strong>.</Step>
        </GuideSection>

        <GuideSection title="Namecheap">
          <Step n={1}>Log into namecheap.com.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Domain List</strong> on the left, find your domain, and click <strong style={guideStrong}>Manage</strong> next to it.</Step>
          <Step n={3}>Click the <strong style={guideStrong}>Advanced DNS</strong> tab near the top.</Step>
          <Step n={4}>Find the section called <strong style={guideStrong}>Host Records</strong> and click <strong style={guideStrong}>Add New Record</strong>.</Step>
          <Step n={5}>Set it up like this: <strong style={guideStrong}>Type</strong> → CNAME Record, <strong style={guideStrong}>Host</strong> → your subdomain (e.g. <code>our-work</code>), <strong style={guideStrong}>Value</strong> → the value shown in ProjectCheckin, <strong style={guideStrong}>TTL</strong> → Automatic.</Step>
          <Step n={6}>Click the green checkmark to save.</Step>
          <Step n={7}>Go back to the ProjectCheckin tab and click <strong style={guideStrong}>I&apos;ve Added It — Verify</strong>.</Step>
        </GuideSection>

        <GuideSection title="Cloudflare">
          <Step n={1}>Log into dash.cloudflare.com.</Step>
          <Step n={2}>Click on your domain name from the list.</Step>
          <Step n={3}>Click <strong style={guideStrong}>DNS</strong> on the left side, then <strong style={guideStrong}>Records</strong>.</Step>
          <Step n={4}>Click <strong style={guideStrong}>Add record</strong>. A window titled &ldquo;Add record&rdquo; pops up.</Step>
          <Step n={5}>At the top, next to Type, there&apos;s a dropdown that starts on &ldquo;A&rdquo; — click it and change it to <strong style={guideStrong}>CNAME</strong>. (Cloudflare always defaults new records to &ldquo;A&rdquo;; you have to switch it yourself.)</Step>
          <Step n={6}>In the <strong style={guideStrong}>Name</strong> box, type the subdomain from ProjectCheckin (e.g. <code>our-work</code>).</Step>
          <Step n={7}>Once you&apos;ve switched to CNAME, the field under IPv4 address will now say <strong style={guideStrong}>Target</strong> instead — paste the value shown in ProjectCheckin there (it looks like <code>cname.vercel-dns.com</code>).</Step>
          <Step n={8}>Look for <strong style={guideStrong}>Proxy status</strong> — it&apos;s a toggle switch, and it starts turned on with an orange cloud labeled &ldquo;Proxied.&rdquo; Click the toggle so it turns off, showing a gray cloud labeled &ldquo;DNS only.&rdquo; This step is easy to miss but matters — orange means Cloudflare intercepts the traffic itself, which can prevent your page from loading correctly.</Step>
          <Step n={9}>Leave <strong style={guideStrong}>TTL</strong> on Auto.</Step>
          <Step n={10}>Click <strong style={guideStrong}>Save</strong>.</Step>
          <p style={guidePLast}>Go back to the ProjectCheckin tab and click <strong style={guideStrong}>I&apos;ve Added It — Verify</strong>. It will show &ldquo;Waiting on DNS…&rdquo; — that&apos;s expected right after saving, not an error.</p>
        </GuideSection>

        <GuideSection title="Squarespace Domains">
          <p style={guideP}><em>(If your domain was bought through Google Domains, it now lives here — Google Domains moved all its customers to Squarespace.)</em></p>
          <Step n={1}>Log into squarespace.com and go to your account.</Step>
          <Step n={2}>Click <strong style={guideStrong}>Domains</strong>, then click on the domain you want to update.</Step>
          <Step n={3}>Click <strong style={guideStrong}>DNS Settings</strong>.</Step>
          <Step n={4}>Find the <strong style={guideStrong}>Custom Records</strong> section and click <strong style={guideStrong}>Add Record</strong>.</Step>
          <Step n={5}>Set it up like this: <strong style={guideStrong}>Type</strong> → CNAME, <strong style={guideStrong}>Host</strong> → your subdomain (e.g. <code>our-work</code>), <strong style={guideStrong}>Data/Value</strong> → the value shown in ProjectCheckin.</Step>
          <Step n={6}>Click <strong style={guideStrong}>Save</strong>.</Step>
          <Step n={7}>Go back to the ProjectCheckin tab and click <strong style={guideStrong}>I&apos;ve Added It — Verify</strong>.</Step>
        </GuideSection>

        <GuideSection title="Any Other Domain Company">
          <p style={guideP}>Every domain company&apos;s screens look a little different, but they all let you do the same thing. Look for a menu item called <strong style={guideStrong}>DNS</strong>, <strong style={guideStrong}>DNS Settings</strong>, or <strong style={guideStrong}>Manage DNS</strong> — usually found after clicking on your domain name inside your account.</p>
          <p style={guideP}>Once you find it, look for a button to <strong style={guideStrong}>Add a Record</strong>, and fill in: <strong style={guideStrong}>Type</strong> → CNAME, <strong style={guideStrong}>Host</strong> (sometimes Name/Subdomain) → the subdomain from ProjectCheckin, <strong style={guideStrong}>Value</strong> (sometimes Target/Points to/Data) → the value shown in ProjectCheckin.</p>
          <p style={guideP}>Save it, then go back to ProjectCheckin and click <strong style={guideStrong}>I&apos;ve Added It — Verify</strong>.</p>
          <p style={guidePLast}><strong style={guideStrong}>Stuck?</strong> Most domain companies offer live chat support. You can say exactly this: <em>&ldquo;I need to add a CNAME record for the subdomain [your subdomain] pointing to [the value from ProjectCheckin].&rdquo;</em> Most support agents can do this for you in a few minutes.</p>
        </GuideSection>

        <GuideSection title="Step 2 — Link Your New Page From Your Homepage">
          <p style={guideP}>Once your subdomain is verified and live, one more step makes it feel like a real part of your website instead of a separate thing: <strong style={guideStrong}>add a link to it from your homepage</strong>, the same way you&apos;d add a link to any other page on your site (like &ldquo;About&rdquo; or &ldquo;Contact&rdquo;).</p>
          <p style={guideP}>ProjectCheckin does not do this step for you automatically — it only builds the page itself. You (or whoever manages your website) need to add the link, because every website is built differently and we don&apos;t have access to edit your homepage directly.</p>
          <p style={guideP}>Once it&apos;s set up, your subdomain page already links back to your homepage on its own (that direction is automatic) — this step is just the other direction, so visitors on your homepage can find it too.</p>
          <p style={guideP}><strong style={guideStrong}>What to add:</strong> A link in your site&apos;s main menu (or footer) with text like &ldquo;Our Work&rdquo; or &ldquo;Recent Projects,&rdquo; pointing to your full subdomain address.</p>
          <p style={guideP}><strong style={guideStrong}>Where to add it, by platform:</strong></p>
          <p style={guideP}><strong style={guideStrong}>WordPress:</strong> Go to Appearance → Menus. Click Add Custom Link, paste your subdomain address in the URL box, type a label like &ldquo;Our Work,&rdquo; click Add to Menu, then Save Menu.</p>
          <p style={guideP}><strong style={guideStrong}>Squarespace:</strong> Go to Pages. Under your navigation section, click the + icon, choose Link, paste your subdomain address, give it a label, and save.</p>
          <p style={guideP}><strong style={guideStrong}>Wix:</strong> Open the Editor, click your site&apos;s menu bar, click Manage Menu (or + Add Item), choose Link, paste your subdomain address, add a label, and save.</p>
          <p style={guideP}><strong style={guideStrong}>Webflow:</strong> Open the Designer, click your navbar, select the Nav Menu element, add a new Nav Link, paste your subdomain address as the link&apos;s URL, and add a label.</p>
          <p style={guideP}><strong style={guideStrong}>Plain HTML site:</strong> Find the navigation section in your site&apos;s HTML (usually a <code>&lt;nav&gt;</code> or list of links near the top of the page). Add a new link following the same pattern as the others already there, then save and re-upload the file.</p>
          <p style={guidePLast}>If you&apos;re not sure how your specific site is built, tell whoever manages it: <em>&ldquo;Please add a menu link labeled &apos;Our Work&apos; pointing to [your subdomain address].&rdquo;</em></p>
        </GuideSection>

        <GuideSection title="Optional — Speed Up Google Indexing">
          <p style={guideP}>You don&apos;t need to do this. Google will find your new page on its own over time, since it already knows how to read the sitemap file this page automatically creates. But if you want Google to notice it faster, here&apos;s how:</p>
          <Step n={1}>Go to search.google.com/search-console and sign in with the same Google account connected to your business (or create a free account if you don&apos;t have one).</Step>
          <Step n={2}>Click <strong style={guideStrong}>Add Property</strong>, choose <strong style={guideStrong}>URL prefix</strong>, and type your full subdomain address.</Step>
          <Step n={3}>Follow Google&apos;s steps to verify you own it (usually by adding a small file or DNS record — Google will show you exactly what to do).</Step>
          <Step n={4}>Once verified, click <strong style={guideStrong}>Sitemaps</strong> in the left menu, type <code>sitemap.xml</code>, and click <strong style={guideStrong}>Submit</strong>.</Step>
          <p style={guidePLast}>That&apos;s it — Google will typically check the page within a few days instead of waiting for it to find the page on its own, which can take longer.</p>
        </GuideSection>

        <GuideSection title="Common Problems">
          <p style={guideP}><strong style={guideStrong}>I clicked Verify and it says &ldquo;Waiting on DNS…&rdquo; — is that broken?</strong> No — that&apos;s normal. DNS changes can take anywhere from a few minutes up to 48 hours to fully take effect everywhere on the internet (in practice, usually much closer to the &ldquo;few minutes&rdquo; end). ProjectCheckin checks automatically in the background; you don&apos;t need to keep clicking Verify. Just check back later.</p>
          <p style={guideP}><strong style={guideStrong}>My status shows Live, but visiting the page says &ldquo;This site can&apos;t be reached&rdquo; or &ldquo;connection closed.&rdquo;</strong> This is normal right after your status flips to Live — DNS resolving and your security certificate (the thing that makes a website load safely) are two separate steps, and the certificate can take a little while longer to finish, usually a few minutes, occasionally up to about an hour. Wait a bit and reload. If it&apos;s been over an hour and still not loading, reach out for help.</p>
          <p style={guideP}><strong style={guideStrong}>It&apos;s been more than 48 hours and it&apos;s still not verified.</strong> Double-check the record you added matches exactly: compare the Type, Host, and Value shown in Account → Connections against what you entered at your domain company. A common mistake is typing the whole subdomain (like <code>our-work.yoursite.com</code>) into the Host field instead of just <code>our-work</code> — most domain companies automatically add your domain name to whatever you type in Host. If you&apos;re on Cloudflare, make sure the proxy cloud icon next to the record is gray, not orange.</p>
          <p style={guideP}><strong style={guideStrong}>I don&apos;t have access to my domain&apos;s DNS settings at all.</strong> Some website builder plans lock this down completely. If that&apos;s you, no problem — keep using the <Link href="/help/guides/widget-install" style={guideLink}>embed widget</Link> instead. No action needed on your end.</p>
          <p style={guidePLast}><strong style={guideStrong}>Can I use this and the widget at the same time?</strong> Yes. There&apos;s no need to remove the widget if you already have it installed — this is simply the stronger option once it&apos;s live.</p>
        </GuideSection>

        <GuideSection title="Need Help?">
          <p style={guidePLast}>If you get stuck on any step above, reach out and we&apos;ll walk you through it.</p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
