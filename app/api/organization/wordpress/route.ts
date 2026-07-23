export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import { encryptCredential, encryptionConfigured } from '@/lib/wpCredentials'
import { normalizeSiteUrl, testConnection } from '@/lib/wordpressApi'
import { revokeOrgWordPress } from '@/lib/wordpressSync'

// WordPress connection management (Phase 3, Website Integration for Local SEO).
// Mirrors the CNAME phase's shape in app/api/organization/subdomain/route.ts:
// GET status, POST to save + verify, DELETE to disconnect.

async function requireOwnerWithFeature() {
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
      wpConnectionStatus: true,
      wpConnectedAt: true,
    },
  })
  if (!org) {
    return { error: NextResponse.json({ error: 'Organization not found' }, { status: 404 }) }
  }
  if (currentUser.role !== 'SUPER_ADMIN' && !tierHasFeature(org.planTier, 'website_integration')) {
    return { error: NextResponse.json({ error: 'This feature requires the Titan plan' }, { status: 403 }) }
  }
  return { org }
}

// GET — current connection status, plus how many jobs are live on their site.
export async function GET() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    const [syncedCount, failedCount] = await Promise.all([
      prisma.checkIn.count({ where: { organizationId: org.id, wpSyncStatus: 'synced' } }),
      prisma.checkIn.count({ where: { organizationId: org.id, wpSyncStatus: 'failed' } }),
    ])

    return NextResponse.json({
      wpSiteUrl: org.wpSiteUrl,
      wpUsername: org.wpUsername,
      wpConnectionStatus: org.wpConnectionStatus,
      wpConnectedAt: org.wpConnectedAt,
      syncedCount,
      failedCount,
    })
  } catch (error) {
    console.error('Error loading WordPress connection:', error)
    return NextResponse.json({ error: 'Failed to load WordPress connection' }, { status: 500 })
  }
}

// POST { siteUrl, username, applicationPassword } — verify against the
// customer's live site, then store the credential encrypted.
export async function POST(request: NextRequest) {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (!encryptionConfigured()) {
      // Refuse rather than ever writing a customer credential in plaintext.
      console.error('WP_CREDENTIAL_ENCRYPTION_KEY is not set — refusing to store credentials')
      return NextResponse.json(
        { error: 'WordPress connections are temporarily unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    const body = (await request.json()) as {
      siteUrl?: string
      username?: string
      applicationPassword?: string
    }

    const siteUrl = normalizeSiteUrl(body.siteUrl || '')
    const username = (body.username || '').trim()
    // WordPress displays Application Passwords in spaced groups; the spaces are
    // presentational and must be stripped before use.
    const password = (body.applicationPassword || '').replace(/\s+/g, '')

    if (!siteUrl || !username || !password) {
      return NextResponse.json(
        { error: 'Enter your site address, WordPress username, and Application Password.' },
        { status: 400 }
      )
    }

    const test = await testConnection({ siteUrl, username, password })
    if (!test.ok) {
      await prisma.organization.update({
        where: { id: org.id },
        data: { wpConnectionStatus: 'failed' },
      })
      return NextResponse.json(
        { error: test.error || 'Connection failed — double-check your site address and Application Password, then try again.' },
        { status: 400 }
      )
    }

    const encrypted = encryptCredential(password)
    if (!encrypted) {
      return NextResponse.json(
        { error: 'WordPress connections are temporarily unavailable. Please contact support.' },
        { status: 503 }
      )
    }

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        wpSiteUrl: siteUrl,
        wpUsername: username,
        wpApplicationPassword: encrypted,
        wpConnectionStatus: 'connected',
        wpConnectedAt: new Date(),
      },
    })

    return NextResponse.json({
      wpSiteUrl: siteUrl,
      wpUsername: username,
      wpConnectionStatus: 'connected',
    })
  } catch (error) {
    console.error('Error saving WordPress connection:', error)
    return NextResponse.json({ error: 'Failed to save WordPress connection' }, { status: 500 })
  }
}

// DELETE — disconnect. Content published through the connection is removed
// from the customer's site first: once credentials are gone we can no longer
// manage or remove those posts, and leaving them orphaned would break the
// retention model in the design spec (§8).
export async function DELETE() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    await revokeOrgWordPress(org.id)

    await prisma.organization.update({
      where: { id: org.id },
      data: {
        wpSiteUrl: null,
        wpUsername: null,
        wpApplicationPassword: null,
        wpConnectionStatus: null,
        wpConnectedAt: null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error disconnecting WordPress:', error)
    return NextResponse.json({ error: 'Failed to disconnect WordPress' }, { status: 500 })
  }
}
