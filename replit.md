# Jobsite Check-In Application

## Overview
A mobile-friendly Next.js web application for jobsite check-ins with GPS tracking and photo uploads. The app integrates with Google Sheets for data logging and Google Drive for photo storage.

## Project Status
- **Created**: November 5, 2025
- **Current Phase**: Initial development complete, pending Google Sheet ID configuration and testing

## Recent Changes
- November 5, 2025: Initial project setup with Next.js 16, React 19, TypeScript, and Tailwind CSS 3.4
- Implemented mobile-first check-in form with installer selection, job address, notes, and photo upload
- Created API routes for Google Drive photo upload and Google Sheets data submission
- Configured Google Sheets and Google Drive integrations via Replit connectors
- Fixed Tailwind CSS compatibility issue (downgraded from v4 to v3.4)
- Fixed viewport configuration warning in Next.js 16
- **Updated authentication layer** to support both Replit connectors (dev) and Google service account credentials (production)
- Added comprehensive Vercel deployment documentation with step-by-step service account setup

## Project Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 3.4
- **Backend**: Next.js API Routes (serverless functions)
- **APIs**: Google Sheets API, Google Drive API
- **Deployment**: Configured for Vercel

### Directory Structure
```
/
├── app/
│   ├── api/
│   │   ├── upload-photo/
│   │   │   └── route.ts          # Google Drive photo upload endpoint
│   │   └── submit-checkin/
│   │       └── route.ts          # Google Sheets data submission endpoint
│   ├── globals.css               # Tailwind CSS styles
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main check-in form (client component)
├── lib/
│   └── google-auth.ts            # Google API authentication helpers
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies and scripts
```

### Key Features
1. **Mobile-First UI**: Responsive design optimized for mobile devices
2. **Form Fields**: Installer dropdown, job address input, notes textarea, photo upload
3. **GPS Tracking**: Browser geolocation API captures latitude/longitude
4. **Photo Upload**: Direct upload to Google Drive with public sharing
5. **Data Logging**: Automatic Google Sheets row append with all check-in data
6. **Real-time Feedback**: Loading states and success/error messages

### Google Integrations
- **Google Sheets Connection**: `conn_google-sheet_01K9B0BN81ATQDJKZPN4TJWQ7Q`
  - Permissions: drive.file, spreadsheets.readonly, drive.appdata
- **Google Drive Connection**: `conn_google-drive_01K9B1Q7ZQ30RV442MWSC9574P`
  - Permissions: Full Drive access for file uploads and sharing

### Environment Variables Required
- `GOOGLE_SHEET_ID`: The ID of the Google Sheet where check-in data will be logged
  - Format: Extract from Sheet URL `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`
  - Example: `1abc123xyz456...`
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (Production only): JSON service account credentials for Vercel deployment
  - Format: Single-line JSON string from Google Cloud service account key file
  - Only required for production deployments outside Replit

### Google Sheet Format
Expected columns (row 1 headers recommended):
- Column A: Timestamp
- Column B: Installer
- Column C: Job Address
- Column D: Notes
- Column E: Latitude
- Column F: Longitude
- Column G: Photo URL

## Deployment Notes

### Running Locally (Replit)
1. Set `GOOGLE_SHEET_ID` environment variable
2. Workflow runs automatically on port 5000
3. Google integrations handle authentication automatically via Replit connectors

### Deploying to Vercel
The application now fully supports Vercel deployment:

1. **Authentication**: Dual-mode authentication automatically detects environment:
   - In Replit: Uses Replit connector tokens (no additional setup needed)
   - On Vercel: Uses Google service account credentials

2. **Required Setup**:
   - Create Google Cloud service account (see README.md for detailed steps)
   - Download service account JSON key
   - Share Google Sheet with service account email
   - Add environment variables to Vercel:
     - `GOOGLE_SHEET_ID`
     - `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (full JSON as single line)

3. **Deploy**: Standard Vercel deployment process works without code modifications

## Known Issues & Warnings
- Cross-origin request warning from Next.js (safe to ignore in Replit environment)
- Service account must be granted Editor access to the Google Sheet
- For mobile photo capture to work, site must be accessed via HTTPS (Vercel provides this automatically)

## Next Steps
- ✅ Google Sheet ID configured
- ✅ Application running and tested
- ✅ Vercel deployment support implemented
- Optional enhancements: Add installer management, offline support, admin dashboard
