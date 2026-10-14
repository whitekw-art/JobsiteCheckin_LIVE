import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'

// Review request tracking (phase 2 review engine, part A).
//
// The Google review link in a request message is replaced by a ProjectCheckin
// link, /r/{code}, one per job. Opening it records the time and forwards
// straight to the business's saved Google review link. There is no rating
// step in between: Google's policy prohibits selectively soliciting positive
// reviews, and a rating-first page is the standard way of doing that.

export type ReviewEventKind = 'text' | 'email' | 'email_auto' | 'link_open'

const CODE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'

function newCode(): string {
  const bytes = randomBytes(10)
  let out = ''
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length]
  return out
}

export function reviewTrackingUrl(code: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectcheckin.com').replace(/\/$/, '')
  return `${base}/r/${code}`
}

/** The job's tracking code, created the first time it is needed. */
export async function ensureReviewLinkCode(checkInId: string): Promise<string> {
  const existing = await prisma.checkIn.findUnique({ where: { id: checkInId }, select: { reviewLinkCode: true } })
  if (existing?.reviewLinkCode) return existing.reviewLinkCode
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode()
    // Only set when still empty, so two requests at once cannot give one job
    // two different codes (the loser re-reads the winner's code).
    const res = await prisma.checkIn.updateMany({ where: { id: checkInId, reviewLinkCode: null }, data: { reviewLinkCode: code } })
      .catch((err: { code?: string }) => {
        if (err?.code === 'P2002') return { count: -1 } // code collision, try another
        throw err
      })
    if (res.count === 1) return code
    if (res.count === 0) {
      const now = await prisma.checkIn.findUnique({ where: { id: checkInId }, select: { reviewLinkCode: true } })
      if (now?.reviewLinkCode) return now.reviewLinkCode
      throw new Error('Job not found')
    }
  }
  throw new Error('Could not create a review link code')
}

// Messages, chat apps and many email providers open links on their own to
// build a preview or scan for viruses. Those visits are not the customer, so
// they are not recorded. Some scanners look exactly like a browser and cannot
// be filtered, which is why the dashboard says "Link opened", never
// "Customer opened".
const AUTOMATED_AGENT = new RegExp(
  [
    'bot', 'crawler', 'spider', 'preview', 'facebookexternalhit', 'facebot', 'twitterbot', 'slack',
    'whatsapp', 'telegram', 'discord', 'skype', 'linkedin', 'embedly', 'quora link', 'pinterest',
    'outlook', 'microsoft office', 'ms-office', 'safelinks', 'proofpoint', 'mimecast', 'barracuda',
    'google-safety', 'googleimageproxy', 'yahoomailproxy', 'curl', 'wget', 'python', 'go-http-client',
    'java/', 'okhttp', 'axios', 'node-fetch', 'headless',
  ].join('|'),
  'i'
)

export function isAutomatedVisit(userAgent: string | null | undefined, method: string): boolean {
  if (method !== 'GET') return true
  if (!userAgent || userAgent.trim().length < 10) return true
  return AUTOMATED_AGENT.test(userAgent)
}

export async function recordReviewEvent(input: {
  organizationId: string
  checkInId: string
  kind: ReviewEventKind
  userId?: string | null
}): Promise<void> {
  await prisma.reviewRequestEvent.create({
    data: {
      organizationId: input.organizationId,
      checkInId: input.checkInId,
      kind: input.kind,
      userId: input.userId ?? null,
    },
  })
}
