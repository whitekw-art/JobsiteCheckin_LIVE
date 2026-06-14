import { NextResponse } from 'next/server'
import dns from 'dns'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasFeature } from '@/lib/planVersions'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SCAN_CAP = 2
const SCAN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const MAX_PAGES = 10
const MAX_TEXT_BYTES = 50_000
const MAX_REDIRECTS = 3

const RELEVANT_SEGMENTS = ['service', 'about', 'product', 'portfolio', 'our-work', 'work', 'what-we-do', 'brand', 'offering']
const SKIP_SEGMENTS = ['blog', 'news', 'article', 'contact', 'privacy', 'terms', 'login', 'register', 'cart', 'checkout']

// ── SSRF protection ──────────────────────────────────────────────────────────

function isPrivateIP(ip: string): boolean {
  const v4 = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (v4) {
    const [, a, b, c] = v4.map(Number)
    if (a === 127) return true                          // 127.0.0.0/8 loopback
    if (a === 0) return true                            // 0.0.0.0/8
    if (a === 10) return true                           // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true   // 172.16.0.0/12
    if (a === 192 && b === 168) return true             // 192.168.0.0/16
    if (a === 169 && b === 254) return true             // 169.254.0.0/16 link-local / metadata
    if (a === 100 && b >= 64 && b <= 127) return true  // 100.64.0.0/10 shared
    void c
    return false
  }
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  if (lower.startsWith('fc') || lower.startsWith('fd')) return true // fc00::/7
  if (lower.startsWith('fe80')) return true                         // link-local
  if (lower.startsWith('::ffff:')) return isPrivateIP(lower.slice(7))
  return false
}

async function isSafeHostname(hostname: string): Promise<boolean> {
  const h = hostname.toLowerCase().replace(/\.+$/, '')
  if (h === 'localhost' || h === 'ip6-localhost') return false
  try {
    const addrs = await dns.promises.lookup(h, { all: true })
    return addrs.every((a) => !isPrivateIP(a.address))
  } catch {
    return false
  }
}

async function validateSsrfUrl(raw: string): Promise<{ ok: boolean; url?: URL; error?: string }> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, error: 'Invalid URL' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Only http/https URLs allowed' }
  }
  const safe = await isSafeHostname(parsed.hostname)
  if (!safe) return { ok: false, error: 'Hostname resolves to a private address' }
  return { ok: true, url: parsed }
}

// Fetch with redirect: 'manual' and re-validate each hop
async function safeFetch(rawUrl: string, hops = 0): Promise<Response | null> {
  if (hops > MAX_REDIRECTS) return null
  const check = await validateSsrfUrl(rawUrl)
  if (!check.ok) return null
  try {
    const res = await fetch(rawUrl, {
      headers: { 'User-Agent': 'ProjectCheckin-AgentBot/1.0' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    })
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) return null
      const next = new URL(location, rawUrl).href
      return safeFetch(next, hops + 1)
    }
    return res
  } catch {
    return null
  }
}

// ── HTML helpers ─────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractLinks(html: string, base: URL): string[] {
  const hrefs: string[] = []
  const linkRe = /href=["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) {
    try {
      const url = new URL(m[1], base.href)
      // Same-origin only — hostname already DNS-validated via base
      if (url.hostname === base.hostname && url.pathname !== base.pathname) {
        hrefs.push(url.href.split('#')[0])
      }
    } catch {
      // skip malformed
    }
  }
  return [...new Set(hrefs)]
}

function isRelevantPath(pathname: string): boolean {
  const lower = pathname.toLowerCase()
  if (SKIP_SEGMENTS.some((s) => lower.includes(s))) return false
  if (pathname === '/' || pathname === '') return true
  return RELEVANT_SEGMENTS.some((s) => lower.includes(s))
}

