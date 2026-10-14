import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { appBaseUrl, CITY_PAGE_INDEX_MIN_JOBS, cityPath, cityUrl, jobHeading, jobPath } from '@/lib/jobUrls'
import { photoAlt } from '@/lib/photoAlt'
import type { CityJob, JobsRoute } from './resolve'

// The city page (phase 3, part B): one business's published jobs in one city,
// at /jobs/{business}/{city-state}. It gives the city step of the job page's
// breadcrumb a real page to open. projectcheckin.com only; nothing is created
// on a customer's WordPress site (decision 12.4).

type CityRoute = Extract<JobsRoute, { kind: 'city' }>

const photoList = (value: string | null | undefined) =>
  value ? value.split(',').map((u) => u.trim()).filter(Boolean) : []

function cover(job: CityJob): string | null {
  const all = photoList(job.photoUrls)
  if (job.featuredPhotoUrl && all.includes(job.featuredPhotoUrl)) return job.featuredPhotoUrl
  return all[0] ?? null
}

const monthYear = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : ''

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * The summary sentence block, counted from the published jobs each time the
 * page is built. It is not written by AI and contains neither homeowner names
 * nor street numbers, and it stays accurate as jobs are added, edited or
 * unpublished.
 */
export function citySummary(businessName: string, place: string, jobs: Array<Pick<CityJob, 'doorType' | 'timestamp'>>): string {
  const counts = new Map<string, { label: string; n: number }>()
  let latest: Date | null = null
  for (const j of jobs) {
    const label = (j.doorType || 'Other projects').trim() || 'Other projects'
    const key = label.toLowerCase()
    const entry = counts.get(key)
    if (entry) entry.n += 1
    else counts.set(key, { label, n: 1 })
    if (j.timestamp && (!latest || j.timestamp > latest)) latest = j.timestamp
  }
  const sorted = [...counts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label))
  const total = jobs.length
  const first = `${businessName} has published ${total} ${total === 1 ? 'project' : 'projects'} in ${place}.`
  const kinds = sorted.map((c) => `${c.label} (${c.n})`)
  const second = total === 1 ? `The project is ${sorted[0].label}.` : `The projects are ${joinList(kinds)}.`
  const third = latest ? ` The most recent project was completed in ${monthYear(latest)}.` : ''
  return `${first} ${second}${third}`
}

function cityTitle(route: CityRoute): string {
  const place = [route.city, route.state].filter(Boolean).join(', ')
  return `Projects in ${place}`
}

export function cityMetadata(route: CityRoute): Metadata {
  const business = route.org.name
  const place = [route.city, route.state].filter(Boolean).join(', ')
  const base = cityUrl(route.org.slug, route.city, route.state)
  const url = route.page > 1 ? `${base}?page=${route.page}` : base
  const title = `${cityTitle(route)} | ${business}${route.page > 1 ? ` (page ${route.page})` : ''}`
  const description = citySummary(business, place, route.allJobs)
  const indexable = route.total >= CITY_PAGE_INDEX_MIN_JOBS
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title, description, type: 'website', url, siteName: business },
  }
}

function PageLinks({ route }: { route: CityRoute }) {
  if (route.pageCount <= 1) return null
  const base = cityPath(route.org.slug, route.city, route.state)
  const href = (n: number) => (n === 1 ? base : `${base}?page=${n}`)
  const pages = Array.from({ length: route.pageCount }, (_, i) => i + 1)
  return (
    <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {route.page > 1 && (
        <Link href={href(route.page - 1)} rel="prev" className="px-3 py-2 text-[0.85rem] text-primary-700 underline min-h-0 min-w-0">
          Previous
        </Link>
      )}
      {pages.map((n) =>
        n === route.page ? (
          <span key={n} aria-current="page" className="px-3 py-2 text-[0.85rem] font-bold text-surface-900">
            {n}
          </span>
        ) : (
          <Link key={n} href={href(n)} className="px-3 py-2 text-[0.85rem] text-primary-700 underline min-h-0 min-w-0">
            {n}
          </Link>
        )
      )}
      {route.page < route.pageCount && (
        <Link href={href(route.page + 1)} rel="next" className="px-3 py-2 text-[0.85rem] text-primary-700 underline min-h-0 min-w-0">
          Next
        </Link>
      )}
    </nav>
  )
}

