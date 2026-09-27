export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { verifyCurrentPassword, addressesFor, sendPasswordChangedNotice } from '@/lib/accountEmails'

/**
 * Change password from inside the app.
 *
 * Distinct from the forgot-password flow, which proves identity by email
 * because the caller cannot sign in. Here the caller already has a session, so
 * the current password is what proves it is really them rather than someone
 * using a borrowed or stolen session.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const { currentPassword, newPassword } = (await request.json()) as {
      currentPassword?: unknown
      newPassword?: unknown
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 })
    }

    if (!(await verifyCurrentPassword(currentUser.id, currentPassword))) {
      return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 403 })
    }

    if (typeof currentPassword === 'string' && currentPassword === newPassword) {
      return NextResponse.json({ error: 'Choose a password different from your current one.' }, { status: 400 })
    }

    // Cost 12, matching registration and the reset flow.
    const hashed = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { password: hashed },
    })

    // Any reset link already in flight would otherwise still be usable against
    // the account after a deliberate password change.
    await prisma.passwordResetToken.deleteMany({ where: { userId: currentUser.id, usedAt: null } })

    const addresses = await addressesFor(currentUser.id)
    await sendPasswordChangedNotice(addresses)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error changing password:', error)
    return NextResponse.json({ error: 'Failed to change your password' }, { status: 500 })
  }
}
