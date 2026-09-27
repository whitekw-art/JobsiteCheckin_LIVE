export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import {
  normalizeEmail,
  emailIsTaken,
  verifyCurrentPassword,
  createPendingEmailChange,
  sendVerificationEmail,
  notifyExistingAddresses,
  addressesFor,
  MAX_BACKUP_EMAILS,
  notifyPrimaryPromoted,
} from '@/lib/accountEmails'

/**
 * Request a change of the PRIMARY (sign-in) address, or add a BACKUP one.
 *
 * Neither takes effect here. This writes a pending row and emails a link; the
 * account is untouched until ./verify completes it. That ordering is what makes
 * expiry safe — there is no half-applied state to roll back, and no window in
 * which an unconfirmed address can be used to sign in or to recover.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { email, currentPassword, purpose } = (await request.json()) as {
      email?: unknown
      currentPassword?: unknown
      purpose?: unknown
    }

    if (purpose !== 'primary' && purpose !== 'backup') {
      return NextResponse.json({ error: 'Unknown request.' }, { status: 400 })
    }

    const newEmail = normalizeEmail(email)
    if (!newEmail) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }

    // The password check is the control that matters here. Confirming the new
    // address only proves whoever asked owns THAT inbox, which is exactly what
    // an attacker on a stolen session would also be able to prove.
    if (!(await verifyCurrentPassword(currentUser.id, currentPassword))) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 403 })
    }

    if (await emailIsTaken(newEmail, undefined)) {
      return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 })
    }

    if (purpose === 'backup') {
      const count = await prisma.userEmail.count({ where: { userId: currentUser.id } })
      if (count >= MAX_BACKUP_EMAILS) {
        return NextResponse.json(
          { error: `You can have up to ${MAX_BACKUP_EMAILS} backup addresses.` },
          { status: 400 }
        )
      }
    }

    // Captured BEFORE the pending row is written, so the notice goes to the
    // addresses the account held at the time of the request.
    const existing = await addressesFor(currentUser.id)

    const token = await createPendingEmailChange(currentUser.id, newEmail, purpose)

    await sendVerificationEmail(newEmail, token, purpose)
    await notifyExistingAddresses(existing, newEmail, purpose)

    return NextResponse.json({ success: true, pendingEmail: newEmail })
  } catch (error) {
    console.error('Error requesting email change:', error)
    return NextResponse.json({ error: 'Failed to send the confirmation email' }, { status: 500 })
  }
}

/**
 * Promote an existing backup to the sign-in address.
 *
 * No confirmation link here, unlike adding a new address. A backup has already
 * proven its inbox, so a second link would ask the customer to re-prove
 * something they proved when they added it. What this needs instead is proof
 * that the person asking is the account holder, which the current password
 * gives, plus a notice to every address so a swap cannot happen quietly.
 *
 * The outgoing primary becomes a backup rather than being dropped, so this is
 * a swap and nothing is lost.
 */
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { id, currentPassword } = (await request.json()) as {
      id?: unknown
      currentPassword?: unknown
    }

    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Unknown address.' }, { status: 400 })
    }

    if (!(await verifyCurrentPassword(currentUser.id, currentPassword))) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 403 })
    }

    const backup = await prisma.userEmail.findFirst({
      where: { id, userId: currentUser.id },
      select: { id: true, email: true },
    })

    if (!backup) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    const previousPrimary = currentUser.email
    const existing = await addressesFor(currentUser.id)

    await prisma.$transaction(async (tx) => {
      // Removed first: the address cannot occupy both User.email and
      // UserEmail.email, since UserEmail.email is unique and the pair would
      // then describe the same inbox twice.
      await tx.userEmail.delete({ where: { id: backup.id } })
      await tx.user.update({
        where: { id: currentUser.id },
        data: { email: backup.email },
      })
      if (previousPrimary && previousPrimary !== backup.email) {
        const clash = await tx.userEmail.findUnique({ where: { email: previousPrimary } })
        if (!clash) {
          await tx.userEmail.create({
            data: { userId: currentUser.id, email: previousPrimary, verifiedAt: new Date() },
          })
        }
      }
    })

    await notifyPrimaryPromoted(existing, backup.email)

    return NextResponse.json({ success: true, email: backup.email })
  } catch (error) {
    console.error('Error promoting backup email:', error)
    return NextResponse.json({ error: 'Failed to update your sign-in email' }, { status: 500 })
  }
}

/** Remove a backup address. The primary can never be removed, only replaced. */
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { id, currentPassword } = (await request.json()) as {
      id?: unknown
      currentPassword?: unknown
    }

    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Unknown address.' }, { status: 400 })
    }

    if (!(await verifyCurrentPassword(currentUser.id, currentPassword))) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 403 })
    }

    // Scoped by userId so an id belonging to somebody else matches nothing.
    const result = await prisma.userEmail.deleteMany({
      where: { id, userId: currentUser.id },
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Address not found.' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing backup email:', error)
    return NextResponse.json({ error: 'Failed to remove that address' }, { status: 500 })
  }
}
