import { getServerSession } from 'next-auth'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const session = await getServerSession()
  if (!session?.user?.email) return null
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { organization: true }
  })
  
  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/signin')
  return user
}

export async function requireRole(allowedRoles: string[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    redirect('/check-in')
  }
  return user
}