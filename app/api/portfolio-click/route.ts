import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { orgSlug } = (await request.json()) as { orgSlug?: string }

    if (!orgSlug || typeof orgSlug !== 'string') {
      return NextResponse.json({ error: 'Missing orgSlug' }, { status: 400 })
    }

    const org = await prisma.organization.findUnique({
      where: { slug: orgSlug },
      select: { id: true },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    await prisma.portfolioView.create({
      data: {
        organizationId: org.id,
        source: 'gbp',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('portfolio-click error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
