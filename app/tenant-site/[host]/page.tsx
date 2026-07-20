import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

// Fully server-rendered page served on a customer's own subdomain via CNAME
// (Website Integration for Local SEO — Phase 2). No client JS for content:
// everything must exist in the raw HTML so AI crawlers (which don't execute
// JavaScript) and Google's first-pass indexer see it immediately.

export const revalidate = 300

interface TenantPageProps {
  params: Promise<{ host: string }>
}

async function getOrgByHost(host: string) {
  const cleanHost = decodeURIComponent(host).toLowerCase()
  return prisma.organization.findUnique({
    where: { customSubdomain: cleanHost },
    include: {
      checkIns: {
        where: { isPublic: true },
        orderBy: { timestamp: 'desc' },
      },
    },
  })
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function byFrequency(values: string[]): string[] {
  const counts = new Map<string, number>()
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
}

function formatMonthYear(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export async function generateMetadata({ params }: TenantPageProps): Promise<Metadata> {
  const { host } = await params
  const org = await getOrgByHost(host)
  if (!org) return { title: 'Not Found' }

  const jobs = org.checkIns
  const types = byFrequency(jobs.map((j) => (j.doorType || '').trim()).filter(Boolean))
  const cities = byFrequency(jobs.map((j) => (j.city || '').trim()).filter(Boolean))

  const title =
    types[0] && cities[0]
      ? `${types[0]} in ${cities[0]} — ${org.name}`
      : `Our Work — ${org.name}`
  const description =
    types.length && cities.length
      ? `See completed ${joinList(types.slice(0, 3).map((t) => t.toLowerCase()))} jobs across ${joinList(cities.slice(0, 3))} — with photos from every project by ${org.name}.`
      : `Browse recent completed jobs and project photos from ${org.name}.`

  const canonicalUrl = `https://${decodeURIComponent(host).toLowerCase()}/`
  const firstPhoto = jobs.find((c) => c.photoUrls)?.photoUrls?.split(',')[0]?.trim()

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'website',
      ...(firstPhoto && { images: [{ url: firstPhoto, alt: `${org.name} completed work` }] }),
    },
  }
}

