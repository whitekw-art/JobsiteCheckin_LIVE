import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { normalizeProductOptions } from '@/lib/tradeProducts'

// Reject text with no digits at all (e.g. a name typed into a phone field) — permissive
// otherwise, since phone format varies (extensions, international, partial numbers).
function cleanPhone(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t && /\d/.test(t) ? t : null
}

// Same prefixing rule already used at registration/onboarding (app/auth/register/page.tsx) —
// keeps this save path consistent so users never have to type https:// themselves.
function normalizeWebsite(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t) return null
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('www.')) return `https://${t}`
  return `https://www.${t}`
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json(
        { error: 'No organization linked to current user' },
        { status: 404 }
      )
    }

    const organization = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: {
        name: true,
        slug: true,
        phone: true,
        website: true,
        email: true,
        trade: true,
        productOptions: true,
        gbpReviewLink: true,
        portfolioPageUrl: true,
        portfolioIntro: true,
        businessContext: true,
        businessContextUpdatedAt: true,
        websiteScanHistory: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error) {
    console.error('Error loading organization profile:', error)
    return NextResponse.json(
      { error: 'Failed to load organization profile' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json(
        { error: 'No organization linked to current user' },
        { status: 404 }
      )
    }

    if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Only owners can update organization profile' },
        { status: 403 }
      )
    }

    const { name, phone, website, email, trade, productOptions, gbpReviewLink, portfolioPageUrl, portfolioIntro, services, products, serviceArea, businessDescription } = (await request.json()) as {
      name?: string
      phone?: string
      website?: string
      email?: string
      trade?: string | null
      productOptions?: unknown
      gbpReviewLink?: string
      portfolioPageUrl?: string | null
      portfolioIntro?: string | null
      services?: string
      products?: string
      serviceArea?: string
      businessDescription?: string
    }

    // Validate portfolio page URL before saving — it becomes the link target
    // in GBP posts and the widget's estimate button
    if (portfolioPageUrl !== undefined && portfolioPageUrl !== null && portfolioPageUrl.trim()) {
      let validUrl = false
      try {
        const parsed = new URL(portfolioPageUrl.trim())
        validUrl = parsed.protocol === 'http:' || parsed.protocol === 'https:'
      } catch {
        validUrl = false
      }
      if (!validUrl) {
        return NextResponse.json(
          { error: 'Portfolio page URL must be a valid URL starting with http:// or https://' },
          { status: 400 }
        )
      }
    }

    // If any AI business context fields are present, serialize them into businessContext
    const hasAiFields = services !== undefined || products !== undefined || serviceArea !== undefined || businessDescription !== undefined
    let businessContextUpdate: Record<string, unknown> = {}
    if (hasAiFields) {
      // Fetch current businessContext to merge with updates
      const current = await prisma.organization.findUnique({
        where: { id: currentUser.organizationId },
        select: { businessContext: true },
      })
      let existing: Record<string, string> = {}
      if (current?.businessContext) {
        try { existing = JSON.parse(current.businessContext) } catch { /* ignore */ }
      }
      const merged = {
        services:             services             ?? existing.services             ?? '',
        products:             products             ?? existing.products             ?? '',
        serviceArea:          serviceArea          ?? existing.serviceArea          ?? '',
        businessDescription:  businessDescription  ?? existing.businessDescription  ?? '',
      }
      businessContextUpdate = {
        businessContext:          JSON.stringify(merged),
        businessContextUpdatedAt: new Date(),
      }
    }

    const updated = await prisma.organization.update({
      where: { id: currentUser.organizationId },
      data: {
        ...(name !== undefined && name?.trim() && { name: name.trim() }),
        phone: cleanPhone(phone),
        ...(website !== undefined && { website: normalizeWebsite(website) }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(trade !== undefined && { trade: trade?.trim() || null }),
        // Normalized server-side so a malformed client payload can never poison the
        // check-in dropdown (non-strings, blanks, dupes, a stored "Other", overlong lists).
        ...(productOptions !== undefined && { productOptions: normalizeProductOptions(productOptions) }),
        ...(gbpReviewLink !== undefined && { gbpReviewLink: gbpReviewLink || null }),
        ...(portfolioPageUrl !== undefined && { portfolioPageUrl: portfolioPageUrl?.trim() || null }),
        ...(portfolioIntro !== undefined && { portfolioIntro: portfolioIntro?.trim() || null }),
        ...businessContextUpdate,
      },
      select: {
        name: true,
        slug: true,
        phone: true,
        website: true,
        email: true,
        trade: true,
        productOptions: true,
        gbpReviewLink: true,
        portfolioPageUrl: true,
        portfolioIntro: true,
        businessContext: true,
      },
    })

    return NextResponse.json({ organization: updated })
  } catch (error) {
    console.error('Error updating organization profile:', error)
    return NextResponse.json(
      { error: 'Failed to update organization profile' },
      { status: 500 }
    )
  }
}
