import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const FOUNDER_SPOTS = 20

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  elite: 'Elite',
  titan: 'Titan',
}

const TRADE_LABELS: Record<string, string> = {
  'doors-windows': 'Doors & Windows',
  roofing: 'Roofing',
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  landscaping: 'Landscaping / Lawn Care',
  painting: 'Painting',
  flooring: 'Flooring',
  'general-contractor': 'General Contractor',
  other: 'Other',
}

export default async function AdminWaitlistPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: 'asc' },
  })

  const founderCount = Math.min(entries.length, FOUNDER_SPOTS)
  const planCounts: Record<string, number> = {}
  for (const e of entries) {
    const key = e.planInterest ?? 'not_specified'
    planCounts[key] = (planCounts[key] ?? 0) + 1
  }

  return (
    <main style={{ fontFamily: 'monospace', padding: '40px', maxWidth: '1100px', margin: '0 auto', color: '#0f172a' }}>
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
          SUPER_ADMIN — ProjectCheckin
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0 }}>Waitlist</h1>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Stat label="Total signups" value={entries.length} />
        <Stat label="Founder spots claimed" value={`${founderCount} / ${FOUNDER_SPOTS}`} highlight={founderCount >= FOUNDER_SPOTS} />
        <Stat label="Spots remaining" value={Math.max(0, FOUNDER_SPOTS - entries.length)} />
        {Object.entries(planCounts).map(([plan, count]) => (
          <Stat key={plan} label={PLAN_LABELS[plan] ?? plan} value={count} sub="interested" />
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Business</Th>
              <Th>Trade</Th>
              <Th>Plan interest</Th>
              <Th>Signed up</Th>
              <Th>Founder?</Th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              const isFounder = i < FOUNDER_SPOTS
              return (
                <tr
                  key={entry.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: isFounder ? '#f0fdf4' : undefined,
                  }}
                >
                  <Td>{i + 1}</Td>
                  <Td>{entry.name ?? <span style={{ color: '#94a3b8' }}>—</span>}</Td>
                  <Td>
                    <a href={`mailto:${entry.email}`} style={{ color: '#0EA5E9', textDecoration: 'none' }}>
                      {entry.email}
                    </a>
                  </Td>
                  <Td>{entry.businessName ?? <span style={{ color: '#94a3b8' }}>—</span>}</Td>
                  <Td>{entry.trade ? (TRADE_LABELS[entry.trade] ?? entry.trade) : <span style={{ color: '#94a3b8' }}>—</span>}</Td>
                  <Td>{entry.planInterest ? (PLAN_LABELS[entry.planInterest] ?? entry.planInterest) : <span style={{ color: '#94a3b8' }}>—</span>}</Td>
                  <Td>
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Td>
                  <Td>
                    {isFounder ? (
                      <span style={{ background: '#16a34a', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                        YES
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>No</span>
                    )}
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {entries.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '14px' }}>
            No waitlist signups yet.
          </p>
        )}
      </div>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#94a3b8' }}>
        Sorted by signup date ascending. First {FOUNDER_SPOTS} highlighted in green = eligible for Founder50 discount.
        Adjust <code>FOUNDER_SPOTS</code> constant in this file to change the threshold.
      </p>
    </main>
  )
}

function Stat({ label, value, highlight, sub }: { label: string; value: string | number; highlight?: boolean; sub?: string }) {
  return (
    <div style={{
      background: highlight ? '#fef2f2' : '#f8fafc',
      border: `1px solid ${highlight ? '#fca5a5' : '#e2e8f0'}`,
      borderRadius: '8px',
      padding: '16px 20px',
      minWidth: '120px',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 800, color: highlight ? '#dc2626' : '#0f172a' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{sub}</div>}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ padding: '8px 12px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', whiteSpace: 'nowrap' }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
      {children}
    </td>
  )
}
