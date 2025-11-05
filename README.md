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

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
GOOGLE_SHEET_ID=your_google_sheet_id_here
```

Replace `your_google_sheet_id_here` with your actual Google Sheet ID.

### 3. Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

### 4. Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your repository in [Vercel](https://vercel.com)
3. Add the environment variable:
   - Key: `GOOGLE_SHEET_ID`
   - Value: Your Google Sheet ID
4. Deploy!

**Important**: The Google Sheets and Google Drive integrations are configured through Replit. When deploying to Vercel, you'll need to set up your own Google Cloud credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable Google Sheets API and Google Drive API
4. Create OAuth 2.0 credentials
5. Update the authentication code in `lib/google-auth.ts` to use your credentials

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
- Tailwind CSS
- Google Sheets API
- Google Drive API

## License

MIT
