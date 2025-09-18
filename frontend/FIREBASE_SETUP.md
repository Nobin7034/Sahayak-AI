# Firebase Google Sign-In Setup Guide

This guide will help you set up Firebase Authentication with Google sign-in for your React application.

## Prerequisites

1. A Google account
2. A Firebase project

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "sahayak-ai")
4. Follow the setup wizard (you can disable Google Analytics for now)
5. Once created, you'll be taken to the project dashboard

## Step 2: Enable Google Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click on the **Sign-in method** tab
3. Find **Google** in the provider list and click on it
4. Click **Enable**
5. You'll be asked to provide a **Project support email** - select your email
6. Click **Save**

## Step 3: Get Firebase Configuration

1. In your Firebase project, click on the gear icon (⚙️) next to "Project Overview" and select **Project settings**
2. Scroll down to the **Your apps** section
3. Click on the **Web app icon** (</>) to add a web app
4. Enter an app nickname (e.g., "sahayak-ai-frontend")
5. **Important:** Check the box for **"Also set up Firebase Hosting"** (optional but recommended)
6. Click **Register app**
7. You'll see your Firebase configuration object with these keys:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
   - `measurementId` (optional)

## Step 4: Update Environment Variables

1. Open your `.env` file in the frontend directory
2. Replace the placeholder values with your actual Firebase configuration:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_actual_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_actual_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_actual_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_actual_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_actual_measurement_id_here
```

## Step 5: Configure Authorized Domains

1. In Firebase Console, go to **Authentication** > **Settings** (gear icon)
2. In the **Authorized domains** section, add:
   - `localhost` (for development)
   - Your production domain (e.g., `yourdomain.com`)
3. Click **Add domain** for each

## Step 6: Install Firebase (if not already done)

Run this command in your frontend directory:

```bash
npm install firebase
```

## Step 7: Backend Setup

Your backend needs to handle the Firebase Google sign-in. Make sure your backend has an endpoint `/api/auth/google-signin` that:

1. Verifies the Firebase ID token
2. Creates or finds the user in your database
3. Returns a JWT token for your app

Example backend endpoint structure:
```javascript
app.post('/api/auth/google-signin', async (req, res) => {
  try {
    const { idToken, email, name, firebaseUid } = req.body;

    // Verify Firebase token
    // Create/find user in database
    // Generate your app's JWT token
    // Return success with token and user data
  } catch (error) {
    // Handle errors
  }
});
```

## Step 8: Test the Integration

1. Start your React development server: `npm run dev`
2. Try signing in with Google
3. Check the browser console for any errors
4. Verify that the user is properly authenticated

## Troubleshooting

### Common Issues:

1. **"Invalid domain" error**: Make sure your development server is running on an authorized domain
2. **Firebase config not loading**: Check that environment variables are prefixed with `VITE_` and restart your dev server
3. **Backend errors**: Ensure your backend endpoint is properly implemented and running
4. **CORS issues**: Configure CORS in your backend to allow requests from your frontend domain

### Debug Steps:

1. Check browser console for Firebase errors
2. Verify Firebase configuration in `.env`
3. Test Firebase connection by checking if `auth` object is initialized
4. Check network tab for API calls to your backend

## Security Notes

- Never commit your `.env` file to version control
- Use environment-specific Firebase projects (dev/staging/prod)
- Regularly rotate your Firebase API keys if compromised
- Implement proper error handling for authentication failures

## Next Steps

Once Google sign-in is working, you can:
- Add other Firebase auth providers (Facebook, GitHub, etc.)
- Implement email verification
- Add password reset functionality
- Set up Firebase Cloud Functions for serverless backend logic