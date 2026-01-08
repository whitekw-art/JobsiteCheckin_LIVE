import { getServerSession } from 'next-auth/next'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function getCurrentUser() {
  const session = await getServerSession()
  
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })

  return user
}

export async function requireRole(allowedRoles: Role[]) {
  const user = await getCurrentUser()
  
  if (!user || !allowedRoles.includes(user.role)) {
    throw new Error('Unauthorized')
  }

  return user
}

export async function getOrganizationIdForUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  return user?.organizationId
}