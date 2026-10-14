import { jobHeading } from '@/lib/jobUrls'

// Alt text for a job's photos (phase 3, part E). Two layers:
//  1. The owner-approved description saved with the job (CheckIn.photoAltText,
//     written by the AI job description run and editable by the owner), used
//     when the photo has one.
//  2. A plain fallback built from the job's own details: "Exterior Barn Doors
//     on Broadway in Nashville, TN, before installation" / ", after
//     installation" / ", photo 3 of 5".
// Before and after photos always say which they are.

export const ALT_MAX_WORDS = 25
export const ALT_MAX_CHARS = 140
/** Photos described per AI run, and the most words saved per run (Keith, 2026-10-14). */
export const ALT_MAX_PHOTOS = 5
export const ALT_RUN_MAX_WORDS = 200

export interface AltJob {
  doorType?: string | null
  street?: string | null
  city?: string | null
  state?: string | null
  beforePhotoUrl?: string | null
  afterPhotoUrl?: string | null
  photoAltText?: unknown
}

/** The saved descriptions as a clean { photo address: text } map. */
export function parseAltMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, string> = {}
  for (const [url, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === 'string' && text.trim()) out[url] = text.trim()
  }
  return out
}

/** A description with markup and line breaks removed. Never shortened: a cut-off description reads as nonsense. */
export function cleanAltText(text: string): string {
  return text.replace(/<[^>]*>/g, ' ').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function altWordCount(text: string): number {
  const t = cleanAltText(text)
  return t ? t.split(' ').length : 0
}

/** True when a cleaned description fits the per-photo limits (25 words, 140 characters). */
export function altWithinLimits(text: string): boolean {
  const t = cleanAltText(text)
  return t.length > 0 && altWordCount(t) <= ALT_MAX_WORDS && t.length <= ALT_MAX_CHARS
}

/**
 * Alt text for the photo at `url`. `index` is its position (0-based) in the
 * list being shown and `total` the length of that list, used only by the plain
 * fallback.
 */
export function photoAlt(job: AltJob, url: string, index: number, total: number): string {
  const saved = parseAltMap(job.photoAltText)[url]
  const role = url === job.beforePhotoUrl ? 'before' : url === job.afterPhotoUrl ? 'after' : null
  if (saved) return role ? `${saved}, ${role}` : saved
  const base = jobHeading(job)
  if (role) return `${base}, ${role} installation`
  return total > 1 ? `${base}, photo ${index + 1} of ${total}` : base
}
