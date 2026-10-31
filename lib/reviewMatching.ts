// Suggesting which job a Google review belongs to (phase 2 review engine,
// part C). Google's review record has no customer or job field, so this only
// ever SUGGESTS a job; the owner confirms every link (decision 14.11):
//   - the reviewer's name matches the homeowner's name saved on the job, by
//     first name plus last initial ("Sarah J." for Sarah Johnson), or by the
//     last name alone ("The Jones family" for Mark Jones), and
//   - the review was posted after the job's first recorded review request or
//     link visit.
// Kept free of prisma so it can be tested on its own.

const IGNORED_WORDS = new Set(['the', 'family', 'and', 'mr', 'mrs', 'ms', 'miss', 'dr', 'jr', 'sr', 'ii', 'iii', 'iv'])

/** Lowercase name words with accents, punctuation and filler words removed. */
export function nameWords(name: string | null | undefined): string[] {
  if (!name) return []
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .replace(/['-]/g, '')
    .split(/\s+/)
    .filter((w) => w && !IGNORED_WORDS.has(w))
}

export type NameMatch = 'first_and_initial' | 'last_name' | null

export function matchReviewerToHomeowner(reviewerName: string | null, homeownerName: string | null): NameMatch {
  const home = nameWords(homeownerName)
  const rev = nameWords(reviewerName)
  if (home.length < 2 || rev.length === 0) return null
  const first = home[0]
  const last = home[home.length - 1]
  if (rev.length >= 2 && rev[0] === first && rev[rev.length - 1][0] === last[0]) return 'first_and_initial'
  if (last.length >= 2 && rev.includes(last)) return 'last_name'
  return null
}

export interface MatchJob {
  id: string
  homeCustomerName: string | null
  /** Earliest recorded send, automatic email or link visit for the job. */
  firstRequestAt: Date | null
  /** True when another review is already linked to the job (one review per job). */
  hasLinkedReview: boolean
}

export interface MatchReview {
  reviewerName: string | null
  postedAt: Date | null
  dismissedCheckInIds: string[]
}

export interface Suggestion {
  checkInId: string
  match: Exclude<NameMatch, null>
  firstRequestAt: Date
}

export function suggestJobs(review: MatchReview, jobs: MatchJob[]): Suggestion[] {
  if (!review.postedAt) return []
  const out: Suggestion[] = []
  for (const job of jobs) {
    if (job.hasLinkedReview || !job.firstRequestAt) continue
    if (review.dismissedCheckInIds.includes(job.id)) continue
    if (review.postedAt <= job.firstRequestAt) continue
    const match = matchReviewerToHomeowner(review.reviewerName, job.homeCustomerName)
    if (match) out.push({ checkInId: job.id, match, firstRequestAt: job.firstRequestAt })
  }
  return out
}
