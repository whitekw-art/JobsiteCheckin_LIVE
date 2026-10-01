/**
 * The permission names Google shows a customer when they connect, word for
 * word, so every place that tells them what to allow (the Connections card,
 * the onboarding step, the help guide) says exactly what Google's screen says.
 *
 * Source: Google's own "projectcheckin.com has this access" panel on a
 * connected account, captured by Keith on 2026-10-01. The connect flows request
 * one scope each (`business.manage` in lib/gbpApi.ts, `webmasters.readonly` in
 * lib/gscApi.ts). The two connections share one Google grant, so a customer who
 * connected Search Console first also sees its permission when connecting GBP.
 * Re-check these against a fresh Google account if Google changes its wording.
 */
export const GBP_PERMISSION_LABEL = 'See, edit, create and delete your Google business listings'
export const GSC_PERMISSION_LABEL = 'View Search Console data for your verified sites'
