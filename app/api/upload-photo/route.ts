import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import convert from 'heic-convert'
import { getCurrentUser } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Detects the actual image type by inspecting the file's magic bytes.
 * Returns the MIME type string if recognised, or null if not a supported image.
 * This is intentionally independent of the client-reported Content-Type.
 */
function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg'
  }

  // PNG: 89 50 4E 47
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png'
  }

  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif'
  }

  // WebP: RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp'
  }

  // HEIC/HEIF: ftyp box at offset 4 (bytes 4-7 = 66 74 79 70)
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    return 'image/heic'
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    // 1. Require authentication
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    // 2. Enforce file size limit before reading buffer
    if (photo.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10 MB.' },
        { status: 400 }
      )
    }

    const arrayBuffer = await photo.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    // 3. Validate actual file type via magic bytes (ignore client-reported type)
    const detectedMime = detectImageMimeType(inputBuffer)
    if (!detectedMime) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are accepted.' },
        { status: 400 }
      )
    }

    const timestamp = Date.now()
    const filename = `jobsite-${timestamp}.jpg`

    let outputBuffer: Buffer

    // Convert HEIC to JPEG; pass all other formats through as-is
    if (detectedMime === 'image/heic') {
      try {
        outputBuffer = (await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.8,
        })) as Buffer
      } catch {
        outputBuffer = inputBuffer
      }
    } else {
      outputBuffer = inputBuffer
    }

    const { error: uploadError } = await supabase.storage
      .from('checkin-photos')
      .upload(filename, outputBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload photo' },
        { status: 500 }
      )
    }

    const { data } = supabase.storage
      .from('checkin-photos')
      .getPublicUrl(filename)

    return NextResponse.json({ photoUrl: data.publicUrl })
  } catch (error) {
    console.error('Error processing photo:', error)
    return NextResponse.json(
      { error: 'Failed to process photo' },
      { status: 500 }
    )
  }
}
