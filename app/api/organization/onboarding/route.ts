import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function PATCH(request: NextRequest) {
  try {
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

    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only owners can complete onboarding' }, { status: 403 })
    }

    const { name, phone, website, trade, howHeardAbout } = (await request.json()) as {
      name?: string
      phone?: string
      website?: string
      trade?: string
      howHeardAbout?: string
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
    }

    // Generate a unique slug from the real business name
    let baseSlug = slugify(name.trim())
    let slug = baseSlug
    let suffix = 2
    while (true) {
      const existing = await prisma.organization.findUnique({ where: { slug } })
      if (!existing || existing.id === user.organizationId) break
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const normalizeWebsite = (v?: string) => {
      if (!v?.trim()) return null
      const t = v.trim()
      if (t.startsWith('http://') || t.startsWith('https://')) return t
      if (t.startsWith('www.')) return `https://${t}`
      return `https://www.${t}`
    }

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name:              name.trim(),
        slug,
        phone:             phone?.trim() || null,
        website:           normalizeWebsite(website),
        trade:             trade?.trim() || null,
        howHeardAbout:     howHeardAbout?.trim() || null,
        onboardingComplete: true,
      },
      select: {
        name: true,
        slug: true,
        phone: true,
        website: true,
        trade: true,
        onboardingComplete: true,
      },
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Onboarding update error:', error)
    return NextResponse.json({ error: 'Failed to save business details.' }, { status: 500 })
  }
}
