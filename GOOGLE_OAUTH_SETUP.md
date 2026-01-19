# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the F1 Predictions application.

## Prerequisites

- A Google Cloud Platform account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" and then "New Project"
3. Name your project (e.g., "F1 Predictions")
4. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and enable it for your project

## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Choose "External" (unless you're using a workspace account)
3. Fill in the required fields:
   - App name: F1 Predictions
   - User support email: Your email
   - Developer contact email: Your email
4. Click "Save and Continue"
5. Add scopes (optional for basic authentication)
6. Click "Save and Continue"
7. Add test users (optional during development)
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Configure:
   - Name: F1 Predictions Web Client
   - Authorized JavaScript origins:
     - `http://localhost:4000` (for frontend dev server)
     - `http://localhost:5173` (alternative frontend dev port)
     - Add your production frontend URL
   - Authorized redirect URIs:
     - `http://localhost:4001/api/auth/google/callback` (for backend)
     - Add your production backend callback URL
5. Click "Create"
6. Copy your Client ID and Client Secret

## Step 5: Configure Environment Variables

### Backend (.env)

Create or update your `backend/.env` file:

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4001/api/auth/google/callback
FRONTEND_URL=http://localhost:4000
```

### Frontend (.env)

Create or update your `frontend/.env` file:

```bash
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_API_URL=http://localhost:4001/api
```

## Step 6: Run Database Migrations

The OAuth feature requires database changes. Run the migrations:

```bash
cd backend
npm run migrate
```

## Step 7: Test the Integration

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:4000/login`
4. Click "Sign in with Google"
5. Complete the Google OAuth flow

## Features

### For New Users
- New users can sign up directly with Google OAuth
- No password required
- Account is automatically created with Google email

### For Existing Users
- Existing users will see a modal prompting them to link their Google account
- Users can snooze the notification for 2 days
- Users can continue using legacy login (username & password) as a fallback
- Once linked, users can use either method to log in

### Legacy Login
- The traditional username/password login is still available
- Click "Use legacy login" on the login page to access it
- Invite code functionality is preserved for both OAuth and legacy login

## Production Deployment

### Update OAuth Credentials

1. Go back to Google Cloud Console > Credentials
2. Add your production URLs:
   - Authorized JavaScript origins: Your production frontend URL
   - Authorized redirect URIs: Your production backend callback URL

### Update Environment Variables

Update your production environment variables in Railway/Vercel/your hosting platform:

Backend:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL` (should be your production backend URL + `/api/auth/google/callback`)
- `FRONTEND_URL` (your production frontend URL)

Frontend:
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_URL` (your production backend URL + `/api`)

## Troubleshooting

### "Redirect URI mismatch" error
- Check that the callback URL in your Google Cloud Console matches exactly with your `GOOGLE_CALLBACK_URL` environment variable
- Include the protocol (http/https) and port number

### OAuth modal not showing
- Check that the database migration ran successfully
- Verify that the user doesn't already have a `google_id` set
- Check browser console for errors

### Can't login with Google
- Verify that Google+ API is enabled in Google Cloud Console
- Check that environment variables are set correctly
- Ensure the callback URL is whitelisted in Google Cloud Console

## Security Notes

- Never commit your `.env` files with real credentials to version control
- Use strong, unique client secrets
- In production, always use HTTPS
- Regularly rotate your OAuth credentials
- Monitor OAuth usage in Google Cloud Console
