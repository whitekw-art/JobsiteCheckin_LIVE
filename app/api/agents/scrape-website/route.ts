import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasFeature } from '@/lib/planVersions'
import { getAiConfig } from '@/lib/aiConfig'
import { safeFetch, validateSsrfUrl } from '@/lib/ssrf'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MAX_PAGES = 10
const MAX_TEXT_BYTES = 50_000

const RELEVANT_SEGMENTS = ['service', 'about', 'product', 'portfolio', 'our-work', 'work', 'what-we-do', 'brand', 'offering']
const SKIP_SEGMENTS = ['blog', 'news', 'article', 'contact', 'privacy', 'terms', 'login', 'register', 'cart', 'checkout']

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

    const aiConfig = await getAiConfig()

    if (!aiConfig.websiteScanEnabled) {
      return NextResponse.json({ error: 'Website scanning is currently disabled.' }, { status: 503 })
    }

    const scanWindowMs = aiConfig.websiteScanWindowDays * 24 * 60 * 60 * 1000

    // Rate cap: N scans per rolling window
    const history = (org.websiteScanHistory as string[]) ?? []
    const now = Date.now()
    const recent = history.filter((ts) => now - new Date(ts).getTime() < scanWindowMs)
    if (recent.length >= aiConfig.websiteScanCap) {
      const oldest = Math.min(...recent.map((ts) => new Date(ts).getTime()))
      const availableAt = new Date(oldest + scanWindowMs)
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
