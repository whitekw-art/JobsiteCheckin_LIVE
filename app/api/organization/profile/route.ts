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
        phone: true,
        website: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ organization })
  } catch (error: any) {
    console.error('Error loading organization profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load organization profile' },
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

    const { phone, website } = (await request.json()) as {
      phone?: string
      website?: string
    }

    const updated = await prisma.organization.update({
      where: { id: currentUser.organizationId },
      data: {
        phone: phone ?? null,
        website: website ?? null,
      },
      select: {
        name: true,
        phone: true,
        website: true,
      },
    })

    return NextResponse.json({ organization: updated })
  } catch (error: any) {
    console.error('Error updating organization profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update organization profile' },
      { status: 500 }
    )
  }
}

