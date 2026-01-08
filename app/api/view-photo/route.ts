import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filename = searchParams.get('filename')
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename required' }, { status: 400 })
    }

    const filepath = path.join(process.cwd(), 'public', 'temp-photos', filename)
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    const buffer = fs.readFileSync(filepath)
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'inline'
      }
    })
  } catch (error: any) {
    console.error('Error viewing photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to view photo' },
      { status: 500 }
    )
  }
}