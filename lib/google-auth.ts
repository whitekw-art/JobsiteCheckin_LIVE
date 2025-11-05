import { google } from 'googleapis';

let sheetConnectionSettings: any;
let driveConnectionSettings: any;

function getServiceAccountCredentials() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  
  if (!credentials) {
    return null;
  }

  try {
    const parsed = JSON.parse(credentials);
    
    if (!parsed.type || !parsed.project_id || !parsed.private_key || !parsed.client_email) {
      throw new Error('Service account credentials are missing required fields (type, project_id, private_key, client_email)');
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS:', error);
    console.error('Ensure the credentials are valid JSON with escaped newlines (\\n) in the private_key field.');
    console.error('The JSON should be formatted as a single line with no actual line breaks.');
    throw new Error(`Invalid GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getSheetAccessToken() {
  if (sheetConnectionSettings && sheetConnectionSettings.settings.expires_at && new Date(sheetConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return sheetConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  sheetConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = sheetConnectionSettings?.settings?.access_token || sheetConnectionSettings.settings?.oauth?.credentials?.access_token;

  if (!sheetConnectionSettings || !accessToken) {
    throw new Error('Google Sheet not connected');
  }
  return accessToken;
}

async function getDriveAccessToken() {
  if (driveConnectionSettings && driveConnectionSettings.settings.expires_at && new Date(driveConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return driveConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  driveConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = driveConnectionSettings?.settings?.access_token || driveConnectionSettings.settings?.oauth?.credentials?.access_token;

  if (!driveConnectionSettings || !accessToken) {
    throw new Error('Google Drive not connected');
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const serviceAccountCreds = getServiceAccountCredentials();

  if (serviceAccountCreds) {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountCreds,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    return google.sheets({ version: 'v4', auth });
  }

  const accessToken = await getSheetAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function getUncachableGoogleDriveClient() {
  const serviceAccountCreds = getServiceAccountCredentials();

  if (serviceAccountCreds) {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountCreds,
      scopes: [
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    return google.drive({ version: 'v3', auth });
  }

  const accessToken = await getDriveAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}
