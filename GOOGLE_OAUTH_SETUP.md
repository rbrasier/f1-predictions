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

## Step 8: Verify the Setup

After setting up Google OAuth, verify everything is working correctly:

### 1. Test New User Registration

1. **Navigate to Register Page**:
   - Go to `http://localhost:4000/register`
   - You should see only the "Sign up with Google" button (no legacy registration form)

2. **Complete OAuth Flow**:
   - Click "Sign up with Google"
   - You should be redirected to Google's OAuth consent screen
   - Grant permissions to the app
   - You should be redirected back to your app

3. **Set Display Name**:
   - After successful OAuth, you should see a modal asking for your display name
   - Enter a display name (this is required for new OAuth users)
   - Click "Continue"

4. **Verify Account Creation**:
   - You should be redirected to the dashboard
   - Check that your display name appears correctly
   - Verify you can access protected routes

### 2. Test Invite Code Flow

1. **Create an Invite Link**:
   - Create a league and get its invite code
   - Create an invite URL: `http://localhost:4000/register?invite=YOUR_CODE`

2. **Register with Invite Code**:
   - Open the invite URL in an incognito/private window
   - You should see a green banner showing the league you're joining
   - Complete Google OAuth
   - Set your display name
   - Verify you're automatically added to the league

### 3. Test Existing User Login

1. **Legacy Login (for existing users)**:
   - Go to `http://localhost:4000/login`
   - Click "Use legacy login (username & password)"
   - Enter your username and password
   - Verify you can log in successfully

2. **OAuth Transition Modal**:
   - After logging in with legacy credentials, you should see a modal prompting you to link Google account (if not already linked)
   - Test the "Remind Me Later" button (sets 2-day snooze)
   - Test the "Dismiss" button (closes modal without snoozing)
   - Test linking your Google account

### 4. Verify Backend Integration

Check your backend logs to ensure:

```bash
# Start backend with logs
cd backend
npm run dev
```

Look for:
- ✅ "Created all database tables" (migration ran successfully)
- ✅ Google OAuth requests hitting `/api/auth/google`
- ✅ Successful redirects to `/api/auth/google/callback`
- ✅ User creation with temporary display names (ending in `_temp`)
- ✅ Display name updates after user sets it

### 5. Database Verification

Connect to your database and verify the schema:

```sql
-- Check users table has OAuth columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('google_id', 'google_email', 'oauth_snooze_until');

-- Check a newly created OAuth user
SELECT id, username, display_name, google_id, google_email, password_hash
FROM users
WHERE google_id IS NOT NULL
LIMIT 1;

-- Verify password_hash is NULL for OAuth-only users
```

### 6. Test Edge Cases

1. **Duplicate Email**: Try to register with Google using an email that already exists (should show account linking prompt)
2. **Network Failure**: Disconnect network during OAuth flow (should show appropriate error)
3. **Cancel OAuth**: Click "Cancel" on Google's consent screen (should redirect with error)
4. **Invalid Invite Code**: Try `http://localhost:4000/register?invite=INVALID` (should still allow registration but show code)

### 7. Check Google Cloud Console

1. Navigate to Google Cloud Console > APIs & Services > Credentials
2. Click on your OAuth 2.0 Client ID
3. Verify:
   - Authorized JavaScript origins include your local and production URLs
   - Authorized redirect URIs include your callback URLs
   - No typos in URLs (common cause of issues)

### Verification Checklist

- [ ] New users can register with Google OAuth only
- [ ] Display name modal appears for new OAuth users
- [ ] Invite codes work with OAuth registration
- [ ] Existing users can login with username/password
- [ ] OAuth transition modal appears for legacy users
- [ ] Snooze functionality works (2-day interval)
- [ ] Users can link Google account to existing account
- [ ] Backend logs show successful OAuth flows
- [ ] Database has correct OAuth columns
- [ ] Google Cloud Console URLs are configured correctly

## Features

### For New Users
- **OAuth-Only Registration**: New users can only sign up via Google OAuth (no username/password option on register page)
- **Display Name Selection**: After first OAuth login, users are prompted to choose their display name
- **Automatic Account Creation**: Account is created automatically with Google email as username
- **Invite Code Support**: Invite codes work seamlessly with OAuth registration
- **No Password Required**: OAuth users don't need to remember passwords

### For Existing Users
- **Legacy Login Available**: Existing users can continue using username/password via "Use legacy login" link
- **OAuth Migration Prompt**: Legacy users see a modal prompting them to link Google account
- **Flexible Snoozing**: Users can snooze the migration notification for 2-day intervals
- **Dual Authentication**: Once linked, users can log in with either Google or username/password
- **Gradual Migration**: No forced migration - users choose when to transition

### Authentication Flow
1. **Register Page**: OAuth-only (Google button only)
2. **Login Page**: OAuth primary, with toggle to legacy login for existing users
3. **Display Name**: Required step after first OAuth login
4. **League Selection**: Shown after display name is set (if no league via invite)
5. **Dashboard**: Full access after completing setup

### Legacy Login
- Available on login page via "Use legacy login (username & password)" link
- Preserved for backward compatibility with existing users
- Invite code functionality works with both OAuth and legacy methods

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
