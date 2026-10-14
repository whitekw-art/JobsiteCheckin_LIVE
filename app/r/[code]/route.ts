import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAutomatedVisit, recordReviewEvent } from '@/lib/reviewTracking'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The review request tracking link, /r/{code}. Records the visit time and
// forwards straight to the business's saved Google review link. It reads the
// link at click time, so a link the owner changes later still works in
// messages already sent. Visits by link-preview and email-scanning programs
// are forwarded but not recorded.
function noStoreRedirect(url: string): NextResponse {
  const res = NextResponse.redirect(url, 302)
  res.headers.set('Cache-Control', 'no-store')
  res.headers.set('X-Robots-Tag', 'noindex')
  return res
}

async function handle(request: NextRequest, code: string): Promise<NextResponse> {
  const home = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://projectcheckin.com').replace(/\/$/, '')
  if (!/^[a-z0-9]{6,20}$/.test(code)) return noStoreRedirect(home)

  const checkIn = await prisma.checkIn.findUnique({
    where: { reviewLinkCode: code },
    select: {
      id: true,
      organizationId: true,
      organization: { select: { gbpReviewLink: true, slug: true } },
    },
  }).catch(() => null)
  if (!checkIn?.organizationId || !checkIn.organization) return noStoreRedirect(home)

  const link = checkIn.organization.gbpReviewLink?.trim() || ''
  const target = /^https?:\/\//i.test(link)
    ? link
    : checkIn.organization.slug
      ? `${home}/portfolio/${checkIn.organization.slug}`
      : home

  if (!isAutomatedVisit(request.headers.get('user-agent'), request.method)) {
    const organizationId = checkIn.organizationId
    after(async () => {
      await recordReviewEvent({ organizationId, checkInId: checkIn.id, kind: 'link_open' }).catch((err) =>
        console.error('Could not record review link visit:', err)
      )
    })
  }
  return noStoreRedirect(target)
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return handle(request, (await params).code)
}

export async function HEAD(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  return handle(request, (await params).code)
}
