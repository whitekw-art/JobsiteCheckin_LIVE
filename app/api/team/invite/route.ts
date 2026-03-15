import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = 'ProjectCheckin <no-reply@projectcheckin.com>'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!currentUser || !['OWNER', 'ADMIN'].includes(currentUser.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, role } = await request.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    if (!currentUser.organizationId) {
      return NextResponse.json({ error: 'Current user is not linked to an organization' }, { status: 400 })
    }

    const invitationId = randomUUID()
    const invitationRole = 'USER'

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "Invitations" (id, email, "organizationId", role, "createdAt")
        VALUES (${invitationId}, ${email}, ${currentUser.organizationId}, ${invitationRole}, NOW())
      `,
    )

    const baseUrl = process.env.NEXTAUTH_URL || ''
    const inviteUrl = `${baseUrl}/auth/invite?token=${invitationId}`

    // Send invitation email (fire and forget — don't fail the request if email fails)
    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: { name: true },
    })
    const orgName = org?.name ?? 'your team'

    try {
      await resend.emails.send({
        from: FROM_ADDRESS,
        to: email,
        subject: `You've been invited to join ${orgName} on ProjectCheckin`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">You're invited</h2>
            <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 24px;">
              ${currentUser.name ?? currentUser.email} has invited you to join <strong>${orgName}</strong> on ProjectCheckin — the tool that turns every completed job into a Google-ranking web page.
            </p>
            <a href="${inviteUrl}" style="display: inline-block; background: #0EA5E9; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Accept invitation
            </a>
            <p style="font-size: 13px; color: #888; margin-top: 24px;">
              If you weren't expecting this invitation, you can ignore this email.
            </p>
          </div>
        `,
      })
    } catch (emailError) {
      console.error('Team invite email failed:', emailError)
      // Don't fail the request — email is best-effort
    }

    return NextResponse.json({ success: true, inviteUrl })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
