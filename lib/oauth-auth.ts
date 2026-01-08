import { google } from 'googleapis'

export function getOAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NODE_ENV === 'production' 
      ? `${process.env.VERCEL_URL}/api/auth/callback`
      : 'http://localhost:3000/api/auth/callback'
  )

  return oauth2Client
}

export async function getDriveClient(accessToken: string) {
  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ access_token: accessToken })
  
  return google.drive({ version: 'v3', auth: oauth2Client })
}