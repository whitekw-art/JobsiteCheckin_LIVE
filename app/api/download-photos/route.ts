import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

interface ZipFileEntry {
  name: string
  data: Buffer
}

function toDosDateTime(date: Date) {
  const year = Math.max(date.getFullYear() - 1980, 0)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = Math.floor(date.getSeconds() / 2)

  const dosDate = (year << 9) | (month << 5) | day
  const dosTime = (hours << 11) | (minutes << 5) | seconds

  return { dosDate, dosTime }
}

const crc32Table = new Uint32Array(256).map((_, i) => {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

function crc32(buffer: Buffer) {
  let crc = 0 ^ -1
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buffer[i]) & 0xff]
  }
  return (crc ^ -1) >>> 0
}

function createZipBuffer(files: ZipFileEntry[]) {
  const { dosDate, dosTime } = toDosDateTime(new Date())
  let offset = 0
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []

  for (const file of files) {
    const nameBuffer = Buffer.from(file.name)
    const size = file.data.length
    const crc = crc32(file.data)

    const localHeader = Buffer.alloc(30)
    localHeader.writeUInt32LE(0x04034b50, 0)
    localHeader.writeUInt16LE(20, 4)
    localHeader.writeUInt16LE(0, 6)
    localHeader.writeUInt16LE(0, 8)
    localHeader.writeUInt16LE(dosTime, 10)
    localHeader.writeUInt16LE(dosDate, 12)
    localHeader.writeUInt32LE(crc, 14)
    localHeader.writeUInt32LE(size, 18)
    localHeader.writeUInt32LE(size, 22)
    localHeader.writeUInt16LE(nameBuffer.length, 26)
    localHeader.writeUInt16LE(0, 28)

    const localPart = Buffer.concat([localHeader, nameBuffer, file.data])
    localParts.push(localPart)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0)
    centralHeader.writeUInt16LE(20, 4)
    centralHeader.writeUInt16LE(20, 6)
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(0, 10)
    centralHeader.writeUInt16LE(dosTime, 12)
    centralHeader.writeUInt16LE(dosDate, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(size, 20)
    centralHeader.writeUInt32LE(size, 24)
    centralHeader.writeUInt16LE(nameBuffer.length, 28)
    centralHeader.writeUInt16LE(0, 30)
    centralHeader.writeUInt16LE(0, 32)
    centralHeader.writeUInt16LE(0, 34)
    centralHeader.writeUInt32LE(0, 36)
    centralHeader.writeUInt32LE(offset, 42)

    const centralPart = Buffer.concat([centralHeader, nameBuffer])
    centralParts.push(centralPart)

    offset += localPart.length
  }

  const centralDirectory = Buffer.concat(centralParts)
  const endRecord = Buffer.alloc(22)
  endRecord.writeUInt32LE(0x06054b50, 0)
  endRecord.writeUInt16LE(0, 4)
  endRecord.writeUInt16LE(0, 6)
  endRecord.writeUInt16LE(files.length, 8)
  endRecord.writeUInt16LE(files.length, 10)
  endRecord.writeUInt32LE(centralDirectory.length, 12)
  endRecord.writeUInt32LE(offset, 16)
  endRecord.writeUInt16LE(0, 20)

  return Buffer.concat([...localParts, centralDirectory, endRecord])
}

export async function POST(request: NextRequest) {
  try {
    const { photoUrls, installer, timestamp } = await request.json()

    if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
      return NextResponse.json({ error: 'No photo URLs provided' }, { status: 400 })
    }

    const files: ZipFileEntry[] = []

    for (let i = 0; i < photoUrls.length; i++) {
      const url = photoUrls[i]
      if (typeof url !== 'string') continue

      const relativePath = url.replace(/^\/+/g, '')
      if (!relativePath.startsWith('temp-photos/')) {
        continue
      }

      const absolutePath = path.join(process.cwd(), 'public', relativePath)
      const data = await fs.readFile(absolutePath)
      const ext = path.extname(relativePath) || '.jpg'
      const safeInstaller = (installer || 'checkin').replace(/[^a-z0-9-]/gi, '_')
      const name = `${safeInstaller || 'checkin'}-${i + 1}${ext}`
      files.push({ name, data })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No downloadable files found' }, { status: 404 })
    }

    const zipBuffer = createZipBuffer(files)
    const safeInstaller = (installer || 'checkin').replace(/[^a-z0-9-]/gi, '_')
    const safeTimestamp = (timestamp || '').replace(/[^0-9]/g, '')
    const filename = `${safeInstaller || 'checkin'}-${safeTimestamp || Date.now()}.zip`

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error creating photo archive:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create download' },
      { status: 500 }
    )
  }
}
