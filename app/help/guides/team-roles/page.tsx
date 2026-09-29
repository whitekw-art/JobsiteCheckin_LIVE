import type { Metadata } from 'next'
import DashboardShell from '@/components/DashboardShell'
import { GuideBreadcrumb, GuideSection, guideP, guidePLast, guideStrong } from '@/components/HelpGuideSections'

export const metadata: Metadata = { title: 'Team Roles and Access — Help & Support' }

/**
 * What each team role can actually do.
 *
 * Every privilege listed here is taken from the checks the app enforces, not
 * from intent: the route guards in middleware.ts and the role gates on the
 * /api/team and /api/organization routes. If a gate changes, this page is
 * wrong and needs updating with it.
 */
export default function TeamRolesGuidePage() {
  return (
    <DashboardShell title="Team Roles and Access">
      <div style={{ maxWidth: 700 }}>
        <GuideBreadcrumb />
        <p style={{ fontSize: 13.5, color: 'var(--t2)', lineHeight: 1.7, margin: '0 0 6px' }}>
          Every person you invite gets one of three roles. The role decides what they can see and change.
          You can change someone&apos;s role, or remove them, at any time from the Team page.
        </p>
        <p style={{ fontSize: 12.5, color: 'var(--t3)', margin: '0 0 8px', lineHeight: 1.6 }}>
          Most of your team should be a User. Give out Admin and Owner sparingly.
        </p>

        <GuideSection title="User — for your field crew" defaultOpen>
          <p style={guideP}>
            <strong style={guideStrong}>This is the role almost everyone should have.</strong> It is built for
            the people doing the work on site: they capture the job, and nothing else.
          </p>
          <p style={guideP}><strong style={guideStrong}>A User can:</strong></p>
          <p style={guideP}>• Submit a check-in — photos, location, and a description of the completed work.</p>
          <p style={guideP}>• See their own jobs.</p>
          <p style={guideP}><strong style={guideStrong}>A User cannot:</strong></p>
          <p style={guideP}>• Open the Job Dashboard or publish anything.</p>
          <p style={guideP}>• See the Team page, invite anyone, or change roles.</p>
          <p style={guidePLast}>• Reach billing, business settings, or any connection.</p>
        </GuideSection>

        <GuideSection title="Admin — for a manager who reviews work">
          <p style={guideP}>
            For someone you trust to decide what gets published and who is on the crew, but who should
            not be changing the business itself.
          </p>
          <p style={guideP}><strong style={guideStrong}>An Admin can do everything a User can, plus:</strong></p>
          <p style={guideP}>• Use the Job Dashboard — review, edit, and publish submitted jobs.</p>
          <p style={guideP}>• See the Team page and invite new members.</p>
          <p style={guideP}>• See reporting.</p>
          <p style={guideP}><strong style={guideStrong}>An Admin cannot:</strong></p>
          <p style={guideP}>• Change anyone&apos;s role, or remove a team member.</p>
          <p style={guidePLast}>
            • Change your business profile, billing, or the connections that publish your work.
          </p>
        </GuideSection>

        <GuideSection title="Owner — full control of the account">
          <p style={guideP}>
            <strong style={guideStrong}>Owner has full authority over the account and should be limited.</strong>{' '}
            Anyone with this role can change what you are billed and where your work gets published.
          </p>
          <p style={guideP}><strong style={guideStrong}>An Owner can do everything an Admin can, plus:</strong></p>
          <p style={guideP}>• Change any team member&apos;s role, and remove team members.</p>
          <p style={guideP}>• Manage billing, the plan, and cancellation.</p>
          <p style={guideP}>• Change the business profile — name, phone, website, and trade.</p>
          <p style={guidePLast}>
            • Manage every connection: Google Business Profile, Search Console, the website widget,
            your CNAME subdomain, and WordPress publishing.
          </p>
        </GuideSection>

        <GuideSection title="Changing someone's role">
          <p style={guideP}>
            Go to <strong style={guideStrong}>Team</strong> in the left sidebar. Each person is listed with
            their role beside them. Pick a different role from the dropdown and it takes effect immediately.
          </p>
          <p style={guidePLast}>
            Only an Owner can change roles or remove someone. If the dropdown is not there, you are signed
            in as an Admin.
          </p>
        </GuideSection>
      </div>
    </DashboardShell>
  )
}
