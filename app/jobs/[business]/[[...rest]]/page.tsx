import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveJobsRoute, parsePage } from '../../_components/resolve'
import { JobView, jobMetadata } from '../../_components/JobView'
import { CityView, cityMetadata } from '../../_components/CityView'

// One route for every /jobs/... address (phase 3). resolve.ts decides what the
// address is: a job page, a city page, an old or out-of-date address that
// redirects permanently, or nothing.

type Params = Promise<{ business: string; rest?: string[] }>
type SearchParams = Promise<{ page?: string | string[] }>

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: SearchParams }): Promise<Metadata> {
  const { business, rest } = await params
  const page = parsePage((await searchParams).page)
  const route = await resolveJobsRoute(business, rest, page)
  if (route.kind === 'job') return jobMetadata(route.job)
  if (route.kind === 'city') return cityMetadata(route)
  return { title: 'Job Not Found', robots: { index: false } }
}

export default async function JobsPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const { business, rest } = await params
  const page = parsePage((await searchParams).page)
  const route = await resolveJobsRoute(business, rest, page)
  if (route.kind === 'redirect') permanentRedirect(route.to)
  if (route.kind === 'job') return <JobView job={route.job} />
  if (route.kind === 'city') return <CityView route={route} />
  notFound()
}
