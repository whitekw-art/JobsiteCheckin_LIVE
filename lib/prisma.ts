import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function buildPrismaClient() {
  const url = process.env.DATABASE_URL ?? ''
  // Port 6543 = Supabase transaction pooler (PgBouncer). Named prepared statements
  // don't survive across pooled connections — append pgbouncer=true so Prisma
  // uses the simple query protocol instead.
  const needsFlag = url.includes(':6543') && !url.includes('pgbouncer=true')
  const resolvedUrl = needsFlag
    ? url + (url.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true')
    : url
  return new PrismaClient({ datasources: { db: { url: resolvedUrl || undefined } } })
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma