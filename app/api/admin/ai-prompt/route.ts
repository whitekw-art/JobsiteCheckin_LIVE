import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const CONFIG_KEY = 'ai_job_description_prompt'

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

export async function GET() {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const row = await prisma.adminConfig.findUnique({ where: { key: CONFIG_KEY } })
  return NextResponse.json({ prompt: row?.value ?? DEFAULT_PROMPT })
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser()
  if (user?.role !== 'SUPER_ADMIN') return new NextResponse(null, { status: 404 })

  const { prompt } = await request.json()
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  await prisma.adminConfig.upsert({
    where: { key: CONFIG_KEY },
    update: { value: prompt.trim() },
    create: { key: CONFIG_KEY, value: prompt.trim() },
  })

  return NextResponse.json({ ok: true })
}
