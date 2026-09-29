export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

/**
 * Sign-In & Security card (Account → General).
 *
 * Open to EVERY role, unlike the rest of that tab. Business Profile is the
 * owner's to manage, but sign-in credentials belong to whoever signs in, so a
 * crew member has to be able to change their own password.
 */

// GET — what the card displays. Never returns the password hash; there is
// nothing to show, since bcrypt is one-way and the plaintext was never stored.
export async function GET() {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }

    const backups = await prisma.userEmail.findMany({
      where: { userId: currentUser.id },
      select: { id: true, email: true, verifiedAt: true },
      orderBy: { createdAt: 'asc' },
    })

    // Surfaced so the card can show "waiting on confirmation" rather than
    // appearing to have silently dropped the request.
    const pending = await prisma.pendingEmailChange.findMany({
      where: { userId: currentUser.id, usedAt: null, expiresAt: { gt: new Date() } },
      select: { newEmail: true, purpose: true, expiresAt: true },
    })

    return NextResponse.json({
      name: currentUser.name,
      email: currentUser.email,
      backupEmails: backups,
      pending,
    })
  } catch (error) {
    console.error('Error loading security settings:', error)
    return NextResponse.json({ error: 'Failed to load sign-in details' }, { status: 500 })
  }
}
