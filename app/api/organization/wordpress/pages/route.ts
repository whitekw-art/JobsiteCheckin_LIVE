export const runtime = 'nodejs'

import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { decryptCredential } from '@/lib/wpCredentials'
import { resolvePageByUrl, type WpCredentials } from '@/lib/wordpressApi'
import { renderPageMapping, clearPageMapping } from '@/lib/wordpressSync'

// Existing-page injection mapping management (Phase 3b). Mirrors the owner +
// Titan guard shape of the sibling app/api/organization/wordpress/route.ts.
// GET list + picker data, POST create a mapping, PATCH the create-new-posts
// switch, DELETE remove a mapping.

type GatedOrg = {
  id: string
  planTier: string | null
  wpSiteUrl: string | null
  wpUsername: string | null
  wpApplicationPassword: string | null
  wpConnectionStatus: string | null
  wpCreateNewPosts: boolean
}

async function gate(): Promise<{ org: GatedOrg } | { error: NextResponse }> {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.organizationId) {
    return { error: NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 }) }
  }
  if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
    return { error: NextResponse.json({ error: 'Only owners can manage the WordPress connection' }, { status: 403 }) }
  }
  const org = await prisma.organization.findUnique({
    where: { id: currentUser.organizationId },
    select: {
      id: true,
      planTier: true,
      wpSiteUrl: true,
      wpUsername: true,
      wpApplicationPassword: true,
      wpConnectionStatus: true,
      wpCreateNewPosts: true,
    },
  })
  if (!org) return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) }
  if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'website_integration')) {
    return { error: NextResponse.json({ error: 'This feature requires the Titan plan' }, { status: 403 }) }
  }
  return { org }
}

function orgCreds(org: GatedOrg): WpCredentials | null {
  const password = decryptCredential(org.wpApplicationPassword)
  if (!org.wpSiteUrl || !org.wpUsername || !password) return null
  return { siteUrl: org.wpSiteUrl, username: org.wpUsername, password }
}

// GET — mappings + the picker's dropdown data (the org's own real published
// locations and services, so the customer never types a value that can't match).
export async function GET() {
  try {
    const g = await gate()
    if ('error' in g) return g.error
    const { org } = g

    const [mappings, jobs] = await Promise.all([
      prisma.wordPressPageMapping.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.checkIn.findMany({
        where: { organizationId: org.id, isPublic: true },
        select: { city: true, state: true, doorType: true },
      }),
    ])

    const locations = new Map<string, { city: string; state: string | null }>()
    const services = new Set<string>()
    for (const j of jobs) {
      if (j.city) locations.set(`${j.city}|${j.state ?? ''}`, { city: j.city, state: j.state })
      if (j.doorType) services.add(j.doorType)
    }

    return NextResponse.json({
      mappings,
      wpCreateNewPosts: org.wpCreateNewPosts,
      locations: [...locations.values()],
      services: [...services].sort(),
    })
  } catch (error) {
    console.error('Error loading WordPress page mappings:', error)
    return NextResponse.json({ error: 'Failed to load page mappings' }, { status: 500 })
  }
}

// POST { pageUrl, matchCity?, matchState?, matchService? } — resolve + validate
// the URL against the connected site, then save the mapping. Builder pages are
// saved but flagged (their jobs fall back to new posts). An initial render runs
// after the response.
export async function POST(request: NextRequest) {
  try {
    const g = await gate()
    if ('error' in g) return g.error
    const { org } = g

    if (org.wpConnectionStatus !== 'connected') {
      return NextResponse.json({ error: 'Connect your WordPress site first.' }, { status: 400 })
    }
    const creds = orgCreds(org)
    if (!creds) {
      return NextResponse.json({ error: 'Your WordPress connection is unavailable. Reconnect and try again.' }, { status: 400 })
    }

    const body = (await request.json()) as {
      pageUrl?: string
      matchCity?: string
      matchState?: string
      matchService?: string
    }
    const pageUrl = (body.pageUrl || '').trim()
    const matchCity = body.matchCity?.trim() || null
    const matchState = body.matchState?.trim() || null
    const matchService = body.matchService?.trim() || null
    if (!pageUrl) {
      return NextResponse.json({ error: 'Paste the URL of the page you want to use.' }, { status: 400 })
    }

    const resolved = await resolvePageByUrl(creds, pageUrl)
    if (!resolved.ok || !resolved.data) {
      return NextResponse.json({ error: resolved.error || "We couldn't find that page." }, { status: 400 })
    }

    // Overlap: an existing mapping with the exact same match dimensions. A warning,
    // not a block — the customer may be intentionally re-pointing a location.
    const existing = await prisma.wordPressPageMapping.findMany({ where: { organizationId: org.id } })
    const overlapWarning = existing.some(
      (m) =>
        (m.matchCity ?? '') === (matchCity ?? '') &&
        (m.matchState ?? '') === (matchState ?? '') &&
        (m.matchService ?? '') === (matchService ?? '')
    )

    const mapping = await prisma.wordPressPageMapping.create({
      data: {
        organizationId: org.id,
        matchCity,
        matchState,
        matchService,
        wpPageId: resolved.data.id,
        wpPageUrl: pageUrl,
        wpPageType: resolved.data.type,
        builderBlocked: resolved.data.builder,
      },
    })

    // Populate the page now (unless it's a builder page — nothing to inject there).
    if (!resolved.data.builder) {
      after(async () => {
        try {
          await renderPageMapping(mapping.id)
        } catch (err) {
          console.error('Initial page-mapping render failed:', err)
        }
      })
    }

    return NextResponse.json({
      mapping,
      builderNotice: resolved.data.builder,
      overlapWarning,
    })
  } catch (error) {
    console.error('Error creating WordPress page mapping:', error)
    return NextResponse.json({ error: 'Failed to save page mapping' }, { status: 500 })
  }
}

// PATCH { wpCreateNewPosts } — the master switch for whether unmatched jobs get
// their own new post.
export async function PATCH(request: NextRequest) {
  try {
    const g = await gate()
    if ('error' in g) return g.error
    const { org } = g

    const body = (await request.json()) as { wpCreateNewPosts?: boolean }
    if (typeof body.wpCreateNewPosts !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value.' }, { status: 400 })
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: { wpCreateNewPosts: body.wpCreateNewPosts },
    })
    return NextResponse.json({ wpCreateNewPosts: body.wpCreateNewPosts })
  } catch (error) {
    console.error('Error updating create-new-posts setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

// DELETE ?id= — remove a mapping. Empties our block from the page (never
// deletes the page) and removes the injected jobs' media first.
export async function DELETE(request: NextRequest) {
  try {
    const g = await gate()
    if ('error' in g) return g.error
    const { org } = g

    const id = new URL(request.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing mapping id.' }, { status: 400 })

    const mapping = await prisma.wordPressPageMapping.findFirst({
      where: { id, organizationId: org.id },
    })
    if (!mapping) return NextResponse.json({ error: 'Mapping not found.' }, { status: 404 })

    await clearPageMapping(mapping.id, 'unpublished')
    await prisma.wordPressPageMapping.delete({ where: { id: mapping.id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting WordPress page mapping:', error)
    return NextResponse.json({ error: 'Failed to delete page mapping' }, { status: 500 })
  }
}
