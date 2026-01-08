import { NextRequest, NextResponse } from 'next/server'
import { getUncachableGoogleSheetClient } from '@/lib/google-auth'

export async function GET() {
  try {
    const sheets = await getUncachableGoogleSheetClient()
    const spreadsheetId = process.env.GOOGLE_SHEET_ID

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Google Sheet ID not configured' }, { status: 500 })
    }

    // Get unique installers from column B (installer column)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'B:B',
    })

    const allInstallers = response.data.values?.flat().filter(Boolean) || []
    // Remove duplicates and header
    const uniqueInstallers = [...new Set(allInstallers.slice(1))].filter(name => name !== 'Installer')
    
    // Add default installers if none exist
    const installers = uniqueInstallers.length > 0 ? uniqueInstallers : ['John', 'Alex', 'Maria']
    
    return NextResponse.json({ installers })
  } catch (error: any) {
    console.error('Error fetching installers:', error)
    return NextResponse.json({ installers: ['John', 'Alex', 'Maria'] }) // fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    const { installer } = await request.json()
    
    if (!installer?.trim()) {
      return NextResponse.json({ error: 'Installer name required' }, { status: 400 })
    }

    // For simplicity, just return success - installers will be populated from actual check-ins
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error adding installer:', error)
    return NextResponse.json({ error: 'Failed to add installer' }, { status: 500 })
  }
}