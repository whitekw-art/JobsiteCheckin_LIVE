import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

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
        gbpReviewLink: true,
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

    const { name, phone, website, email, gbpReviewLink, services, products, serviceArea, businessDescription } = (await request.json()) as {
      name?: string
      phone?: string
      website?: string
      email?: string
      gbpReviewLink?: string
      services?: string
      products?: string
      serviceArea?: string
      businessDescription?: string
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
        ...(name !== undefined && name.trim() && { name: name.trim() }),
        phone: phone ?? null,
        website: website ?? null,
        ...(email !== undefined && { email: email.trim() || null }),
        ...(gbpReviewLink !== undefined && { gbpReviewLink: gbpReviewLink || null }),
        ...businessContextUpdate,
      },
      select: {
        name: true,
        slug: true,
        phone: true,
        website: true,
        email: true,
        gbpReviewLink: true,
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
