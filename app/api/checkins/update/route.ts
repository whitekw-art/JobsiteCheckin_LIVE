import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { refreshJobAfterEdit, findHomeownerName, HOMEOWNER_NAME_ERROR } from '@/lib/jobContent'
import { Prisma } from '@prisma/client'
import { altWithinLimits, cleanAltText, parseAltMap } from '@/lib/photoAlt'
import { applyPhotoChanges, deleteStoredPhotos, splitPhotoUrls, LAST_PHOTO_ERROR } from '@/lib/jobPhotos'

function cleanPhone(v: string | null | undefined): string | null {
  if (typeof v !== 'string') return null
  const t = v.trim()
  return t && /\d/.test(t) ? t : null
}

// Photo URLs arrive from the client, so they must be pinned to our own storage
// before being saved. Without this, an arbitrary URL ends up rendered as an
// <img src> on public job pages and fetched server-side by the WordPress
// publisher — the root cause behind VULN-2026-001.
// Pinned to this project's own storage host and bucket path. Matching
// *.supabase.co would be no real restriction at all — anyone can create a free
// Supabase project and get a valid subdomain on that domain.
const STORAGE_PREFIX = '/storage/v1/object/public/checkin-photos/'

function ownStorageHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!raw) return null
  try {
    return new URL(raw).hostname
  } catch {
    return null
  }
}

function isOwnStorageUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const host = ownStorageHost()
  if (!host) return false
  try {
    const u = new URL(value.trim())
    // Exactly one plain file name after the bucket prefix, with no query string
    // or fragment: a variant URL could otherwise alias another object.
    return (
      u.protocol === 'https:' &&
      u.hostname === host &&
      u.pathname.startsWith(STORAGE_PREFIX) &&
      /^[A-Za-z0-9._-]+$/.test(u.pathname.slice(STORAGE_PREFIX.length)) &&
      !u.search &&
      !u.hash
    )
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
      removePhotoUrls,
      beforePhotoUrl,
      afterPhotoUrl,
      homeCustomerName,
      homeCustomerPhone,
      homeCustomerEmail,
      aiDescriptionGeneratedAt,
      photoAltText,
      latitude,
      longitude,
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
      removePhotoUrls?: string[]
      beforePhotoUrl?: string | null
      afterPhotoUrl?: string | null
      homeCustomerName?: string | null
      homeCustomerPhone?: string | null
      homeCustomerEmail?: string | null
      aiDescriptionGeneratedAt?: string | null
      /** The job's full set of photo descriptions, keyed by photo address. */
      photoAltText?: Record<string, string> | null
      latitude?: number | null
      longitude?: number | null
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
      select: {
        id: true,
        photoUrls: true,
        street: true,
        city: true,
        state: true,
        zip: true,
        doorType: true,
        notes: true,
        isPublic: true,
        homeCustomerName: true,
        beforePhotoUrl: true,
        afterPhotoUrl: true,
        featuredPhotoUrl: true,
        photoAltText: true,
      },
    })
    if (!checkIn) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Workers may edit only their own UNPUBLISHED jobs. A published job is live
    // on the business's website and Google; only an owner or admin changes it.
    if (currentUser.role === 'USER' && checkIn.isPublic) {
      return NextResponse.json(
        { error: 'This job is published. Ask an owner or admin to make changes.' },
        { status: 403 }
      )
    }

    const incoming = (appendPhotoUrls ?? []).filter(isOwnStorageUrl)
    if ((appendPhotoUrls?.length ?? 0) !== incoming.length) {
      return NextResponse.json(
        { error: 'Photos must be uploaded through ProjectCheckin' },
        { status: 400 }
      )
    }
    const photoChange = applyPhotoChanges(
      {
        photoUrls: splitPhotoUrls(checkIn.photoUrls),
        beforePhotoUrl: checkIn.beforePhotoUrl,
        afterPhotoUrl: checkIn.afterPhotoUrl,
        featuredPhotoUrl: checkIn.featuredPhotoUrl,
      },
      {
        remove: Array.isArray(removePhotoUrls) ? removePhotoUrls : [],
        append: incoming,
        before: beforePhotoUrl,
        after: afterPhotoUrl,
      }
    )
    if (!photoChange.ok) {
      return NextResponse.json({ error: photoChange.error }, { status: 400 })
    }
    if (checkIn.isPublic && photoChange.next.photoUrls.length === 0) {
      return NextResponse.json({ error: LAST_PHOTO_ERROR }, { status: 400 })
    }

    // A published job's description is public text: it must never carry the
    // homeowner's name. Checked against the name stored on the job (or the one
    // being saved now), the only name that can be detected reliably.
    const nextNotes = notes !== undefined ? notes : checkIn.notes
    const nextName = homeCustomerName !== undefined ? homeCustomerName : checkIn.homeCustomerName
    if (checkIn.isPublic && findHomeownerName(nextNotes, nextName)) {
      return NextResponse.json({ error: HOMEOWNER_NAME_ERROR }, { status: 400 })
    }

    // Photo descriptions (alt text). The owner sends the job's full set after
    // editing it; each must belong to a photo the job keeps, fit the per-photo
    // limits (25 words; refused, never cut short) and not carry the homeowner's name. A photo that is
    // removed takes its description with it.
    const keptPhotos = new Set(photoChange.next.photoUrls)
    let nextAlts: Record<string, string> = Object.fromEntries(
      Object.entries(parseAltMap(checkIn.photoAltText)).filter(([url]) => keptPhotos.has(url))
    )
    if (photoAltText !== undefined) {
      if (photoAltText !== null && (typeof photoAltText !== 'object' || Array.isArray(photoAltText))) {
        return NextResponse.json({ error: 'Photo descriptions are not valid.' }, { status: 400 })
      }
      nextAlts = {}
      for (const [url, text] of Object.entries(photoAltText ?? {})) {
        if (!keptPhotos.has(url) || typeof text !== 'string') continue
        const cleaned = cleanAltText(text)
        if (!cleaned) continue
        if (!altWithinLimits(cleaned)) {
          return NextResponse.json(
            { error: 'Each photo description must be 25 words or fewer. Shorten it and save again.' },
            { status: 400 }
          )
        }
        if (findHomeownerName(cleaned, nextName ?? checkIn.homeCustomerName, { lenient: true })) {
          return NextResponse.json(
            { error: "Remove the homeowner's name from the photo descriptions before saving. Customer names stay in the dashboard only." },
            { status: 400 }
          )
        }
        nextAlts[url] = cleaned
      }
    }
    const altChanged = JSON.stringify(nextAlts) !== JSON.stringify(parseAltMap(checkIn.photoAltText))

    // When the address changes, the old coordinates point at the old place.
    // The client geocodes the new address and sends the result; if it could
    // not, the coordinates are cleared rather than left pointing at the wrong
    // house (an exact map pin must never show the wrong location).
    const addressChanged =
      (street !== undefined && street !== checkIn.street) ||
      (city !== undefined && city !== checkIn.city) ||
      (state !== undefined && state !== checkIn.state) ||
      (zip !== undefined && zip !== checkIn.zip)
    const validCoords =
      typeof latitude === 'number' && Number.isFinite(latitude) && Math.abs(latitude) <= 90 &&
      typeof longitude === 'number' && Number.isFinite(longitude) && Math.abs(longitude) <= 180
    const locationData = addressChanged
      ? validCoords
        ? { latitude, longitude, locationSource: 'ADDRESS' }
        : { latitude: null, longitude: null, locationSource: null }
      : {}

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
        // Tags can only point at this job's own photos (applyPhotoChanges),
        // which are pinned to our storage, so no separate origin check needed.
        photoUrls: photoChange.next.photoUrls.join(','),
        beforePhotoUrl: photoChange.next.beforePhotoUrl,
        afterPhotoUrl: photoChange.next.afterPhotoUrl,
        featuredPhotoUrl: photoChange.next.featuredPhotoUrl,
        ...(altChanged && { photoAltText: Object.keys(nextAlts).length ? nextAlts : Prisma.DbNull }),
        ...(homeCustomerName !== undefined && { homeCustomerName: homeCustomerName?.trim() || null }),
        ...(homeCustomerPhone !== undefined && { homeCustomerPhone: cleanPhone(homeCustomerPhone) }),
        ...(homeCustomerEmail !== undefined && { homeCustomerEmail: homeCustomerEmail?.trim() || null }),
        ...(aiDescriptionGeneratedAt !== undefined && {
          aiDescriptionGeneratedAt: aiDescriptionGeneratedAt ? new Date(aiDescriptionGeneratedAt) : null,
        }),
        ...locationData,
      },
    })

    // Regenerate the public title and description from the saved fields, and
    // keep the customer's WordPress post in step with the edit.
    await refreshJobAfterEdit(updated.id, {
      city: checkIn.city,
      state: checkIn.state,
      doorType: checkIn.doorType,
    })

    // Removed photos are deleted from storage once the job no longer uses
    // them, so a removed photo is not left publicly reachable at its URL.
    if (photoChange.removed.length > 0) {
      after(async () => {
        await deleteStoredPhotos(photoChange.removed, currentUser.organizationId!)
      })
    }

    return NextResponse.json({
      success: true,
      id: updated.id,
      photoUrls: photoChange.next.photoUrls,
      beforePhotoUrl: photoChange.next.beforePhotoUrl,
      afterPhotoUrl: photoChange.next.afterPhotoUrl,
    })
  } catch (error) {
    console.error('Error updating check-in:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
