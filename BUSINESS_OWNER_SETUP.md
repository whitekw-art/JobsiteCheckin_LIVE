# Jobsite Check-In App - Business Owner Setup Guide

## What You'll Get
A mobile-friendly web app where your drivers/installers can:
- Select their name from a dropdown
- Enter job address and notes
- Take photos with GPS location
- Submit check-ins that automatically log to your Google Sheet

## Setup Steps

### 1. Create Google Shared Drive (5 minutes)
1. Go to [Google Drive](https://drive.google.com)
2. Click "New" → "Shared drive"
3. Name it "Jobsite Photos"
4. Click "Create"
5. **Copy the Shared Drive ID** from the URL:
   - URL will look like: `https://drive.google.com/drive/folders/1ABC123XYZ...`
   - Copy the ID part: `1ABC123XYZ...`

### 2. Share with Service Account
1. In your new "Jobsite Photos" shared drive, click "Manage members"
2. Click "Add members"
3. Add this email: `jobsite-service@job-site-check-in.iam.gserviceaccount.com`
4. Set role to "Content manager"
5. Click "Send" (uncheck "Notify people")

### 3. Create Your Google Sheet
1. Create a new Google Sheet
2. Add these headers in row 1:
   - A1: Timestamp
   - B1: Installer  
   - C1: Job Address
   - D1: Notes
   - E1: Latitude
   - F1: Longitude
   - G1: Photo URL
3. Share the sheet with: `jobsite-service@job-site-check-in.iam.gserviceaccount.com`
4. Give "Editor" permissions
5. **Copy your Sheet ID** from the URL:
   - URL: `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit`
   - Copy the `YOUR_SHEET_ID` part

### 4. Deploy the App
**Option A: I deploy for you (Recommended)**
- Send me your Sheet ID and Shared Drive ID
- I'll deploy and give you the app URL
- Your drivers bookmark the URL on their phones

**Option B: You deploy yourself**
1. Create free account at [Vercel.com](https://vercel.com)
2. Import the project from GitHub
3. Add these environment variables in Vercel:
   - `GOOGLE_SHEET_ID`: Your sheet ID
   - `GOOGLE_SHARED_DRIVE_ID`: Your shared drive ID  
   - `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`: (I'll provide this)

### 5. Driver Instructions
Once deployed, give your drivers:
1. The app URL (e.g., `yourcompany-checkin.vercel.app`)
2. Tell them to bookmark it on their phone home screen
3. It works like a native app - no app store needed

## What Happens When Drivers Check In
1. Driver selects their name, enters address/notes, takes photo
2. Photo automatically uploads to your "Jobsite Photos" shared drive
3. All data (including GPS coordinates) logs to your Google Sheet
4. You can view everything in real-time

## Costs
- **Google Drive**: Uses your existing Google storage
- **Vercel hosting**: Free tier (plenty for small business)
- **Total ongoing cost**: $0

## Support
If you need help with setup, I can walk you through it or handle the deployment for you.