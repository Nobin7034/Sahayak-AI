# Google OAuth Setup Guide

## Fixing the "origin_mismatch" Error

If you're encountering the error: `Error 400: origin_mismatch` when trying to sign in with Google, follow these steps to fix it:

### 1. Configure Your Google Cloud Console Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Find your OAuth 2.0 Client ID and click on it to edit
5. Under **Authorized JavaScript origins**, add the following URLs:
   - `http://localhost:3000` (for local development)
   - `http://127.0.0.1:3000` (alternative local address)
   - Any other domains where your application will be hosted
6. Click **Save**

### 2. Verify Your Environment Variables

Make sure your `.env` or `.env.local` file contains the correct Google Client ID:

```
VITE_GOOGLE_CLIENT_ID=245496151346-k5ce3ci7n3llm9csgdun1khmmfr853uq.apps.googleusercontent.com
```

### 3. Development Server Configuration

Ensure your Vite development server is running on the same port that you configured in the Google Cloud Console:

```javascript
// vite.config.js
export default defineConfig({
  // ...
  server: {
    port: 3000,  // Must match the port in your authorized JavaScript origins
    // ...
  }
});
```

### 4. Browser Issues

If you're still experiencing issues:

- Clear your browser cache and cookies
- Try using an incognito/private browsing window
- Ensure you're not blocking third-party cookies

### 5. CORS and Security Headers

The application has been configured with the following security headers to allow Google's OAuth popup to work correctly:

```javascript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Embedder-Policy': 'require-corp'
}
```

## Troubleshooting

If you continue to experience issues, check the browser console for specific error messages. The application has been configured to log detailed information about the Google Sign-In process.