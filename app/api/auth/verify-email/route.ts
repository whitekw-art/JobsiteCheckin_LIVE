export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken, emailIsTaken } from '@/lib/accountEmails'

/**
 * Completes a pending email change.
 *
 * Deliberately NOT session-gated. The link is proof of control of the target
 * inbox, and requiring a signed-in session as well would break the ordinary
 * case of opening the link on a phone that is not logged in. The token is
 * single-use, short-lived, and bound to one user, so it grants nothing beyond
 * finishing the change that account already requested.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = (await request.json()) as { token?: unknown }
    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 })
    }

    const pending = await prisma.pendingEmailChange.findFirst({
      where: { tokenHash: hashToken(token), usedAt: null },
    })

    if (!pending) {
      return NextResponse.json({ error: 'This link is not valid or has already been used.' }, { status: 400 })
    }

    if (pending.expiresAt.getTime() < Date.now()) {
      // Nothing was ever applied, so letting it lapse leaves the account exactly
      // as it was. Clearing the row keeps a dead link from lingering.
      await prisma.pendingEmailChange.delete({ where: { id: pending.id } })
      return NextResponse.json(
        { error: 'This link has expired. Your sign-in details are unchanged — please request it again.' },
        { status: 410 }
      )
    }

    // Re-checked at completion, not only at request time: another account could
    // have claimed this address during the ten minutes in between.
    if (await emailIsTaken(pending.newEmail, pending.userId)) {
      await prisma.pendingEmailChange.delete({ where: { id: pending.id } })
      return NextResponse.json({ error: 'That email address is now in use on another account.' }, { status: 409 })
    }

    if (pending.purpose === 'primary') {
      const user = await prisma.user.findUnique({
        where: { id: pending.userId },
        select: { email: true },
      })
      const previous = user?.email

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: pending.userId },
          data: { email: pending.newEmail },
        })
        // The address being replaced becomes a backup rather than being
        // discarded, so a customer who mistypes the new one still has a route
        // back in through password reset.
        if (previous && previous !== pending.newEmail) {
          const clash = await tx.userEmail.findUnique({ where: { email: previous } })
          if (!clash) {
            await tx.userEmail.create({
              data: { userId: pending.userId, email: previous, verifiedAt: new Date() },
            })
          }
        }
        await tx.pendingEmailChange.update({
          where: { id: pending.id },
          data: { usedAt: new Date() },
        })
      })

      // The session JWT carries the old address and is resolved by it on every
      // request, so it cannot survive this. The client signs out on success.
      return NextResponse.json({ success: true, purpose: 'primary', email: pending.newEmail })
    }

    await prisma.$transaction(async (tx) => {
      await tx.userEmail.create({
        data: { userId: pending.userId, email: pending.newEmail, verifiedAt: new Date() },
      })
      await tx.pendingEmailChange.update({
        where: { id: pending.id },
        data: { usedAt: new Date() },
      })
    })

    return NextResponse.json({ success: true, purpose: 'backup', email: pending.newEmail })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json({ error: 'Could not confirm that address' }, { status: 500 })
  }
}
