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

## Step 8: Submit Your App for Google Verification

### Why Verification is Needed

When users first sign in with Google OAuth to an unverified app, they'll see a warning screen saying "This app isn't verified". To remove this warning and provide a seamless user experience, you need to submit your app for Google's verification process.

**During development**: You can add test users in the OAuth consent screen to bypass the warning.

**For production**: You must complete the verification process.

### Verification Requirements

Before submitting for verification, ensure your app meets these requirements:

1. **Privacy Policy**: Must be publicly accessible
2. **Terms of Service**: Must be publicly accessible
3. **App Homepage**: Must be publicly accessible
4. **Valid Domain**: Must use a verified domain (not localhost)
5. **Branding**: App logo and branding information
6. **Scope Justification**: Clear explanation of why you need each OAuth scope

### Prepare Required Documents

1. **Create a Privacy Policy**:
   - Must explain what user data you collect (email, profile)
   - How the data is used (authentication, user identification)
   - How it's stored (your database)
   - User rights (data deletion, access)
   - Host it on your domain (e.g., `https://yourapp.com/privacy`)

2. **Create Terms of Service**:
   - User agreements for using your app
   - Host it on your domain (e.g., `https://yourapp.com/terms`)

3. **Prepare App Logo**:
   - 120x120 pixels minimum
   - Must represent your app
   - No Google branding

4. **Create YouTube Video** (required for verification):
   - Show your OAuth consent screen
   - Demonstrate how your app uses the requested scopes
   - Show the complete user flow from login to using the scopes
   - Can be unlisted (doesn't need to be public)
   - Typically 2-3 minutes long

### Verification Process

#### 1. Complete OAuth Consent Screen

Navigate to **Google Cloud Console > APIs & Services > OAuth consent screen**

**App Information**:
- App name: F1 Predictions (or your app name)
- User support email: Your support email
- App logo: Upload your 120x120px logo
- App domain:
  - Homepage: `https://yourapp.com`
  - Privacy policy: `https://yourapp.com/privacy`
  - Terms of service: `https://yourapp.com/terms`
- Authorized domains: Add your production domain(s)

**Scopes**:
- Click "Add or Remove Scopes"
- Add these scopes:
  - `../auth/userinfo.email` - See your primary Google Account email address
  - `../auth/userinfo.profile` - See your personal info, including any personal info you've made publicly available
  - `openid` - Associate you with your personal info on Google
- Save the scopes

**Test Users** (optional for development):
- Add test user email addresses
- These users can access your app without seeing the unverified warning

#### 2. Submit for Verification

1. **Start Verification**:
   - On the OAuth consent screen page, look for "Publish App" or "Submit for Verification" button
   - Click to start the verification process

2. **Fill Out the Verification Form**:

   **Contact Information**:
   - Official app name
   - Developer/company contact email
   - Developer/company phone number

   **App Details**:
   - App description (what your app does)
   - Target audience
   - Category (Social & Communication or Entertainment)

   **Scope Justification**:
   - For each scope, explain why it's needed:
     - `userinfo.email`: "Required to create user accounts and identify users uniquely"
     - `userinfo.profile`: "Required to display user's name and provide personalized experience"
     - `openid`: "Required for authentication and user identity verification"

   **Demo Video**:
   - Upload or link to your YouTube video
   - Video should show:
     1. Your OAuth consent screen
     2. User clicking "Allow"
     3. App receiving and using the user data (email for registration/login)
     4. Normal app usage showing the user is authenticated

   **Additional Documentation**:
   - Link to your privacy policy
   - Link to your terms of service
   - Any additional security/compliance documentation

3. **Submit Application**:
   - Review all information
   - Click "Submit for Verification"
   - You'll receive a confirmation email

#### 3. Verification Timeline

- **Initial Response**: 3-5 business days
- **Review Process**: 4-6 weeks (can vary)
- **Additional Questions**: Google may request clarifications or additional information

#### 4. Common Reasons for Rejection

- **Insufficient scope justification**: Be very specific about why you need each scope
- **Missing or inadequate privacy policy**: Must be comprehensive and hosted on your domain
- **Poor demo video**: Must clearly show all OAuth flows and data usage
- **Domain verification issues**: Ensure all domains are verified in Google Search Console
- **Vague app description**: Be specific about what your app does

### During the Review Period

While waiting for verification:

1. **Add Test Users**: Add your users' emails as test users so they can use the app without warnings
2. **Use Development Mode**: Keep your app in development/testing mode
3. **Monitor Email**: Watch for requests from Google for additional information
4. **Be Responsive**: Reply quickly to any Google requests (within 3 days)

### After Verification

Once approved:

1. You'll receive a confirmation email
2. The "unverified app" warning will be removed for all users
3. Your app will show as "Verified by Google"
4. Users will see your app name and logo on the consent screen
5. Higher user trust and conversion rates

### If Verification is Denied

1. **Read the Feedback**: Google will explain why it was denied
2. **Make Corrections**: Fix the issues mentioned
3. **Resubmit**: You can resubmit after making changes
4. **Appeal**: If you believe the denial was in error, you can appeal the decision

### Alternative: Sensitive Scopes

If you only need basic profile and email (which we do), the verification is straightforward. However, if you needed sensitive scopes (like Gmail or Drive access), the verification process is more stringent and may require:

- Annual security assessment
- Security questionnaire
- Proof of security compliance
- Additional documentation

For F1 Predictions, we only use basic scopes, so this doesn't apply.

### Development vs Production

**Development (Unverified)**:
- Users see "This app isn't verified" warning
- Can add up to 100 test users
- Good for testing and private use
- No verification required

**Production (Verified)**:
- No warning for users
- Unlimited users
- Professional appearance
- Required for public apps

### Useful Resources

- [Google OAuth Verification Guide](https://support.google.com/cloud/answer/9110914)
- [OAuth Consent Screen Configuration](https://support.google.com/cloud/answer/10311615)
- [OAuth App Verification FAQ](https://support.google.com/cloud/answer/9110914)
- [Privacy Policy Requirements](https://support.google.com/cloud/answer/9110914#privacy-policy)

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
