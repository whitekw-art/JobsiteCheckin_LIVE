import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import convert from 'heic-convert'
import sharp from 'sharp'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMonthlyPhotoCap } from '@/lib/planVersions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const MAX_DIMENSION = 2400

function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png'

  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif'

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp'

  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70
  ) return 'image/heic'

  return null
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org for plan tier + cap check
    const org = await prisma.organization.findFirst({
      where: { users: { some: { id: currentUser.id } } },
      select: { id: true, planTier: true },
    })

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 400 })
    }

    // Check monthly photo cap
    const cap = getMonthlyPhotoCap(org.planTier)
    if (cap !== Infinity) {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const count = await prisma.photo.count({
        where: { orgId: org.id, createdAt: { gte: monthStart } },
      })

      if (count >= cap) {
        return NextResponse.json(
          { error: `Monthly photo limit reached (${cap} photos). Upgrade your plan to upload more.` },
          { status: 429 }
        )
      }
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    if (photo.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10 MB.' }, { status: 400 })
    }

    const arrayBuffer = await photo.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    const detectedMime = detectImageMimeType(inputBuffer)
    if (!detectedMime) {
      return NextResponse.json({ error: 'Invalid file type. Only images are accepted.' }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `jobsite-${timestamp}.jpg`

    // Convert HEIC → JPEG, then resize all images to max 2400px
    let rawBuffer: Buffer
    if (detectedMime === 'image/heic') {
      try {
        rawBuffer = (await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.8 })) as Buffer
      } catch {
        rawBuffer = inputBuffer
      }
    } else {
      rawBuffer = inputBuffer
    }

    const outputBuffer = await sharp(rawBuffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    const { error: uploadError } = await supabase.storage
      .from('checkin-photos')
      .upload(filename, outputBuffer, { contentType: 'image/jpeg', upsert: false })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 })
    }

    const { data } = supabase.storage.from('checkin-photos').getPublicUrl(filename)

    // Record upload for cap tracking
    await prisma.photo.create({
      data: { filename, url: data.publicUrl, orgId: org.id },
    })

    return NextResponse.json({ photoUrl: data.publicUrl })
  } catch (error) {
    console.error('Error processing photo:', error)
    return NextResponse.json({ error: 'Failed to process photo' }, { status: 500 })
  }
}
