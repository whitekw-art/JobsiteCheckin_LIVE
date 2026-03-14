import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return Response.json({ planTier: null })
  }

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { planTier: true },
  })

  return Response.json({ planTier: org?.planTier ?? null })
}
