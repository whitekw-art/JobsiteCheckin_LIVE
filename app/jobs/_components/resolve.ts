import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { CITY_PAGE_SIZE, citySlug, extractJobId, jobPath } from '@/lib/jobUrls'

// Decides what a /jobs/... address is (phase 3, part B). One route serves every
// shape, because the city page /jobs/{business}/{city-state} has the same shape
// as the old job address /jobs/{city-state}/{job} (master plan 8.1):
//
//   /jobs/{business}                          redirect to the business's portfolio
//   /jobs/{x}/{part}   part ends in a job id  old job address: redirect to the current one
//   /jobs/{business}/{city-state}             city page
//   /jobs/{business}/{city-state}/{job}       job page (redirects when any part is out of date)

export const getJobWithOrg = cache(async (id: string) =>
  prisma.checkIn.findUnique({ where: { id }, include: { organization: true } })
)

export type JobWithOrg = NonNullable<Awaited<ReturnType<typeof getJobWithOrg>>>

const getOrgBySlug = cache(async (slug: string) => prisma.organization.findUnique({ where: { slug } }))
const getOrgByPreviousSlug = cache(async (slug: string) =>
  prisma.organization.findFirst({ where: { previousSlugs: { has: slug } } })
)

export type OrgRow = NonNullable<Awaited<ReturnType<typeof getOrgBySlug>>>

const getCityJobs = cache(async (orgId: string) =>
  prisma.checkIn.findMany({
    where: { organizationId: orgId, isPublic: true },
    select: {
      id: true,
      doorType: true,
      street: true,
      city: true,
      state: true,
      timestamp: true,
      photoUrls: true,
      featuredPhotoUrl: true,
      beforePhotoUrl: true,
      afterPhotoUrl: true,
      photoAltText: true,
    },
    orderBy: { timestamp: 'desc' },
  })
)

export type CityJob = Awaited<ReturnType<typeof getCityJobs>>[number]

export type JobsRoute =
  | { kind: 'notFound' }
  | { kind: 'redirect'; to: string }
  | { kind: 'job'; job: JobWithOrg }
  | {
      kind: 'city'
      org: OrgRow
      city: string
      state: string
      citySlug: string
      page: number
      pageCount: number
      total: number
      /** Jobs on this page. */
      jobs: CityJob[]
      /** Every published job in the city, for the summary counts. */
      allJobs: CityJob[]
    }

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw || !/^\d{1,4}$/.test(raw)) return 1
  const n = parseInt(raw, 10)
  return n >= 1 ? n : 1
}

export const resolveJobsRoute = cache(
  async (business: string, rest: string[] | undefined, page: number): Promise<JobsRoute> => {
    const parts = rest ?? []

    // /jobs/{business}: nothing sensible to show, so send people to the portfolio.
    if (parts.length === 0) {
      const org = (await getOrgBySlug(business)) ?? (await getOrgByPreviousSlug(business))
      return org?.slug ? { kind: 'redirect', to: `/portfolio/${org.slug}` } : { kind: 'notFound' }
    }

    if (parts.length > 2) return { kind: 'notFound' }

    // Old job address /jobs/{city-state}/{job}, or a job address with the city
    // part missing: the job id at the end is all that is needed.
    if (parts.length === 1) {
      const id = extractJobId(parts[0])
      if (id) {
        const job = await getJobWithOrg(id)
        if (!job || !job.isPublic) return { kind: 'notFound' }
        return { kind: 'redirect', to: jobPath(job, job.organization?.slug) }
      }
      return resolveCity(business, parts[0], page)
    }

    // /jobs/{business}/{city-state}/{job}
    const id = extractJobId(parts[1])
    if (!id) return { kind: 'notFound' }
    const job = await getJobWithOrg(id)
    if (!job || !job.isPublic) return { kind: 'notFound' }
    const canonical = jobPath(job, job.organization?.slug)
    if (canonical !== `/jobs/${business}/${parts[0]}/${parts[1]}`) return { kind: 'redirect', to: canonical }
    return { kind: 'job', job }
  }
)

async function resolveCity(business: string, cityPart: string, page: number): Promise<JobsRoute> {
  let org = await getOrgBySlug(business)
  if (!org) {
    // A renamed business: the old name still reaches the current one.
    const renamed = await getOrgByPreviousSlug(business)
    if (renamed?.slug) {
      return { kind: 'redirect', to: `/jobs/${renamed.slug}/${cityPart}${page > 1 ? `?page=${page}` : ''}` }
    }
    return { kind: 'notFound' }
  }

  const all = await getCityJobs(org.id)
  const allJobs = all.filter((j) => citySlug(j.city, j.state) === cityPart)
  if (allJobs.length === 0) return { kind: 'notFound' }

  const pageCount = Math.max(1, Math.ceil(allJobs.length / CITY_PAGE_SIZE))
  if (page > pageCount) return { kind: 'notFound' }

  const first = allJobs[0]
  return {
    kind: 'city',
    org,
    city: (first.city || '').trim(),
    state: (first.state || '').trim(),
    citySlug: cityPart,
    page,
    pageCount,
    total: allJobs.length,
    jobs: allJobs.slice((page - 1) * CITY_PAGE_SIZE, page * CITY_PAGE_SIZE),
    allJobs,
  }
}
