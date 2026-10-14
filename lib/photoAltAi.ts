import { findHomeownerName } from '@/lib/jobContent'
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
