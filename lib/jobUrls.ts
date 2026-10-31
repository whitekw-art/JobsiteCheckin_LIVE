import { slugify } from '@/lib/slugify'

// One place that builds every public job address and title (phase 3, part A).
// Before 2026-10-14 eight files each built the address by hand. The format,
// decided in the master plan (section 3):
//
//   job page   /jobs/{business-slug}/{city-state}/{service}-{street-name}-{job id}
//   city page  /jobs/{business-slug}/{city-state}
//   title      {Product} on {Street Name} in {City}, {ST}
//
// The street NAME never includes the house number or a unit (master plan 1.5,
// decision 13.2). The job id at the end is what identifies the job; every other
// part can change when the job is edited and the old address redirects.

const clean = (v: string | null | undefined) => (v || '').replace(/\s+/g, ' ').trim()

const UUID_TAIL = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The job id at the end of an address part, or null. */
export function extractJobId(part: string | null | undefined): string | null {
  const m = (part || '').match(UUID_TAIL)
  return m ? m[0].toLowerCase() : null
}

const UNIT_WORDS = 'apt|apartment|unit|suite|ste|bldg|building|fl|floor|lot|rm|room|space|spc|trlr|trailer'

function titleCaseIfShouting(s: string): string {
  const letters = s.replace(/[^A-Za-z]/g, '')
  if (!letters) return s
  const allUpper = letters === letters.toUpperCase()
  const allLower = letters === letters.toLowerCase()
  if (!allUpper && !allLower) return s
  return s
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase())
    // Compass points and ordinal suffixes keep their usual form.
    .replace(/\b(N|S|E|W|Ne|Nw|Se|Sw)\b/g, (m) => m.toUpperCase())
    .replace(/\b(\d+)(St|Nd|Rd|Th)\b/g, (_m, n: string, suf: string) => n + suf.toLowerCase())
}

/**
 * The street name without the house number or unit: "412 Broadway" gives
 * "Broadway", "1200 N Main St Apt 4" gives "N Main St", "412 12th Ave S, Unit 2"
 * gives "12th Ave S". Empty when there is no street name (nothing, only a
 * number, or a PO box).
 */
export function streetName(street: string | null | undefined): string {
  let s = clean(street)
  if (!s) return ''
  s = s.split(',')[0].trim()
  if (/^p\.?\s*o\.?\s*box\b/i.test(s)) return ''
  // Trailing unit: "Apt 4", "#5", "Suite 200", "Unit B".
  s = s.replace(new RegExp(`\\s+(?:(?:${UNIT_WORDS})\\.?\\s*#?\\s*[\\w-]+|#\\s*[\\w-]+)$`, 'i'), '').trim()
  // Leading house number: "412", "412A", "1200-1202", "12 1/2".
  const stripped = s.replace(/^\d+[a-z]?(?:\s*[-–]\s*\d+[a-z]?)?(?:\s+\d+\/\d+)?\s+/i, '').trim()
  s = stripped
  if (!/[a-z]/i.test(s)) return ''
  return titleCaseIfShouting(s)
}

export interface JobFields {
  id: string
  doorType?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
}

/** "Exterior Barn Doors on Broadway in Nashville, TN" (the heading, with no business name). */
export function jobHeading(job: Omit<JobFields, 'id'>): string {
  const product = clean(job.doorType)
  const street = streetName(job.street)
  const city = clean(job.city)
  const state = clean(job.state)
  const place = [city, state].filter(Boolean).join(', ')
  const base = product || 'Completed Job'
  const onStreet = street ? ` on ${street}` : ''
  return `${base}${onStreet}${place ? ` in ${place}` : ''}`
}

/** The tab and search title: the heading plus " | {Business}". */
export function jobTabTitle(job: Omit<JobFields, 'id'>, businessName: string | null | undefined): string {
  const name = clean(businessName)
  return name ? `${jobHeading(job)} | ${name}` : jobHeading(job)
}

/** "nashville-tn" (placeholders keep an address valid when a job has no city or state). */
export function citySlug(city: string | null | undefined, state: string | null | undefined): string {
  return `${slugify(clean(city)) || 'city'}-${slugify(clean(state)) || 'state'}`
}

/** "exterior-barn-doors-broadway-{job id}". */
export function jobSlug(job: JobFields): string {
  return [slugify(clean(job.doorType)) || 'job', slugify(streetName(job.street)), job.id.toLowerCase()]
    .filter(Boolean)
    .join('-')
}

const businessSegment = (orgSlug: string | null | undefined) => slugify(clean(orgSlug)) || 'business'

/** "/jobs/barn-door-company/nashville-tn/exterior-barn-doors-broadway-{job id}" */
export function jobPath(job: JobFields, orgSlug: string | null | undefined): string {
  return `/jobs/${businessSegment(orgSlug)}/${citySlug(job.city, job.state)}/${jobSlug(job)}`
}

/** "/jobs/barn-door-company/nashville-tn" */
export function cityPath(orgSlug: string | null | undefined, city: string | null | undefined, state: string | null | undefined): string {
  return `/jobs/${businessSegment(orgSlug)}/${citySlug(city, state)}`
}

/** The site's own address, without a trailing slash. */
export function appBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || 'https://projectcheckin.com').replace(/\/+$/, '')
}

export function jobUrl(job: JobFields, orgSlug: string | null | undefined, base: string = appBaseUrl()): string {
  return `${base}${jobPath(job, orgSlug)}`
}

export function cityUrl(
  orgSlug: string | null | undefined,
  city: string | null | undefined,
  state: string | null | undefined,
  base: string = appBaseUrl()
): string {
  return `${base}${cityPath(orgSlug, city, state)}`
}

/** A city page stays out of search results until the city has this many published jobs (decision 12.3). */
export const CITY_PAGE_INDEX_MIN_JOBS = 3

/** Jobs per city page (decision 12.2). */
export const CITY_PAGE_SIZE = 24

/** "exterior-barn-doors-broadway-nashville-tn": the WordPress post address ending (master plan 3.2). */
export function wpSlugBase(job: Omit<JobFields, 'id'>): string {
  return slugify([clean(job.doorType) || 'job', streetName(job.street), clean(job.city), clean(job.state)].filter(Boolean).join(' '))
}

/**
 * True when a saved post address ending still belongs to the job's current
 * details: the base itself, or the base with the zip or a number WordPress
 * added to make it unique. A job whose street, city, state or service changed
 * no longer matches, so its ending is rebuilt (and WordPress redirects the old one).
 */
export function slugMatchesBase(saved: string | null | undefined, base: string): boolean {
  if (!saved || !base) return false
  if (saved === base) return true
  if (!saved.startsWith(`${base}-`)) return false
  const rest = saved.slice(base.length)
  return /^-\d{1,6}$/.test(rest) || /^-\d{5}(-\d{4})?$/.test(rest)
}
