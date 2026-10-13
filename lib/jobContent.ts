import { after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { syncCheckIn, rerenderMappingForLocation } from '@/lib/wordpressSync'

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
  const street = clean(job.street).replace(/[.,\s]+$/, '')
  const city = clean(job.city)
  const state = clean(job.state)

  const seoTitle = product && city && state ? `${product} in ${city}, ${state}` : null
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

/** The first homeowner-name word found in the text, or null. Case-insensitive, whole words only. */
export function findHomeownerName(text: string | null | undefined, name: string | null | undefined): string | null {
  const body = text || ''
  if (!body) return null
  for (const token of homeownerNameTokens(name)) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`(^|[^A-Za-z])${escaped}([^A-Za-z]|$)`, 'i').test(body)) return token
  }
  return null
}

export const HOMEOWNER_NAME_ERROR =
  "Remove the homeowner's name from the job description before it goes public. Customer names stay in the dashboard only."

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
