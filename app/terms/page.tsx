import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service — ProjectCheckin',
  description: 'Terms of Service for ProjectCheckin.',
  alternates: { canonical: 'https://projectcheckin.com/terms' },
}

const EFFECTIVE_DATE = 'March 11, 2026'
const CONTACT_EMAIL = 'support@projectcheckin.com'

export default function TermsPage() {
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F0F9FF', minHeight: '100vh', color: '#0C4A6E' }}>

      {/* Header */}
      <header style={{ background: '#ffffff', borderBottom: '1px solid rgba(14,165,233,0.12)', padding: '18px 48px' }}>
        <div style={{ maxWidth: '1160px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: '20px', color: '#0C4A6E', textDecoration: 'none' }}>
            ProjectCheckin
          </Link>
          <Link href="/" style={{ fontSize: '14px', color: '#4A7FA0', textDecoration: 'none' }}>
            ← Back to home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2 }}>Terms of Service</h1>
        <p style={{ fontSize: '14px', color: '#4A7FA0', marginBottom: '48px' }}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="1. Acceptance of Terms">
          <p>By accessing or using ProjectCheckin (&ldquo;the Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, do not use the Service.</p>
          <p>The Service is operated by ProjectCheckin (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). These Terms apply to all users, including visitors, waitlist members, and paying subscribers.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>ProjectCheckin is a web-based platform that allows contractors and field service businesses to document completed jobs through check-ins and automatically generate publicly visible job pages intended to improve their online presence and local search visibility.</p>
          <p>We reserve the right to modify, suspend, or discontinue the Service at any time with reasonable notice.</p>
        </Section>

        <Section title="3. Accounts">
          <ul>
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account.</li>
            <li>You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a> if you believe your account has been compromised.</li>
            <li>You must be at least 18 years old to create an account.</li>
            <li>One account per business. You may not create multiple accounts to circumvent limitations or policies.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You agree not to use the Service to:</p>
          <ul>
            <li>Submit false, misleading, or fraudulent job information.</li>
            <li>Upload content that infringes the intellectual property rights of others.</li>
            <li>Upload photos or content that you do not have the right to share (including photos of private property without permission).</li>
            <li>Violate any applicable law or regulation.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Use automated tools to scrape, crawl, or extract data from the Service without our written permission.</li>
            <li>Transmit spam, malware, or other harmful content.</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </Section>

        <Section title="5. Your Content">
          <p>You retain ownership of all content you submit to the Service, including job descriptions, photos, and business information (&ldquo;Your Content&rdquo;).</p>
          <p>By submitting content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to host, display, reproduce, and distribute Your Content solely for the purpose of operating and providing the Service — including publishing public job pages on your behalf.</p>
          <p>You represent and warrant that:</p>
          <ul>
            <li>You have the right to submit all content you provide.</li>
            <li>Your content does not violate any applicable law or these Terms.</li>
            <li>Your content does not infringe the intellectual property or privacy rights of any third party.</li>
          </ul>
          <p>We do not claim ownership of Your Content. You may request removal of your content or account at any time by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section title="6. Subscriptions and Payment">
          <ul>
            <li>Paid features of the Service require a subscription. Subscription fees are billed in advance on a monthly basis.</li>
            <li>All payments are processed by Stripe. By subscribing, you agree to Stripe&apos;s terms of service.</li>
            <li>Founding member pricing, where offered, is locked in at the rate at the time of your subscription and does not increase as long as the subscription remains active.</li>
            <li>You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No partial refunds are issued for unused time except where required by our guarantee (see Section 7).</li>
            <li>We reserve the right to change subscription pricing with 30 days&apos; advance notice. Founding member rates are exempt from price increases as described above.</li>
          </ul>
        </Section>

        <Section title="7. Results Guarantee">
          <p>We offer a 90-day results guarantee on eligible paid plans under the following conditions:</p>
          <ul>
            <li>You must complete at least 3 job check-ins per week for 90 consecutive days.</li>
            <li>Your dashboard must not show measurable traffic activity (page views, phone taps, or website clicks) as recorded by our platform.</li>
            <li>To claim the guarantee, email us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a> within 30 days of completing the 90-day period.</li>
            <li>We will verify your check-in activity using platform data. If the conditions are met, we will refund your last 2 months of subscription fees.</li>
          </ul>
          <p>The guarantee applies to platform-measured outcomes only and does not guarantee specific business results such as revenue or new customers.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>The ProjectCheckin name, logo, software, and all associated intellectual property are owned by us or our licensors. Nothing in these Terms grants you a right to use our trademarks, trade names, or branding without our prior written consent.</p>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <p>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          <p>We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We do not warrant any specific results from use of the Service.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, PROJECTCHECKIN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
          <p>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE 12 MONTHS PRIOR TO THE CLAIM, OR (B) $100.</p>
        </Section>

        <Section title="11. Indemnification">
          <p>You agree to indemnify, defend, and hold harmless ProjectCheckin from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or related to your use of the Service, Your Content, or your violation of these Terms.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These Terms are governed by the laws of the State of Tennessee, without regard to its conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts located in Tennessee.</p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>We may update these Terms from time to time. When we do, we will update the effective date at the top of this page. If changes are material, we will notify you by email or by a notice on our website. Continued use of the Service after changes take effect constitutes your acceptance of the updated Terms.</p>
        </Section>

        <Section title="14. Termination">
          <p>We may suspend or terminate your access to the Service at any time for violation of these Terms or for any other reason at our discretion, with or without notice. Upon termination, your right to use the Service ceases immediately. Sections 5, 8, 9, 10, 11, and 12 survive termination.</p>
        </Section>

        <Section title="15. Contact">
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p><strong>ProjectCheckin</strong><br /><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a></p>
        </Section>
      </main>

      {/* Footer */}
      <footer style={{ background: '#ffffff', borderTop: '1px solid rgba(14,165,233,0.1)', padding: '24px 48px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#4A7FA0', margin: 0 }}>
          © 2026 ProjectCheckin &nbsp;·&nbsp;{' '}
          <Link href="/privacy" style={{ color: '#4A7FA0' }}>Privacy Policy</Link>
          {' '}&nbsp;·&nbsp;{' '}
          <Link href="/terms" style={{ color: '#4A7FA0' }}>Terms of Service</Link>
        </p>
      </footer>

    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '14px', color: '#0C4A6E' }}>{title}</h2>
      <div style={{ fontSize: '16px', lineHeight: 1.8, color: '#1e3a4f', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
      </div>
    </section>
  )
}
