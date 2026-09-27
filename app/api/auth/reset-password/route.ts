import { NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || typeof token !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
    }

    // Enforced HERE, not only on the page. This route was the one password
    // write path with no server-side length check, so a request posted
    // directly with a valid token could set a one-character password while
    // registration, invite acceptance and the in-app change all required 8.
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, userId: true },
    })

    if (!resetToken) {
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    })

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to reset password' }, { status: 500 })
  }
}