async function fetchPageText(url: string): Promise<string> {
  const res = await safeFetch(url)
  if (!res?.ok) return ''
  const html = await res.text()
  return stripHtml(html)
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const org = await prisma.organization.findUnique({
      where: { id: currentUser.organizationId },
      select: {
        id: true,
        name: true,
        website: true,
        planTier: true,
        planVersion: true,
        websiteScanHistory: true,
      },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!hasFeature(org.planTier, org.planVersion, 'ai_job_description')) {
      return NextResponse.json({ error: 'Titan plan required' }, { status: 403 })
    }

    // Rate cap: 2 scans per rolling 7-day window
    const history = (org.websiteScanHistory as string[]) ?? []
    const now = Date.now()
    const recent = history.filter((ts) => now - new Date(ts).getTime() < SCAN_WINDOW_MS)
    if (recent.length >= SCAN_CAP) {
      const oldest = Math.min(...recent.map((ts) => new Date(ts).getTime()))
      const availableAt = new Date(oldest + SCAN_WINDOW_MS)
      const daysRemaining = Math.ceil((availableAt.getTime() - now) / (24 * 60 * 60 * 1000))
      return NextResponse.json(
        { error: 'rate_limited', daysRemaining, availableAt: availableAt.toISOString() },
        { status: 429 }
      )
    }

    if (!org.website) {
      return NextResponse.json({ error: 'No website URL on file' }, { status: 400 })
    }

    const websiteUrl = org.website.startsWith('http') ? org.website : `https://${org.website}`

    // SSRF validation before any network call
    const ssrfCheck = await validateSsrfUrl(websiteUrl)
    if (!ssrfCheck.ok) {
      return NextResponse.json({ error: 'Invalid or disallowed website URL' }, { status: 400 })
    }
    const base = ssrfCheck.url!

    // Scrape homepage
    const homepageRes = await safeFetch(websiteUrl)
    if (!homepageRes?.ok) {
      return NextResponse.json({
        services: '', products: '', serviceArea: '', businessDescription: '', scraped: false,
      })
    }
    const homepageHtml = await homepageRes.text()
    const homepageText = stripHtml(homepageHtml)

    // Extract same-origin links and filter to relevant paths
    const allLinks = extractLinks(homepageHtml, base)
    const relevantLinks = allLinks
      .filter((href) => {
        try { return isRelevantPath(new URL(href).pathname) } catch { return false }
      })
      .slice(0, MAX_PAGES)

    // Scrape subpages in parallel (same-origin — hostname already validated)
    const subpageTexts = await Promise.all(relevantLinks.map(fetchPageText))

    const combined = [homepageText, ...subpageTexts].join('\n\n')
    const truncated = combined.length > MAX_TEXT_BYTES ? combined.slice(0, MAX_TEXT_BYTES) : combined

    if (!truncated.trim()) {
      return NextResponse.json({
        services: '', products: '', serviceArea: '', businessDescription: '', scraped: false,
      })
    }

    // Extract structured fields via OpenAI
    const extraction = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a business analyst. Extract structured information from the following website text. Return ONLY valid JSON with these exact keys: services (comma-separated list of services offered), products (comma-separated product brands or product lines mentioned), serviceArea (city/region/state the business serves), businessDescription (1-2 sentence summary of what the company does and who they serve). If a field cannot be determined, return an empty string for that field.',
        },
        {
          role: 'user',
          content: `Website text for ${org.name ?? 'this business'}:\n\n${truncated}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
    })

    const raw = extraction.choices[0]?.message?.content ?? '{}'
    let extracted: { services?: string; products?: string; serviceArea?: string; businessDescription?: string } = {}
    try {
      extracted = JSON.parse(raw)
    } catch {
      extracted = {}
    }

    const businessContext = JSON.stringify({
      services: extracted.services ?? '',
      products: extracted.products ?? '',
      serviceArea: extracted.serviceArea ?? '',
      businessDescription: extracted.businessDescription ?? '',
    })

    const updatedHistory = [...recent, new Date().toISOString()]
    await prisma.organization.update({
      where: { id: org.id },
      data: {
        businessContext,
        businessContextUpdatedAt: new Date(),
        websiteScanHistory: updatedHistory,
      },
    })

    return NextResponse.json({
      services: extracted.services ?? '',
      products: extracted.products ?? '',
      serviceArea: extracted.serviceArea ?? '',
      businessDescription: extracted.businessDescription ?? '',
      scraped: true,
    })
  } catch (error) {
    console.error('scrape-website error:', error)
    return NextResponse.json({ error: 'Scrape failed' }, { status: 500 })
  }
}
