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

    if (currentUser.role !== 'OWNER') {
      return NextResponse.json(
        { error: 'Only owners can update organization profile' },
        { status: 403 }
      )
    }

    const { name, phone, website, email, gbpReviewLink } = (await request.json()) as {
      name?: string
      phone?: string
      website?: string
      email?: string
      gbpReviewLink?: string
    }

    const updated = await prisma.organization.update({
      where: { id: currentUser.organizationId },
      data: {
        ...(name !== undefined && name.trim() && { name: name.trim() }),
        phone: phone ?? null,
        website: website ?? null,
        ...(email !== undefined && { email: email.trim() || null }),
        ...(gbpReviewLink !== undefined && { gbpReviewLink: gbpReviewLink || null }),
      },
      select: {
        name: true,
        slug: true,
        phone: true,
        website: true,
        email: true,
        gbpReviewLink: true,
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
