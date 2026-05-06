// Bump CURRENT_PLAN_VERSION when feature sets change.
// Existing customers retain the version they subscribed under — never edit old version rows.
// Add new version entries only. Document changes with date comments below.
//
// Version history:
// v1 — 2026-03-12: Initial feature set

export const CURRENT_PLAN_VERSION = 1

export const PLAN_FEATURES: Record<string, Record<number, string[]>> = {
  free: {
    1: ['check_in', 'photos_5_per_job', 'job_pages_5'],
  },
  pro: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard', 'gbp_post'],
  },
  elite: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard', 'geo_grid', 'gbp_post', 'before_after_tagging'],
  },
  titan: {
    1: ['check_in', 'photos_unlimited', 'job_pages_unlimited', 'dashboard', 'geo_grid', 'api_access', 'white_label', 'gbp_post', 'before_after_tagging', 'review_request'],
  },
}

const MONTHLY_PHOTO_CAPS: Record<string, number> = {
  free: 50,
  pro: 500,
  elite: 2000,
  titan: Infinity,
}

export function getMonthlyPhotoCap(planTier: string | null | undefined): number {
  const tier = (planTier ?? 'free').toLowerCase()
  return MONTHLY_PHOTO_CAPS[tier] ?? 50
}

/**
 * Tier-only check — use in client components where planVersion isn't in session.
 * Always uses CURRENT_PLAN_VERSION. Orgs with no planTier are treated as free.
 */
export function tierHasFeature(
  planTier: string | null | undefined,
  feature: string
): boolean {
  const tier = (planTier ?? 'free').toLowerCase()
  return PLAN_FEATURES[tier]?.[CURRENT_PLAN_VERSION]?.includes(feature) ?? false
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
