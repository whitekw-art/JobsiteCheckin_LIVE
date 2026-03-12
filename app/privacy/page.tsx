import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — ProjectCheckin',
  description: 'Privacy Policy for ProjectCheckin.',
  alternates: { canonical: 'https://projectcheckin.com/privacy' },
}

const EFFECTIVE_DATE = 'March 11, 2026'
const CONTACT_EMAIL = 'support@projectcheckin.com'

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '8px', lineHeight: 1.2 }}>Privacy Policy</h1>
        <p style={{ fontSize: '14px', color: '#4A7FA0', marginBottom: '48px' }}>Effective date: {EFFECTIVE_DATE}</p>

        <Section title="1. Who We Are">
          <p>ProjectCheckin (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is a web-based application that helps contractors and field service businesses document completed jobs and build an online presence. Our website is located at <strong>projectcheckin.com</strong>.</p>
          <p>Questions about this policy may be directed to <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section title="2. Information We Collect">
          <Subsection title="Information you provide directly">
            <ul>
              <li><strong>Waitlist sign-up:</strong> name, email address, business name, trade type, and plan interest.</li>
              <li><strong>Account registration:</strong> name, email address, business name, and password (stored as a secure hash — we never store your plain-text password).</li>
              <li><strong>Job check-ins:</strong> job description, service type, location (city/state), job photos, and crew information you choose to enter.</li>
              <li><strong>Payment information:</strong> billing details collected and processed by Stripe. We do not store your credit card number — Stripe handles all payment data.</li>
            </ul>
          </Subsection>
          <Subsection title="Information collected automatically">
            <ul>
              <li><strong>Usage data:</strong> pages visited, features used, and actions taken within the app.</li>
              <li><strong>Device and browser information:</strong> IP address, browser type, operating system, and referring URL.</li>
              <li><strong>Cookies and similar technologies:</strong> we use session cookies required for authentication and may use analytics cookies to understand how the app is used. You can control cookies through your browser settings.</li>
            </ul>
          </Subsection>
        </Section>

        <Section title="3. How We Use Your Information">
          <ul>
            <li>To provide, operate, and improve the ProjectCheckin service.</li>
            <li>To create and publish public job pages on your behalf (you control what is published).</li>
            <li>To send transactional emails such as account confirmations, password resets, and waitlist updates.</li>
            <li>To send marketing emails to waitlist members and subscribers. You may unsubscribe at any time using the link in any email.</li>
            <li>To process subscription payments through Stripe.</li>
            <li>To comply with legal obligations and enforce our Terms of Service.</li>
          </ul>
        </Section>

        <Section title="4. How We Share Your Information">
          <p>We do not sell your personal information. We share data only as follows:</p>
          <ul>
            <li><strong>Service providers:</strong> we use third-party vendors who process data on our behalf, including Stripe (payments), Resend (email delivery), Supabase (database hosting), and Vercel (application hosting). These providers are contractually bound to protect your data.</li>
            <li><strong>Public job pages:</strong> job information you submit for publication (job description, photos, location, service type) is made publicly visible on projectcheckin.com as part of the core service. You control what is submitted and can request removal.</li>
            <li><strong>Legal requirements:</strong> we may disclose your information if required by law or in response to a valid legal process.</li>
            <li><strong>Business transfers:</strong> if ProjectCheckin is acquired or merged with another company, your information may be transferred as part of that transaction.</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <p>We retain your personal information for as long as your account is active or as needed to provide you services. If you request account deletion, we will delete or anonymize your personal data within 30 days, except where we are required to retain it for legal or financial record-keeping purposes.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you.</li>
            <li>Correct inaccurate personal information.</li>
            <li>Request deletion of your personal information.</li>
            <li>Opt out of marketing emails at any time via the unsubscribe link in any email.</li>
          </ul>
          <p>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section title="7. Security">
          <p>We implement industry-standard security measures including encrypted data transmission (HTTPS), hashed password storage, and access controls. No method of transmission or storage is 100% secure. If you believe your account has been compromised, contact us immediately at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: '#0EA5E9' }}>{CONTACT_EMAIL}</a>.</p>
        </Section>

        <Section title="8. Children's Privacy">
          <p>ProjectCheckin is not directed to individuals under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information, please contact us and we will delete it promptly.</p>
        </Section>

        <Section title="9. Third-Party Links">
          <p>Our service may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page. If changes are material, we will notify you by email or by a notice on our website. Continued use of the service after changes take effect constitutes your acceptance of the updated policy.</p>
        </Section>

        <Section title="11. Contact">
          <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
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

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px', color: '#0C4A6E' }}>{title}</h3>
      {children}
    </div>
  )
}
