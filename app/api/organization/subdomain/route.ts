import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { tierHasFeature } from '@/lib/planVersions'
import {
  addDomainToProject,
  removeDomainFromProject,
  checkVercelDomain,
  checkDnsPointsToUs,
  CNAME_TARGET,
} from '@/lib/vercelDomains'
import { safeFetch } from '@/lib/ssrf'

// One DNS label: letters/digits, optional inner hyphens, max 63 chars
const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/

// Hosts we serve the app on — a customer subdomain can never be one of these
const RESERVED_HOSTS = ['projectcheckin.com', 'www.projectcheckin.com']

// Checks whether the customer's own homepage contains a link pointing at
// their subdomain — a cheap best-effort signal, not a guarantee. Returns
// null (not true/false) when the check itself couldn't run, so the UI can
// tell "confirmed not linked" apart from "couldn't check right now."
async function checkHomepageLinksToSubdomain(website: string | null, host: string): Promise<boolean | null> {
  if (!website) return null
  const url = website.startsWith('http') ? website : `https://${website}`
  try {
    const res = await safeFetch(url)
    if (!res?.ok) return null
    const html = await res.text()
    return html.toLowerCase().includes(host.toLowerCase())
  } catch {
    return null
  }
}

function apexFromWebsite(website: string | null): string | null {
  if (!website) return null
  try {
    const url = new URL(website.startsWith('http') ? website : `https://${website}`)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    return host.includes('.') ? host : null
  } catch {
    return null
  }
}

async function requireOwnerWithFeature() {
  const currentUser = await getCurrentUser()
  if (!currentUser || !currentUser.organizationId) {
    return { error: NextResponse.json({ error: 'No organization linked to current user' }, { status: 404 }) }
  }
  if (!['OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
    return { error: NextResponse.json({ error: 'Only owners can manage the hosted subdomain' }, { status: 403 }) }
  }
  const org = await prisma.organization.findUnique({
    where: { id: currentUser.organizationId },
    select: {
      id: true,
      website: true,
      planTier: true,
      customSubdomain: true,
      subdomainStatus: true,
      subdomainVerifiedAt: true,
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

// GET — current subdomain + live verification check.
// When status is pending, re-checks DNS + Vercel and promotes to verified.
export async function GET() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    const apexDomain = apexFromWebsite(org.website)
    let { customSubdomain, subdomainStatus, subdomainVerifiedAt } = org

    if (customSubdomain && subdomainStatus === 'pending') {
      const [dnsOk, vercel] = await Promise.all([
        checkDnsPointsToUs(customSubdomain),
        checkVercelDomain(customSubdomain),
      ])
      if (dnsOk && vercel.verified && !vercel.misconfigured) {
        subdomainStatus = 'verified'
        subdomainVerifiedAt = new Date()
        await prisma.organization.update({
          where: { id: org.id },
          data: { subdomainStatus, subdomainVerifiedAt },
        })
      }
    }

    const homepageLinked =
      customSubdomain && subdomainStatus === 'verified'
        ? await checkHomepageLinksToSubdomain(org.website, customSubdomain)
        : null

    return NextResponse.json({
      customSubdomain,
      subdomainStatus,
      subdomainVerifiedAt,
      homepageLinked,
      apexDomain,
      cnameTarget: CNAME_TARGET,
    })
  } catch (error) {
    console.error('Error loading subdomain status:', error)
    return NextResponse.json({ error: 'Failed to load subdomain status' }, { status: 500 })
  }
}

// POST { label } — set the subdomain and register it with Vercel
export async function POST(request: NextRequest) {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    const apexDomain = apexFromWebsite(org.website)
    if (!apexDomain) {
      return NextResponse.json(
        { error: 'Add your website in Account → General first — your subdomain is built from it' },
        { status: 400 }
      )
    }

    const { label } = (await request.json()) as { label?: string }
    const cleanLabel = (label || '').trim().toLowerCase()
    if (!LABEL_RE.test(cleanLabel)) {
      return NextResponse.json(
        { error: 'Subdomain can only contain letters, numbers, and hyphens (e.g. our-work)' },
        { status: 400 }
      )
    }
    if (cleanLabel === 'www') {
      return NextResponse.json({ error: 'www is reserved — pick a different subdomain' }, { status: 400 })
    }

    const host = `${cleanLabel}.${apexDomain}`
    if (RESERVED_HOSTS.includes(host) || host.endsWith('.projectcheckin.com') || host.endsWith('.vercel.app')) {
      return NextResponse.json({ error: 'That subdomain is not available' }, { status: 400 })
    }

    // One org per hostname
    const taken = await prisma.organization.findFirst({
      where: { customSubdomain: host, NOT: { id: org.id } },
      select: { id: true },
    })
    if (taken) {
      return NextResponse.json({ error: 'That subdomain is already in use' }, { status: 409 })
    }

    // Changing to a different hostname? Release the old one from Vercel first.
    if (org.customSubdomain && org.customSubdomain !== host) {
      await removeDomainFromProject(org.customSubdomain)
    }

    const added = await addDomainToProject(host)
    if (!added.ok) {
      return NextResponse.json(
        { error: `Could not register the domain: ${added.error}` },
        { status: 502 }
      )
    }

    const updated = await prisma.organization.update({
      where: { id: org.id },
      data: {
        customSubdomain: host,
        subdomainStatus: 'pending',
        subdomainVerifiedAt: null,
      },
      select: { customSubdomain: true, subdomainStatus: true },
    })

    return NextResponse.json({
      customSubdomain: updated.customSubdomain,
      subdomainStatus: updated.subdomainStatus,
      apexDomain,
      cnameTarget: CNAME_TARGET,
    })
  } catch (error) {
    console.error('Error saving subdomain:', error)
    return NextResponse.json({ error: 'Failed to save subdomain' }, { status: 500 })
  }
}

// DELETE — remove the subdomain entirely
export async function DELETE() {
  try {
    const gate = await requireOwnerWithFeature()
    if ('error' in gate) return gate.error
    const { org } = gate

    if (org.customSubdomain) {
      await removeDomainFromProject(org.customSubdomain)
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: { customSubdomain: null, subdomainStatus: null, subdomainVerifiedAt: null },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error removing subdomain:', error)
    return NextResponse.json({ error: 'Failed to remove subdomain' }, { status: 500 })
  }
}
