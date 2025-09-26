# Google OAuth Setup Instructions

## Current Issue
You're getting a Google OAuth 500 error because your Google OAuth credentials are not properly configured.

## Step-by-Step Setup

### 1. Go to Google Cloud Console
Visit: https://console.developers.google.com/

### 2. Create a New Project (if you don't have one)
- Click "Select a project" at the top
- Click "New Project"
- Name it something like "Manas App"
- Click "Create"

### 3. Enable Google+ API
- In the left sidebar, click "APIs & Services" > "Library"
- Search for "Google+ API" 
- Click on it and click "Enable"

### 4. Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" (unless you have a Google Workspace)
- Fill in the required fields:
  - App name: "Manas App"
  - User support email: your email
  - Developer contact information: your email
- Save and continue through all steps

### 5. Create OAuth 2.0 Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Choose "Web application"
- Name: "Manas App Client"
- Add authorized redirect URIs:
  - `http://localhost:3000/api/auth/callback/google`
  - `https://yourdomain.com/api/auth/callback/google` (for production)

### 6. Copy Your Credentials
After creating, you'll see:
- Client ID (looks like: 123456789-abcdefg.apps.googleusercontent.com)
- Client Secret (looks like: GOCSPX-abc123def456)

### 7. Update Your .env.local File
Replace the empty values in your `.env.local` file:

```bash
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

### 8. Restart Your Development Server
```bash
npm run dev
```

## Test Your Setup
1. Go to http://localhost:3000/auth/login
2. Click "Sign in with Google"
3. You should be redirected to Google's OAuth flow

## Common Issues
- Make sure your redirect URI exactly matches what you put in Google Console
- Ensure both CLIENT_ID and CLIENT_SECRET are set
- Restart your server after changing environment variables
- Check that your OAuth consent screen is properly configured

## Alternative: Disable Google OAuth Temporarily
If you want to test without Google OAuth, you can just use the email/password login which should work with your current setup.