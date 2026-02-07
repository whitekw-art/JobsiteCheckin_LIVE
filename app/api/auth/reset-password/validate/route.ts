import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ valid: false })
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { user: { select: { email: true } } },
    })

    if (!resetToken?.user?.email) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true, email: resetToken.user.email })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
