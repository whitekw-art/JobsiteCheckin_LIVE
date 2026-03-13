export const runtime = 'nodejs'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { organizationId: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { planTier: 'free', planVersion: 1 },
  })

  return NextResponse.json({ redirect: '/dashboard' })
}
