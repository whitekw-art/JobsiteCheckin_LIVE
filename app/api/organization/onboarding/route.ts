import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { defaultProductsForTrade, normalizeProductOptions } from '@/lib/tradeProducts'

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

    if (!['OWNER', 'SUPER_ADMIN'].includes(user.role)) {
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

    // The slug is part of every published job page and portfolio URL, so it is
    // regenerated ONLY when the business name actually changes. The Interactive
    // Tutorial replays this same flow against an established account, and
    // rebuilding the slug from a name the customer merely retyped would move
    // pages that are already linked from their own site and indexed by Google.
    const current = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { name: true, slug: true, previousSlugs: true },
    })

    let slug = current?.slug ?? ''
    const nameUnchanged = current?.name?.trim() === name.trim()

    if (!slug || !nameUnchanged) {
      const baseSlug = slugify(name.trim())
      slug = baseSlug
      let suffix = 2
      while (true) {
        const existing = await prisma.organization.findUnique({ where: { slug } })
        // An old name another business still redirects from counts as taken.
        const redirectOwner = await prisma.organization.findFirst({
          where: { previousSlugs: { has: slug }, id: { not: user.organizationId } },
          select: { id: true },
        })
        if ((!existing || existing.id === user.organizationId) && !redirectOwner) break
        slug = `${baseSlug}-${suffix}`
        suffix++
      }
    }

    // A renamed business keeps its old address working: the old slug is
    // remembered, and old job and city addresses redirect to the new one. A
    // brand-new account with no jobs has nothing published under the old name.
    let previousSlugs = (current?.previousSlugs ?? []).filter((x) => x !== slug)
    if (current?.slug && current.slug !== slug) {
      const hasJobs = (await prisma.checkIn.count({ where: { organizationId: user.organizationId } })) > 0
      if (hasJobs && !previousSlugs.includes(current.slug)) previousSlugs = [...previousSlugs, current.slug]
    }

    const normalizeWebsite = (v?: string) => {
      if (!v?.trim()) return null
      const t = v.trim()
      if (t.startsWith('http://') || t.startsWith('https://')) return t
      if (t.startsWith('www.')) return `https://${t}`
      return `https://www.${t}`
    }

    // Seed the check-in product list from the chosen trade, but never clobber a list
    // the customer has already edited (they can re-seed from Account → General).
    const cleanTrade = trade?.trim() || null
    const existingOptions = normalizeProductOptions(
      (await prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: { productOptions: true },
      }))?.productOptions
    )
    const seededOptions =
      existingOptions.length === 0 ? defaultProductsForTrade(cleanTrade) : existingOptions

    const updated = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name:              name.trim(),
        slug,
        previousSlugs,
        phone:             phone?.trim() || null,
        website:           normalizeWebsite(website),
        trade:             cleanTrade,
        productOptions:    seededOptions,
        howHeardAbout:     howHeardAbout?.trim() || null,
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
