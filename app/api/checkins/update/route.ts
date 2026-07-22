import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { syncCheckIn } from '@/lib/wordpressSync'

function cleanPhone(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t && /\d/.test(t) ? t : null
}

// Photo URLs arrive from the client, so they must be pinned to our own storage
// before being saved. Without this, an arbitrary URL ends up rendered as an
// <img src> on public job pages and fetched server-side by the WordPress
// publisher — the root cause behind VULN-2026-001.
function isOwnStorageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const u = new URL(value.trim())
    if (u.protocol !== 'https:') return false
    return u.hostname === 'supabase.co' || u.hostname.endsWith('.supabase.co')
  } catch {
    return false
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser || !currentUser.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      installer,
      street,
      city,
      state,
      zip,
      doorType,
      notes,
      appendPhotoUrls,
      beforePhotoUrl,
      afterPhotoUrl,
      homeCustomerName,
      homeCustomerPhone,
      homeCustomerEmail,
      aiDescriptionGeneratedAt,
    } = body as {
      id: string
      installer?: string
      street?: string
      city?: string
      state?: string
      zip?: string
      doorType?: string
      notes?: string
      appendPhotoUrls?: string[]
      beforePhotoUrl?: string | null
      afterPhotoUrl?: string | null
      homeCustomerName?: string | null
      homeCustomerPhone?: string | null
      homeCustomerEmail?: string | null
      aiDescriptionGeneratedAt?: string | null
    }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    // USER role can only edit their own check-ins
    const where: Record<string, unknown> = {
      id,
      organizationId: currentUser.organizationId,
    }
    if (currentUser.role === 'USER') {
      where.userId = currentUser.id
    }

    const checkIn = await prisma.checkIn.findFirst({
      where,
      select: { id: true, photoUrls: true },
    })
    if (!checkIn) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Append new photo URLs to existing
    const existing = checkIn.photoUrls
      ? checkIn.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []
    const incoming = (appendPhotoUrls ?? []).filter(isOwnStorageUrl)
    if ((appendPhotoUrls?.length ?? 0) !== incoming.length) {
      return NextResponse.json(
        { error: 'Photos must be uploaded through ProjectCheckin' },
        { status: 400 }
      )
    }
    const combined = [...existing, ...incoming]

    const updated = await prisma.checkIn.update({
      where: { id: checkIn.id },
      data: {
        ...(installer !== undefined && { installer }),
        ...(street !== undefined && { street }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(zip !== undefined && { zip }),
        ...(doorType !== undefined && { doorType }),
        ...(notes !== undefined && { notes }),
        photoUrls: combined.join(','),
        // Same origin pinning as appendPhotoUrls — these feed the same
        // public rendering and server-side fetch paths.
        ...(beforePhotoUrl !== undefined && {
          beforePhotoUrl: isOwnStorageUrl(beforePhotoUrl) ? beforePhotoUrl : null,
        }),
        ...(afterPhotoUrl !== undefined && {
          afterPhotoUrl: isOwnStorageUrl(afterPhotoUrl) ? afterPhotoUrl : null,
        }),
        ...(homeCustomerName !== undefined && { homeCustomerName: homeCustomerName?.trim() || null }),
        ...(homeCustomerPhone !== undefined && { homeCustomerPhone: cleanPhone(homeCustomerPhone) }),
        ...(homeCustomerEmail !== undefined && { homeCustomerEmail: homeCustomerEmail?.trim() || null }),
        ...(aiDescriptionGeneratedAt !== undefined && {
          aiDescriptionGeneratedAt: aiDescriptionGeneratedAt ? new Date(aiDescriptionGeneratedAt) : null,
        }),
      },
    })

    // Keep the customer's WordPress post in step with the edit. Only published
    // jobs sync — syncCheckIn itself re-checks that and the Titan gate.
    if (updated.isPublic) {
      after(async () => {
        try {
          await syncCheckIn(checkIn.id)
        } catch (err) {
          console.error('WordPress resync failed after job edit:', err)
        }
      })
    }

    return NextResponse.json({ success: true, id: updated.id })
  } catch (error) {
    console.error('Error updating check-in:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
