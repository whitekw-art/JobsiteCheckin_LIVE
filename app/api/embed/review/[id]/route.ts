import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publicReviewForJob } from '@/lib/googleReviews'

export const runtime = 'nodejs'

// Read-only review text for a published job, loaded by public/review.v1.js on
// the customer's WordPress post so the text itself is never stored on their
// site. Answers only for a job that is published and has a review the owner
// linked, inside Google's 30-day limit. Sits under /api/embed/ so the existing
// Vercel Firewall rate-limit rule covers it, and is cached at the CDN like the
// widget data address.
const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, max-age=60',
  'Vercel-CDN-Cache-Control': 'max-age=240',
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS })
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id) || request.nextUrl.search) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400, headers: HEADERS })
  }
  const job = await prisma.checkIn.findUnique({ where: { id }, select: { isPublic: true } }).catch(() => null)
  const review = job?.isPublic ? await publicReviewForJob(id) : null
  if (!review) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: HEADERS })
  return NextResponse.json(
    { reviewerName: review.reviewerName, comment: review.comment, replyComment: review.replyComment },
    { headers: HEADERS }
  )
}
