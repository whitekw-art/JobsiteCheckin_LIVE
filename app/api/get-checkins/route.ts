import { NextResponse } from 'next/server'
import { getUncachableGoogleSheetClient } from '@/lib/google-auth'

export async function GET() {
  try {
    const sheets = await getUncachableGoogleSheetClient()
    const sheetId = process.env.GOOGLE_SHEET_ID!

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:G',
    })

    const rows = response.data.values || []
    
    // Skip header row and convert to objects
    const checkIns = rows.slice(1).map(row => {
      const photoField = row[6] || ''
      const photoUrls = photoField
        ? photoField.split(',').map((url: string) => url.trim()).filter(Boolean)
        : []

      return {
        timestamp: row[0] || '',
        installer: row[1] || '',
        jobAddress: row[2] || '',
        notes: row[3] || '',
        latitude: row[4] || '',
        longitude: row[5] || '',
        photoUrls
      }
    }).reverse() // Show newest first

    return NextResponse.json({ checkIns })
  } catch (error: any) {
    console.error('Error fetching check-ins:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch check-ins' },
      { status: 500 }
    )
  }
}
