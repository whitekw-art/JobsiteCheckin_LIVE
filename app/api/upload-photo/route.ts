import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import convert from 'heic-convert'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `jobsite-${timestamp}.jpg`
    const arrayBuffer = await photo.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)
    
    let outputBuffer: Buffer
    
    // Check if it's a HEIC file and convert to JPEG
    if (photo.type === 'image/heic' || photo.type === 'image/heif' || photo.name.toLowerCase().includes('.heic')) {
      try {
        outputBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.8
        }) as Buffer
      } catch (convertError) {
        // If conversion fails, save as is
        outputBuffer = inputBuffer
      }
    } else {
      // For other formats, save as is
      outputBuffer = inputBuffer
    }
    
    const { error: uploadError } = await supabase.storage
      .from('checkin-photos')
      .upload(filename, outputBuffer, {
        contentType: photo.type || 'image/jpeg',
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

    const photoUrl = data.publicUrl

    return NextResponse.json({ photoUrl })
  } catch (error: any) {
    console.error('Error processing photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process photo' },
      { status: 500 }
    )
  }
}