export default async function TenantSitePage({ params }: TenantPageProps) {
  const { host } = await params
  const org = await getOrgByHost(host)
  if (!org) notFound()

  const cleanHost = decodeURIComponent(host).toLowerCase()
  const pageUrl = `https://${cleanHost}/`
  const pckBase = (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/$/, '')

  const jobs = org.checkIns.map((job) => {
    const photos = job.photoUrls
      ? job.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []
    const citySlug = slugify(job.city || '')
    const stateSlug = slugify(job.state || '')
    const doorTypeSlug = slugify(job.doorType || 'job')
    const jobSlug = org.slug ? `${doorTypeSlug}-${org.slug}-${job.id}` : `${doorTypeSlug}-${job.id}`
    return {
      id: job.id,
      jobType: (job.doorType || 'Job').trim(),
      city: job.city?.trim() || '',
      state: job.state?.trim() || '',
      description: job.seoDescription || job.notes || null,
      photos,
      date: job.timestamp,
      pckUrl: `${pckBase}/jobs/${citySlug || 'city'}-${stateSlug || 'state'}/${jobSlug}`,
    }
  })

  // Group by "City, ST" — jobs with no city go last under "Other Projects"
  const groups = new Map<string, typeof jobs>()
  for (const job of jobs) {
    const key = job.city ? [job.city, job.state].filter(Boolean).join(', ') : 'Other Projects'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(job)
  }
  const groupEntries = [...groups.entries()].sort((a, b) => {
    if (a[0] === 'Other Projects') return 1
    if (b[0] === 'Other Projects') return -1
    return b[1].length - a[1].length
  })

  const types = byFrequency(jobs.map((j) => j.jobType).filter(Boolean))
  const cities = byFrequency(jobs.map((j) => j.city).filter(Boolean))
  const intro =
    org.portfolioIntro ||
    (types.length && cities.length
      ? `${org.name} specializes in ${joinList(types.slice(0, 3).map((t) => t.toLowerCase()))} across ${joinList(cities.slice(0, 3))}.`
      : `Recent completed work by ${org.name}.`)

  const normalizedWebsite =
    org.website && org.website.startsWith('http')
      ? org.website
      : org.website
        ? `https://${org.website}`
        : ''

  // JSON-LD @graph — mirrors the widget's structure (LocalBusiness +
  // CollectionPage + ItemList) but rendered server-side into the HTML
  const businessId = `${pageUrl}#business`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': businessId,
        name: org.name,
        ...(org.phone && { telephone: org.phone }),
        ...(normalizedWebsite && { url: normalizedWebsite }),
        ...(org.email && { email: org.email }),
        ...(cities.length > 0 && {
          areaServed: cities.map((city) => ({ '@type': 'Place', name: city })),
        }),
      },
      {
        '@type': 'CollectionPage',
        '@id': `${pageUrl}#page`,
        url: pageUrl,
        name: `Our Work — ${org.name}`,
        description: intro,
        about: { '@id': businessId },
        mainEntity: { '@id': `${pageUrl}#itemlist` },
      },
      {
        '@type': 'ItemList',
        '@id': `${pageUrl}#itemlist`,
        numberOfItems: jobs.length,
        itemListElement: jobs.map((job, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Service',
            name: job.city ? `${job.jobType} in ${job.city}${job.state ? `, ${job.state}` : ''}` : job.jobType,
            provider: { '@id': businessId },
            ...(job.description && { description: job.description }),
            url: job.pckUrl,
            ...(job.photos[0] && {
              image: {
                '@type': 'ImageObject',
                contentUrl: job.photos[0],
                ...(job.date && { datePublished: job.date.toISOString() }),
              },
            }),
          },
        })),
      },
    ],
  }

  return (
    <main style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: '#FDFCFA', color: '#1C2430', minHeight: '100vh', margin: 0 }}>
      {/* JSON.stringify alone can't be trusted inside a <script> block — user-entered
          descriptions could contain "</script>". Escaping "<" closes that hole. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div style={{ maxWidth: 880, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <header style={{ borderBottom: '3px solid #1C2430', paddingBottom: 28, marginBottom: 36 }}>
          <h1 style={{ fontSize: 38, lineHeight: 1.15, margin: 0, fontWeight: 700, letterSpacing: '-0.5px' }}>
            Our Work — {org.name}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: '#4A5568', margin: '14px 0 0', maxWidth: 640 }}>
            {intro}
          </p>
          {(org.phone || normalizedWebsite) && (
            <p style={{ fontSize: 15, margin: '14px 0 0', color: '#1C2430' }}>
              {org.phone && <span>Call us: <a href={`tel:${org.phone.replace(/\D/g, '')}`} style={{ color: '#1C2430', fontWeight: 700 }}>{org.phone}</a></span>}
              {org.phone && normalizedWebsite && <span style={{ margin: '0 10px', color: '#CBD5E1' }}>|</span>}
              {normalizedWebsite && <a href={normalizedWebsite} style={{ color: '#1C2430', fontWeight: 700 }}>Visit our main site</a>}
            </p>
          )}
        </header>

        {jobs.length === 0 && (
          <p style={{ fontSize: 16, color: '#4A5568' }}>
            New projects are on the way — check back soon to see our completed work.
          </p>
        )}

        {/* City groups */}
        {groupEntries.map(([groupLabel, groupJobs]) => (
          <section key={groupLabel} style={{ marginBottom: 44 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 18px', paddingBottom: 8, borderBottom: '1px solid #E2E8F0' }}>
              {groupLabel === 'Other Projects' ? 'Other Projects' : `Projects in ${groupLabel}`}
            </h2>
            {groupJobs.map((job) => (
              <article key={job.id} style={{ marginBottom: 30 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px' }}>
                  {job.jobType}
                  {job.date && <span style={{ fontWeight: 400, color: '#718096' }}> — {formatMonthYear(job.date)}</span>}
                </h3>
                {job.description && (
                  <p style={{ fontSize: 15, lineHeight: 1.65, color: '#2D3748', margin: '0 0 12px', maxWidth: 680 }}>
                    {job.description}
                  </p>
                )}
                {job.photos.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                    {job.photos.slice(0, 3).map((photo, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={photo}
                        src={photo}
                        alt={`${job.jobType}${job.city ? ` in ${job.city}${job.state ? `, ${job.state}` : ''}` : ''} — ${org.name}${i > 0 ? ` (photo ${i + 1})` : ''}`}
                        loading="lazy"
                        style={{ width: 220, height: 160, objectFit: 'cover', borderRadius: 4, border: '1px solid #E2E8F0' }}
                      />
                    ))}
                  </div>
                )}
                <a href={job.pckUrl} style={{ fontSize: 13.5, color: '#2B6CB0' }}>
                  View full job details →
                </a>
              </article>
            ))}
          </section>
        ))}

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #E2E8F0', paddingTop: 20, marginTop: 20, fontSize: 13, color: '#718096' }}>
          Powered by{' '}
          <a
            href={`${pckBase}/?utm_source=hosted-site&utm_medium=powered-by&utm_campaign=${org.slug || 'tenant'}`}
            style={{ color: '#2B6CB0', fontWeight: 700 }}
          >
            ProjectCheckin
          </a>
        </footer>
      </div>
    </main>
  )
}
