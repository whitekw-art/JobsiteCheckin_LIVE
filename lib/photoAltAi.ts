import { findHomeownerName } from '@/lib/jobContent'
import { streetName } from '@/lib/jobUrls'
import { ALT_RUN_MAX_WORDS, altWithinLimits, altWordCount, cleanAltText } from '@/lib/photoAlt'

// Reading and vetting the AI's photo descriptions (phase 3, part E). Kept out of
// the route file because a Next.js route may only export request handlers.

/**
 * Parse the model's JSON reply. When the reply was cut off or is malformed,
 * still recover the job description so the customer gets it; the photos then
 * keep the plain alt text.
 */
export function parseReply(raw: string): { description: string; photos: Array<{ index: number; alt: string }> } | null {
  try {
    const j = JSON.parse(raw) as { description?: unknown; photos?: unknown }
    const description = typeof j.description === 'string' ? j.description.trim() : ''
    const photos = Array.isArray(j.photos)
      ? j.photos.flatMap((p) => {
          const o = p as { index?: unknown; alt?: unknown }
          return typeof o?.index === 'number' && typeof o?.alt === 'string' ? [{ index: o.index, alt: o.alt }] : []
        })
      : []
    if (description) return { description, photos }
  } catch {
    // fall through to the recovery below
  }
  const m = raw.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/)
  if (m) {
    try {
      const description = (JSON.parse(`"${m[1]}"`) as string).trim()
      if (description) return { description, photos: [] }
    } catch {
      // not recoverable
    }
  }
  return null
}

/**
 * Photo descriptions that may be saved: matched to a photo that was actually
 * sent, cleaned to the per-photo limits, never naming the homeowner or holding a
 * house number or plate-like number, and held to the per-run word cap. A
 * description over the per-photo limit is dropped (that photo keeps the plain
 * description), never cut short, because a cut-off description reads as nonsense.
 */
export function acceptPhotoAlts(
  sent: string[],
  photos: Array<{ index: number; alt: string }>,
  homeownerName: string | null | undefined
): Record<string, string> {
  const out: Record<string, string> = {}
  let words = 0
  const ordered = [...photos].sort((a, b) => a.index - b.index)
  for (const p of ordered) {
    const url = sent[p.index - 1]
    if (!url || out[url]) continue
    const alt = cleanAltText(p.alt)
    if (!alt || !altWithinLimits(alt)) continue
    if (/\d{3,}/.test(alt)) continue
    if (findHomeownerName(alt, homeownerName, { lenient: true })) continue
    const n = altWordCount(alt)
    if (words + n > ALT_RUN_MAX_WORDS) break
    words += n
    out[url] = alt
  }
  return out
}

// The description's first sentence names the product, street, city and state
// (master plan 3.5), built from the job's own fields and appended in code so an
// edit to the admin-panel prompt cannot remove it. The street is the street
// NAME only: the house number never appears in public text.
export function firstSentenceRule(job: { doorType: string | null; street: string | null; city: string | null; state: string | null }): string {
  const product = (job.doorType || '').trim()
  const street = streetName(job.street)
  const city = (job.city || '').trim()
  const state = (job.state || '').trim()
  const parts = [product, street && `on ${street}`, city && `in ${[city, state].filter(Boolean).join(', ')}`].filter(Boolean)
  if (!product && !street && !city) return ''
  return `The first sentence of the description must name ${[
    product && 'the service type',
    street && 'the street name',
    city && 'the city',
    state && 'the state',
  ]
    .filter(Boolean)
    .join(', ')}, for example: "${parts.join(' ')}." Use these exact values: ${[product && `service type "${product}"`, street && `street "${street}"`, city && `city "${city}"`, state && `state "${state}"`].filter(Boolean).join(', ')}. Never include the house number.`
}
