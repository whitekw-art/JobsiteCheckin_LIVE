import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import convert from 'heic-convert'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const timestamp = Date.now()
    const filename = `jobsite-${timestamp}.jpg`
    const filepath = path.join(process.cwd(), 'public', 'temp-photos', filename)
    
    // Create temp-photos directory if it doesn't exist
    const dir = path.dirname(filepath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

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
    
    fs.writeFileSync(filepath, outputBuffer)

    const photoUrl = `/temp-photos/${filename}`

    return NextResponse.json({ photoUrl })
  } catch (error: any) {
    console.error('Error processing photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process photo' },
      { status: 500 }
    )
  }
}