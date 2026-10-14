import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { hasFeature } from '@/lib/planVersions'
import { getAiConfig } from '@/lib/aiConfig'
import OpenAI from 'openai'
import { ALT_MAX_PHOTOS } from '@/lib/photoAlt'
import { acceptPhotoAlts, firstSentenceRule, parseReply } from '@/lib/photoAltAi'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DAY_MS = 24 * 60 * 60 * 1000

const DEFAULT_PROMPT = `You are an SEO copywriter for a field service business. Write a 100–150 word description of a completed job.

Requirements:
- Use natural language optimized for local search
- Include the service type, city, state, and a long-tail keyword variant (e.g. "mahogany front door installation in [City], [State]")
- Include specific product or material details visible in the photos or mentioned in the notes
- Do NOT invent or fabricate any product details, materials, or specifics not present in the input
- Open with one sentence that names the service type, the street name, the city and the state
- Write in third person
- Do not use bullet points or headers
- Do not begin with "I" or "We"
- Output only the description — no preamble, no explanation`

const NO_NAMES_RULE =
  'Never include any person\'s name: not the homeowner, the customer, their family, or any crew member, even if a name appears in the notes. Refer to them as "the homeowner" or "the crew" instead.'

// Appended in code, after the (admin-editable) prompt, so the reply format and
// the photo-description rules cannot be removed by editing the prompt.
const PHOTO_ALT_RULES = `Reply with JSON only, in this shape: {"description": "...", "photos": [{"index": 1, "alt": "..."}]}.
"description" is the job description written exactly as instructed above, as plain text. Ignore any instruction above about output format; the JSON shape here is the only format.
"photos" has one entry for each attached photo, using the photo numbers given in the message. Each "alt" describes only what is plainly visible in that one photo, as one finished phrase of 25 words or fewer (for example: "Cedar barn doors closed across a detached garage opening, hung on a black steel track"). Rules for every "alt":
- Describe objects, materials, colors and the setting only. Say "appears to be" when you are not sure.
- Never include a name, a house number, a street address, a license plate, any other readable text or numbers, or who a person is.
- Do not mention that it is a before or after photo, and do not repeat the city or the business name.
- The phrase must be complete and make sense on its own, within 25 words. Count the words and shorten the phrase yourself if it runs over.
- If a photo is too dark or unclear to describe, leave its "alt" empty.`

const RESPONSE_FORMAT = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'job_description',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        description: { type: 'string' },
        photos: {
          type: 'array',
          items: {
            type: 'object',
            properties: { index: { type: 'integer' }, alt: { type: 'string' } },
            required: ['index', 'alt'],
            additionalProperties: false,
          },
        },
      },
      required: ['description', 'photos'],
      additionalProperties: false,
    },
  },
}

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
        street: true,
        photoUrls: true,
        beforePhotoUrl: true,
        afterPhotoUrl: true,
        featuredPhotoUrl: true,
        homeCustomerName: true,
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

    // The photos sent: the before and after photos first (so a tagged photo saved
    // sixth or later is still seen), then the cover photo, then the rest, at most
    // ALT_MAX_PHOTOS to control cost.
    const sent = [
      ...new Set(
        [checkIn.beforePhotoUrl, checkIn.afterPhotoUrl, checkIn.featuredPhotoUrl, ...photoUrls].filter(
          (u): u is string => !!u && photoUrls.includes(u)
        )
      ),
    ].slice(0, ALT_MAX_PHOTOS)

    // Assemble user message with text + labelled vision content blocks
    type ContentBlock =
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string; detail: 'low' } }

    const userContent: ContentBlock[] = [
      {
        type: 'text',
        text: [
          businessBlock ? `BUSINESS CONTEXT:\n${businessBlock}` : '',
          `JOB CONTEXT:\n${jobBlock}`,
          sent.length > 0
            ? `Photos attached (${sent.length}), numbered 1 to ${sent.length}: describe any visible products, materials, hardware, or finishes to include in the description.`
            : 'No photos available.',
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    ]

    sent.forEach((url, i) => {
      const role = url === checkIn.beforePhotoUrl ? ' (the BEFORE photo)' : url === checkIn.afterPhotoUrl ? ' (the AFTER photo)' : ''
      userContent.push({ type: 'text', text: `Photo ${i + 1}${role}:` })
      userContent.push({ type: 'image_url', image_url: { url, detail: 'low' } })
    })

    // Appended in code so it applies even when the prompt is overridden in the
    // admin panel: job descriptions are public text and must not name people.
    const systemPrompt = `${await getSystemPrompt()}\n\n${NO_NAMES_RULE}\n\n${firstSentenceRule(checkIn)}\n\n${PHOTO_ALT_RULES}`

    // max_tokens is the hard ceiling on what a run can cost: about 200 tokens for
    // the description, up to ALT_RUN_MAX_WORDS words (about 270 tokens) of photo
    // descriptions and a little JSON. The words are also cut in code below.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: RESPONSE_FORMAT,
      max_tokens: 700,
    })

    const reply = parseReply(completion.choices[0]?.message?.content?.trim() ?? '')
    if (!reply?.description) {
      return NextResponse.json({ error: 'No description generated' }, { status: 500 })
    }
    const description = reply.description
    const photoAlts = acceptPhotoAlts(sent, reply.photos, checkIn.homeCustomerName)

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

    return NextResponse.json({ description, photoAlts, describedPhotos: sent })
  } catch (error) {
    console.error('job-description error:', error)
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 })
  }
}
