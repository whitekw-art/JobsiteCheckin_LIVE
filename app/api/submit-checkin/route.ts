import { NextRequest, NextResponse } from 'next/server'
import { getUncachableGoogleSheetClient } from '@/lib/google-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { installer, jobAddress, notes, latitude, longitude, photoUrl } = body

    if (!installer || !jobAddress) {
      return NextResponse.json(
        { error: 'Installer and job address are required' },
        { status: 400 }
      )
    }

    const sheets = await getUncachableGoogleSheetClient()

    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured. Please set GOOGLE_SHEET_ID environment variable.' },
        { status: 500 }
      )
    }

    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    const values = [
      [
        timestamp,
        installer,
        jobAddress,
        notes || '',
        latitude.toString(),
        longitude.toString(),
        photoUrl || '',
      ],
    ]

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:G',
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error submitting check-in:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit check-in' },
      { status: 500 }
    )
  }
}
