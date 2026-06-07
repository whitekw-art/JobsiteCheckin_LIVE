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
    select: { organizationId: true, role: true },
  })

  if (!user?.organizationId) {
    return NextResponse.json({ error: 'No organization found' }, { status: 404 })
  }

  if (!['OWNER', 'SUPER_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.organization.update({
    where: { id: user.organizationId },
    data: { onboardingComplete: true },
  })

  return NextResponse.json({ ok: true })
}
