import { NextRequest, NextResponse } from 'next/server'
import { getUncachableGoogleDriveClient } from '@/lib/google-auth'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const photo = formData.get('photo') as File

    if (!photo) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 })
    }

    const drive = await getUncachableGoogleDriveClient()

    const arrayBuffer = await photo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const stream = Readable.from(buffer)

    const fileMetadata = {
      name: `jobsite-${Date.now()}-${photo.name}`,
    }

    const media = {
      mimeType: photo.type,
      body: stream,
    }

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    })

    await drive.permissions.create({
      fileId: file.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    })

    const photoUrl = `https://drive.google.com/file/d/${file.data.id}/view`

    return NextResponse.json({ photoUrl })
  } catch (error: any) {
    console.error('Error uploading photo:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    )
  }
}
