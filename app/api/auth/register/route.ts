export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

export async function POST(request: NextRequest) {
  try {
    const {
      registrationType,
      firstName,
      lastName,
      industry,
      title,
      phone,
      website,
      email,
      heardAboutUs,
      username,
      password,
      companyName,
      street,
      city,
      state,
      zip,
      fax,
    } = await request.json()

    if (!firstName || !lastName || !phone || !email || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required personal details. Please fill out all required fields.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    if (registrationType === 'business') {
      if (!companyName || !street || !city || !state || !zip) {
        return NextResponse.json(
          { error: 'Business registrations must include company name and full address.' },
          { status: 400 }
        )
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account already exists with that email. Please sign in instead.' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    let organization = null

    if (registrationType === 'business') {
      let baseSlug = slugify(companyName)
      let slug = baseSlug
      let suffix = 2
      while (await prisma.organization.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix}`
        suffix++
      }

      organization = await prisma.organization.create({
        data: {
          name: companyName,
          slug,
          phone,
          website,
        },
      })
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`.trim(),
        password: hashedPassword,
        role: 'OWNER',
        organizationId: organization?.id ?? null,
      },
    })

    console.info('Received registration', {
      userId: user.id,
      registrationType,
      firstName,
      lastName,
      industry,
      title,
      phone,
      email,
      heardAboutUs,
      username,
      passwordLength: password.length,
      companyName,
      street,
      city,
      state,
      zip,
      fax,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again.' },
      { status: 500 }
    )
  }
}
