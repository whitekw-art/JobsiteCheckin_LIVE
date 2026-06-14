import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasFeature } from '@/lib/planVersions'
import { getAiConfig } from '@/lib/aiConfig'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DAY_MS = 24 * 60 * 60 * 1000

const DEFAULT_PROMPT = `You are an SEO copywriter for a field service business. Write a 100–150 word description of a completed job.

Requirements:
- Use natural language optimized for local search
- Include the service type, city, state, and a long-tail keyword variant (e.g. "mahogany front door installation in [City], [State]")
- Include specific product or material details visible in the photos or mentioned in the notes
- Do NOT invent or fabricate any product details, materials, or specifics not present in the input
- Write in third person
- Do not use bullet points or headers
- Do not begin with "I" or "We"
- Output only the description — no preamble, no explanation`

async function getSystemPrompt(): Promise<string> {
  try {
    const row = await prisma.adminConfig.findUnique({
      where: { key: 'ai_job_description_prompt' },
    })
    return row?.value || DEFAULT_PROMPT
  } catch {
    return DEFAULT_PROMPT
  }
}

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
        planTier: true,
        planVersion: true,
        businessContext: true,
        aiDescriptionHistory: true,
      },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    if (!hasFeature(org.planTier, org.planVersion, 'ai_job_description')) {
      return NextResponse.json({ error: 'Titan plan required' }, { status: 403 })
    }

    const aiConfig = await getAiConfig()

    if (!aiConfig.jobDescriptionEnabled) {
      return NextResponse.json({ error: 'AI job description generation is currently disabled.' }, { status: 503 })
    }

    const { checkInId } = await req.json()
    if (!checkInId) {
      return NextResponse.json({ error: 'checkInId is required' }, { status: 400 })
    }

    const checkIn = await prisma.checkIn.findFirst({
      where: { id: checkInId, organizationId: currentUser.organizationId },
      select: {
        id: true,
        doorType: true,
        city: true,
        state: true,
        zip: true,
        notes: true,
        photoUrls: true,
        aiDescriptionCount: true,
      },
    })

    if (!checkIn) {
      return NextResponse.json({ error: 'Check-in not found' }, { status: 404 })
    }

    // Per-job rate cap
    if ((checkIn.aiDescriptionCount ?? 0) >= aiConfig.jobDescriptionPerJobCap) {
      return NextResponse.json(
        { error: 'rate_limited', message: `Maximum ${aiConfig.jobDescriptionPerJobCap} generations per job reached` },
        { status: 429 }
      )
    }

    // Per-org daily rate cap
    const history = (org.aiDescriptionHistory as string[]) ?? []
    const now = Date.now()
    const todayHistory = history.filter((ts) => now - new Date(ts).getTime() < DAY_MS)
    if (todayHistory.length >= aiConfig.jobDescriptionDailyOrgCap) {
      return NextResponse.json(
        { error: 'rate_limited', message: `Daily limit of ${aiConfig.jobDescriptionDailyOrgCap} generations reached. Try again tomorrow.` },
        { status: 429 }
      )
    }

    // Parse business context
    let businessCtx: {
      services?: string
      products?: string
      serviceArea?: string
      businessDescription?: string
    } = {}
    if (org.businessContext) {
      try {
        businessCtx = JSON.parse(org.businessContext)
      } catch {
        businessCtx = {}
      }
    }

    // Build business context block for prompt
    const businessBlock = [
      org.name ? `Business: ${org.name}` : '',
      businessCtx.services ? `Services: ${businessCtx.services}` : '',
      businessCtx.products ? `Known products/brands: ${businessCtx.products}` : '',
      businessCtx.serviceArea ? `Service area: ${businessCtx.serviceArea}` : '',
      businessCtx.businessDescription ? `About: ${businessCtx.businessDescription}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    // Build job context block
    const location = [checkIn.city, checkIn.state, checkIn.zip].filter(Boolean).join(', ')
    const jobBlock = [
      checkIn.doorType ? `Service type: ${checkIn.doorType}` : '',
      location ? `Location: ${location}` : '',
      `Worker notes: ${checkIn.notes?.trim() || 'None provided'}`,
    ]
      .filter(Boolean)
      .join('\n')

    // Parse photo URLs (comma-separated string)
    const photoUrls = checkIn.photoUrls
      ? checkIn.photoUrls.split(',').map((u) => u.trim()).filter(Boolean)
      : []

    // Assemble user message with text + optional vision content blocks
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail: 'low' } }

    const userContent: ContentBlock[] = [
      {
        type: 'text',
        text: [
          businessBlock ? `BUSINESS CONTEXT:\n${businessBlock}` : '',
          `JOB CONTEXT:\n${jobBlock}`,
          photoUrls.length > 0
            ? `Photos attached (${photoUrls.length}): describe any visible products, materials, hardware, or finishes to include in the description.`
            : 'No photos available.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ]

    // Add photo URLs as vision content blocks (max 5 to control cost)
    for (const url of photoUrls.slice(0, 5)) {
      userContent.push({ type: 'image_url', image_url: { url, detail: 'low' } })
    }

    const systemPrompt = await getSystemPrompt()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 300,
    })

    const description = completion.choices[0]?.message?.content?.trim() ?? ''
    if (!description) {
      return NextResponse.json({ error: 'No description generated' }, { status: 500 })
    }

    // Increment per-job counter + update org daily history
    await Promise.all([
      prisma.checkIn.update({
        where: { id: checkIn.id },
        data: { aiDescriptionCount: { increment: 1 } },
      }),
      prisma.organization.update({
        where: { id: org.id },
        data: { aiDescriptionHistory: [...todayHistory, new Date().toISOString()] },
      }),
    ])

    return NextResponse.json({ description })
  } catch (error) {
    console.error('job-description error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
