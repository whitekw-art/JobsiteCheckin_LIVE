import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncCheckIn, rerenderMappingForLocation } from '@/lib/wordpressSync'
import { jobHeading, streetName, houseNumber } from '@/lib/jobUrls'

// Public text derived from a job's own fields. Built in one place so check-in,
// every edit path and every public surface (job page, WordPress post, widget,
// Google post) agree, and so an edit can never leave a stale title behind.

function clean(value: string | null | undefined): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function article(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

/**
 * seoTitle and seoDescription for a job. Returns nulls when the job lacks the
 * fields needed, matching the long-standing check-in behavior.
 */
export function buildJobSeoFields(job: {
  doorType: string | null | undefined
  street: string | null | undefined
  city: string | null | undefined
  state: string | null | undefined
}): { seoTitle: string | null; seoDescription: string | null } {
  const product = clean(job.doorType)
  // Street NAME only: the house number is never published. This sentence is
  // the public fallback description (meta and share descriptions, schema, and
  // the visible text on WordPress, the widget, the custom subdomain and Google
  // posts when the job has no notes).
  const street = streetName(job.street).replace(/[.,\s]+$/, '')
  const city = clean(job.city)
  const state = clean(job.state)

  // The standard job heading, with the street name and without the business
  // name (WordPress and the job page add the business to the tab title).
  const seoTitle = product && city && state ? jobHeading({ doorType: product, street: job.street, city, state }) : null
  const seoDescription =
    product && street && city && state
      ? `Installed ${article(product)} ${product} at ${street}, ${city}, ${state}.`
      : null
  return { seoTitle, seoDescription }
}

/**
 * Words from the homeowner's stored name that must never appear in public job
 * text. Short words and common words are ignored so "the" or "and" never trip
 * the check. Only the stored name can be checked reliably; other names typed
 * into notes cannot be detected with certainty.
 */
const NAME_STOPWORDS = new Set(['the', 'and', 'family', 'mr', 'mrs', 'ms', 'dr', 'jr', 'sr', 'household', 'home', 'house'])

export function homeownerNameTokens(name: string | null | undefined): string[] {
  return clean(name)
    .split(/[\s,&/]+/)
    .map((t) => t.replace(/[^A-Za-z'-]/g, ''))
    .filter((t) => t.length >= 3 && !NAME_STOPWORDS.has(t.toLowerCase()))
}

/**
 * Surnames and first names that are also ordinary words in a job description:
 * materials, colors, finishes, parts of a door and common place words. A
 * homeowner named "Grant Wood" must not block a description that says "wood
 * doors".
 */
const COMMON_WORDS = new Set([
  'wood', 'wooden', 'oak', 'pine', 'cedar', 'maple', 'cherry', 'walnut', 'birch', 'ash', 'elm', 'mahogany', 'teak', 'bamboo',
  'steel', 'iron', 'copper', 'brass', 'bronze', 'silver', 'gold', 'glass', 'stone', 'brick', 'slate', 'stucco', 'vinyl', 'metal',
  'black', 'white', 'brown', 'gray', 'grey', 'green', 'blue', 'red', 'tan', 'cream', 'beige', 'ivory', 'rose', 'gray',
  'hill', 'hills', 'park', 'lake', 'field', 'fields', 'brook', 'brooks', 'ford', 'bridge', 'wells', 'woods', 'forest', 'rivers',
  'long', 'short', 'little', 'young', 'strong', 'sharp', 'swift', 'bell', 'cook', 'baker', 'carter', 'miller', 'mason', 'porter',
  'hunter', 'fisher', 'barber', 'turner', 'parker', 'page', 'price', 'ward', 'west', 'north', 'south', 'east', 'king', 'bishop',
  'door', 'doors', 'barn', 'gate', 'frame', 'track', 'panel', 'hall', 'house', 'home', 'garden', 'grant', 'hope', 'joy', 'faith',
])

/**
 * The first homeowner-name word found in the text, or null. Case-insensitive,
 * whole words only.
 *
 * `lenient` is for text that should never contain a name at all (photo
 * descriptions), where a wrong block is worse than a missed one: a name word
 * that is also an ordinary word (wood, white, hill) counts only when the
 * homeowner's first and last name appear together. Free text where a name is
 * plausible (job notes) uses the strict default.
 */
export function findHomeownerName(
  text: string | null | undefined,
  name: string | null | undefined,
  opts: { lenient?: boolean } = {}
): string | null {
  const body = text || ''
  if (!body) return null
  const tokens = homeownerNameTokens(name)
  const wholeWord = (token: string) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i').test(body)
  }
  for (const token of tokens) {
    if (!wholeWord(token)) continue
    if (!opts.lenient || !COMMON_WORDS.has(token.toLowerCase())) return token
  }
  if (opts.lenient && tokens.length >= 2) {
    const first = tokens[0]
    const last = tokens[tokens.length - 1]
    const escapedFirst = first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const escapedLast = last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|[^A-Za-z])${escapedFirst}\\s+${escapedLast}([^A-Za-z]|$)`, 'i').test(body)) return `${first} ${last}`
  }
  return null
}

export const HOMEOWNER_NAME_ERROR =
  "Remove the homeowner's name from the job description before it goes public. Customer names stay in the dashboard only."

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * True when the text contains this job's house number written with its street,
 * for example "101 Platform" for the job at "101 Platform Wy N". Requiring the
 * first word of the street name after the number avoids blocking measurements
 * such as "101 inches". Case-insensitive; also matches "101, Platform".
 */
export function findHouseNumber(text: string | null | undefined, street: string | null | undefined): boolean {
  const body = clean(text)
  const number = houseNumber(street)
  const firstWord = streetName(street).split(' ')[0]
  if (!body || !number || !firstWord) return false
  const re = new RegExp(`(^|[^\\w])${escapeRegExp(number)}[\\s,.-]+${escapeRegExp(firstWord)}(?![\\w])`, 'i')
  return re.test(body)
}

export const HOUSE_NUMBER_ERROR =
  "Remove the house number from the job description before it goes public. The street name can stay; the house number stays in the dashboard only."

/**
 * After any edit to a job's details: regenerate its public title and
 * description, then, for a published job, resync the WordPress post in the
 * background and rebuild the mapped page the job used to belong to when its
 * city, state or service changed. Must be called from a route handler, because
 * it schedules work with after().
 */
export async function refreshJobAfterEdit(
  checkInId: string,
  previous: { city: string | null; state: string | null; doorType: string | null }
): Promise<void> {
  const job = await prisma.checkIn.findUnique({
    where: { id: checkInId },
    select: {
      id: true,
      organizationId: true,
      isPublic: true,
      doorType: true,
      street: true,
      city: true,
      state: true,
      seoTitle: true,
      seoDescription: true,
    },
  })
  if (!job) return

  const next = buildJobSeoFields(job)
  if (next.seoTitle !== job.seoTitle || next.seoDescription !== job.seoDescription) {
    await prisma.checkIn.update({ where: { id: job.id }, data: next })
  }

  if (!job.isPublic || !job.organizationId) return
  const orgId = job.organizationId
  const moved =
    job.city !== previous.city || job.state !== previous.state || job.doorType !== previous.doorType

  after(async () => {
    try {
      await syncCheckIn(job.id)
      if (moved) await rerenderMappingForLocation(orgId, previous)
    } catch (err) {
      console.error('WordPress resync failed after job edit:', err)
    }
  })
}