export function CityView({ route }: { route: CityRoute }) {
  const { org } = route
  const business = org.name
  const place = [route.city, route.state].filter(Boolean).join(', ')
  const baseUrl = appBaseUrl()
  const pageUrl = cityUrl(org.slug, route.city, route.state, baseUrl)
  const phone = (org.phone || '').trim()
  const website = (org.website || '').trim()
  const websiteHref = website ? (website.startsWith('http') ? website : `https://${website}`) : ''
  const summary = citySummary(business, place, route.allJobs)

  const breadcrumb: Array<{ name: string; href: string | null }> = [
    ...(org.slug ? [{ name: business, href: `/portfolio/${org.slug}` }] : []),
    { name: place, href: null },
  ]
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumb.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.href ? `${baseUrl}${c.href}` : pageUrl,
    })),
  }

  return (
    <main className="min-h-screen bg-surface-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />

      <header style={{ background: 'linear-gradient(160deg, #0f1f17 0%, #0a1610 40%, #080e0b 100%)' }}>
        <div className="max-w-[76rem] mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {org.slug && (
              <Link href={`/portfolio/${org.slug}`} className="text-white/60 hover:text-white text-[0.8rem] shrink-0 min-h-0 min-w-0">
                &larr; <span className="hidden sm:inline">Back to Portfolio</span>
              </Link>
            )}
            <span className="font-display font-bold text-[0.95rem] text-white tracking-tight truncate">{business}</span>
          </div>
          {phone && (
            <a
              href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-semibold text-[0.8rem] px-4 py-1.5 rounded-md min-h-[36px] shrink-0"
            >
              Get a Free Estimate
            </a>
          )}
        </div>
      </header>

      <section className="max-w-[76rem] mx-auto px-5 sm:px-8 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.8rem] text-surface-500">
            {breadcrumb.map((c, i) => (
              <li key={`${c.name}-${i}`} className="inline-flex items-center gap-2 min-w-0">
                {i > 0 && <span aria-hidden="true">&rsaquo;</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-primary-600 underline-offset-2 hover:underline min-h-0 min-w-0">
                    {c.name}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-surface-700 font-medium">
                    {c.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <h1 className="font-display text-[1.8rem] sm:text-[2.2rem] lg:text-[2.6rem] font-bold text-surface-900 tracking-tight leading-[1.1]">
          {business} Projects in {place}
        </h1>
        <p className="mt-4 max-w-[46rem] text-[0.95rem] text-surface-700 leading-relaxed">{summary}</p>

        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {route.jobs.map((job) => {
            const photo = cover(job)
            const photos = photoList(job.photoUrls)
            const heading = jobHeading(job)
            return (
              <li key={job.id}>
                <Link
                  href={jobPath(job, org.slug)}
                  className="group block bg-white rounded-xl overflow-hidden border border-surface-200 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-shadow"
                >
                  <div className="aspect-[16/10] bg-surface-100 relative overflow-hidden">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={photoAlt(job, photo, Math.max(0, photos.indexOf(photo)), photos.length)}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : null}
                  </div>
                  <div className="px-4 py-3.5">
                    {job.doorType && (
                      <span className="inline-block text-[0.68rem] font-bold text-primary-700 uppercase tracking-wide px-2 py-0.5 rounded bg-primary-50 border border-primary-100">
                        {job.doorType}
                      </span>
                    )}
                    <div className="mt-2 font-display text-[0.95rem] font-semibold text-surface-900 leading-tight">{heading}</div>
                    {job.timestamp && <div className="mt-1 text-[0.75rem] text-surface-500">{monthYear(job.timestamp)}</div>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>

        <PageLinks route={route} />

        {org.slug && (
          <p className="mt-10 text-center">
            <Link href={`/portfolio/${org.slug}`} className="text-[0.9rem] font-semibold text-primary-700 underline min-h-0 min-w-0">
              View Full Portfolio &rsaquo;
            </Link>
          </p>
        )}
      </section>

      <section className="py-10 md:py-14" style={{ background: 'linear-gradient(160deg, #0f1f17 0%, #0a1610 50%, #080e0b 100%)' }}>
        <div className="max-w-[42rem] mx-auto px-6 text-center">
          <h2 className="font-display text-[1.5rem] sm:text-[1.8rem] font-bold text-white">Need a door installed?</h2>
          <p className="mt-2 text-white/60 text-[0.92rem]">Get a free estimate from {business}.</p>
          <div className="flex justify-center gap-2.5 mt-6 flex-wrap">
            {phone && (
              <a
                href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center bg-primary-600 hover:bg-primary-500 text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px]"
              >
                Get a Free Estimate
              </a>
            )}
            {websiteHref && (
              <a
                href={websiteHref}
                rel="noopener"
                className="inline-flex items-center text-white font-semibold px-6 py-3 rounded-lg text-[0.88rem] min-h-[44px]"
                style={{ border: '1px solid rgba(255,255,255,0.25)' }}
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-surface-50 py-6 text-center text-[0.75rem] text-surface-500">
        Powered by{' '}
        <a href="https://projectcheckin.com" className="underline min-h-0 min-w-0">
          ProjectCheckin
        </a>
      </footer>
    </main>
  )
}
