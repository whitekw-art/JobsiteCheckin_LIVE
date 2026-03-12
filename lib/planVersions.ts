// Bump CURRENT_PLAN_VERSION when feature sets change.
// Existing customers retain the version they subscribed under — never edit old version rows.
// Add new version entries only. Document changes with date comments below.
//
// Version history:
// v1 — 2026-03-12: Initial feature set

export const CURRENT_PLAN_VERSION = 1

export const PLAN_FEATURES: Record<string, Record<number, string[]>> = {
  free: {
    1: ['check_in', 'photos_3_per_job', 'job_pages_5'],
  },
  pro: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard'],
  },
  elite: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard', 'geo_grid'],
  },
  titan: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard', 'geo_grid', 'api_access', 'white_label'],
  },
}

/**
 * Check whether an org has access to a feature.
 * Reads planTier + planVersion together so grandfathered customers
 * keep their original feature set when tiers change post-launch.
 *
 * Orgs with no planTier (null/undefined) are treated as free tier.
 */
export function hasFeature(
  planTier: string | null | undefined,
  planVersion: number | null | undefined,
  feature: string
): boolean {
  const tier = (planTier ?? 'free').toLowerCase()
  const version = planVersion ?? 1
  return PLAN_FEATURES[tier]?.[version]?.includes(feature) ?? false
}
