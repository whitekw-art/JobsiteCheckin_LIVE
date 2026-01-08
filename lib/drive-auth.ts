import { google } from 'googleapis'

export async function getDriveClientWithDelegation(userEmail: string) {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS!)
  
  const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/drive.file'],
    userEmail // Impersonate this user
  )

  return google.drive({ version: 'v3', auth })
}