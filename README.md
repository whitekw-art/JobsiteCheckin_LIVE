# Jobsite Check-In

A mobile-friendly Next.js web application for jobsite check-ins with GPS tracking and photo uploads.

## Features

- Mobile-optimized UI for field use
- Installer selection dropdown
- Job address and notes capture
- Photo capture/upload from device camera
- Automatic GPS coordinate capture
- Google Drive photo storage
- Google Sheets data logging

## Setup Instructions

### 1. Google Sheets Setup

1. Create a new Google Sheet or use an existing one
2. Add headers to the first row (optional but recommended):
   - Column A: Timestamp
   - Column B: Installer
   - Column C: Job Address
   - Column D: Notes
   - Column E: Latitude
   - Column F: Longitude
   - Column G: Photo URL

3. Copy the Google Sheet ID from the URL:
   - URL format: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Copy the `YOUR_SHEET_ID` part

### 2. Google Cloud Service Account Setup (For Vercel/Production)

Follow these steps to create a service account for production deployment:

#### A. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Jobsite Check-In")
4. Click "Create"

#### B. Enable Required APIs

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for and enable these APIs:
   - **Google Sheets API**
   - **Google Drive API**

#### C. Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Enter a name (e.g., "jobsite-checkin-service")
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

#### D. Generate and Download Service Account Key

1. In the Credentials page, find your service account and click on it
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create" - this will download a JSON file
6. **Keep this file secure!** It contains sensitive credentials

#### E. Share Google Sheet with Service Account

1. Open your downloaded JSON file and find the `client_email` field (e.g., `jobsite-checkin-service@your-project.iam.gserviceaccount.com`)
2. Open your Google Sheet
3. Click the "Share" button
4. Paste the service account email
5. Give it "Editor" permissions
6. Click "Send" (uncheck "Notify people" since it's a service account)

### 3. Environment Variables

#### For Local Development (Replit)

Create a `.env.local` file:

```env
GOOGLE_SHEET_ID=your_google_sheet_id_here
```

In Replit, the Google integrations handle authentication automatically, so you don't need the service account credentials for local development.

#### For Production (Vercel)

You'll need to add the service account credentials as an environment variable. **Important**: The JSON must be properly formatted as a single line with escaped newlines.

##### Formatting the Service Account JSON (Critical!)

When you download the service account JSON file from Google Cloud, it contains actual newline characters in the `private_key` field. These must be converted to escaped newlines (`\n`) for Vercel.

**Method 1: Using a text editor (Recommended)**
1. Open the downloaded JSON file in a text editor
2. The `private_key` field will look like this:
   ```
   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n...actual line breaks...\n-----END PRIVATE KEY-----\n"
   ```
3. **DO NOT modify the `\n` characters** - they should already be escaped as `\n` in the JSON
4. Convert the entire JSON to a single line by removing actual line breaks between fields (but keep the `\n` inside strings)
5. Copy the single-line JSON

**Method 2: Using command line**
```bash
cat your-service-account-key.json | tr -d '\n'
```

**What the final value should look like:**
```json
{"type":"service_account","project_id":"your-project","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n","client_email":"your-service@your-project.iam.gserviceaccount.com",...}
```

**Common mistakes to avoid:**
- ❌ Don't paste the multi-line JSON directly into Vercel
- ❌ Don't remove the `\n` characters from the private_key field
- ❌ Don't add extra quotes or escape characters
- ✅ DO ensure the JSON is a single line
- ✅ DO keep the `\n` sequences intact in the private_key field

### 4. Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### 5. Deploy to Vercel

#### Step-by-Step Deployment

1. **Push to Git**: Push your code to GitHub, GitLab, or Bitbucket

2. **Import to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Click "Add New" → "Project"
   - Import your repository

3. **Configure Environment Variables**:
   - In the Vercel project settings, go to "Environment Variables"
   - Add these variables:

   **Variable 1:**
   - Name: `GOOGLE_SHEET_ID`
   - Value: Your Google Sheet ID (e.g., `1abc123xyz...`)

   **Variable 2:**
   - Name: `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`
   - Value: Your service account JSON as a single line (see formatting instructions above)
   - **Note**: The `private_key` field must contain `\n` (escaped newlines), not actual line breaks
   - Example (truncated for readability):
     ```
     {"type":"service_account","project_id":"your-project","private_key":"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n","client_email":"your-service@example.iam.gserviceaccount.com"}
     ```

4. **Deploy**: Click "Deploy"

5. **Test**: Once deployed, test the application to ensure:
   - Form submissions work
   - Photos upload to Google Drive
   - Data appears in Google Sheets

## Usage

1. Select an installer from the dropdown
2. Enter the job address
3. Add any relevant notes
4. Capture or upload a photo
5. Click "Submit Check-In"

The app will automatically:
- Capture your current GPS coordinates
- Upload the photo to Google Drive
- Log all data to your Google Sheet

## Technology Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 3.4
- Google Sheets API
- Google Drive API

## Architecture Notes

The app supports two authentication modes:

1. **Replit Connectors** (Development): Uses Replit's built-in Google integrations for seamless local development
2. **Service Account** (Production): Uses Google Cloud service account credentials for Vercel and other deployments

The authentication layer automatically detects which mode to use based on available environment variables.

## Troubleshooting

### "Google Sheet not found" or "Permission denied" errors

- Make sure you've shared your Google Sheet with the service account email
- Verify the `GOOGLE_SHEET_ID` environment variable is correct

### Photos not uploading

- Ensure the Google Drive API is enabled in your Google Cloud project
- Check that the service account has the necessary permissions

### "Failed to parse GOOGLE_SERVICE_ACCOUNT_CREDENTIALS" error

- Make sure the JSON is properly formatted as a single line
- Verify there are no extra quotes or escape characters

## Security Notes

- Never commit the service account JSON file to your repository
- Keep your `.env.local` file in `.gitignore`
- The service account should only have access to the specific Google Sheet needed
- Consider using more restrictive Google Drive folder permissions for production

## License

MIT
