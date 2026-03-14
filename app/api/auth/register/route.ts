export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, phone } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account already exists with that email. Please sign in instead.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // Placeholder org name — real business name captured during onboarding modal
    const displayName = `${firstName.trim()} ${lastName.trim()}`
    const orgName = `${displayName}'s Business`
    let baseSlug = slugify(orgName)
    let slug = baseSlug
    let suffix = 2
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`
      suffix++
    }

    const organization = await prisma.organization.create({
      data: {
        name: orgName,
        slug,
        // onboardingComplete defaults to false per schema
      },
    })

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: displayName,
        password: hashedPassword,
        role: 'OWNER',
        organizationId: organization.id,
      },
    })

    console.info('New registration', { userId: user.id, email: normalizedEmail })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again.' },
      { status: 500 }
    )
  }
}
