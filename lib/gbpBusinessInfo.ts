import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getStorefrontAddress, type GbpStorefrontAddress } from '@/lib/gbpApi'

// The business's storefront address, copied from its Google Business Profile
// so the address ProjectCheckin publishes always matches Google exactly.
//
// Google's Business Profile API policy allows content from the API to be kept
// "for no more than 30 calendar days". Every stored address is therefore
// refreshed at least every REFRESH_AFTER_DAYS by the daily scheduled job, and
// one that could not be refreshed within MAX_AGE_DAYS is deleted.

export const REFRESH_AFTER_DAYS = 25
export const MAX_AGE_DAYS = 29

const DAY_MS = 24 * 60 * 60 * 1000

/** Refresh one organization's stored storefront address from Google. */
export async function refreshGbpBusinessInfo(orgId: string): Promise<'updated' | 'cleared' | 'skipped' | 'failed'> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { gbpRefreshToken: true, gbpAccessToken: true, gbpLocationId: true, gbpConnectionStatus: true },
  })
  if (!org?.gbpRefreshToken || !org.gbpLocationId || org.gbpConnectionStatus !== 'connected') return 'skipped'

  const result = await getStorefrontAddress(org.gbpRefreshToken, org.gbpAccessToken, org.gbpLocationId)
  if (!result.ok) return 'failed'

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      // null means the profile hides its address (service-area business):
      // publish city or service area only.
      gbpBusinessAddress: result.data ? (result.data as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
      gbpBusinessInfoFetchedAt: new Date(),
    },
  })
  return result.data ? 'updated' : 'cleared'
}

/** Delete stored addresses that could not be refreshed in time (30-day limit). */
export async function expireStaleBusinessInfo(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - MAX_AGE_DAYS * DAY_MS)
  const res = await prisma.organization.updateMany({
    where: { gbpBusinessInfoFetchedAt: { lt: cutoff } },
    data: { gbpBusinessAddress: Prisma.DbNull, gbpBusinessInfoFetchedAt: null },
  })
  return res.count
}

/** Organizations whose stored address is due for a refresh, oldest first. */
export async function orgsDueForBusinessInfoRefresh(limit: number, now: Date = new Date()): Promise<string[]> {
  const due = new Date(now.getTime() - REFRESH_AFTER_DAYS * DAY_MS)
  const rows = await prisma.organization.findMany({
    where: {
      gbpConnectionStatus: 'connected',
      gbpLocationId: { not: null },
      OR: [{ gbpBusinessInfoFetchedAt: null }, { gbpBusinessInfoFetchedAt: { lt: due } }],
    },
    select: { id: true },
    orderBy: { gbpBusinessInfoFetchedAt: { sort: 'asc', nulls: 'first' } },
    take: limit,
  })
  return rows.map((r) => r.id)
}

/** Read the stored address in a shape the page builders can use. */
export function parseStoredAddress(value: unknown): GbpStorefrontAddress | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Partial<GbpStorefrontAddress>
  if (!Array.isArray(v.addressLines) || v.addressLines.length === 0) return null
  return {
    addressLines: v.addressLines.filter((l): l is string => typeof l === 'string'),
    locality: v.locality ?? null,
    administrativeArea: v.administrativeArea ?? null,
    postalCode: v.postalCode ?? null,
    regionCode: v.regionCode ?? null,
  }
}
