# Image URL Fix - Deployment Guide

## Problem
Images were hardcoded to use `http://localhost:5000` URLs, which don't work when the project is hosted.

## Solution Applied

### 1. Frontend Changes
- Created `frontend/src/config/api.js` with dynamic URL configuration
- Updated all frontend components to use `getImageUrl()` helper function
- Components updated:
  - `NewsDetail.jsx`
  - `LandingPage.jsx` 
  - `News.jsx`
  - `AdminServices.jsx`

### 2. Backend Changes
- Updated `backend/routes/adminRoutes.js` to use environment variable for base URL
- Image URLs now use `process.env.BASE_URL` or fallback to request host

## Deployment Steps

### For Production Deployment:

1. **Set Environment Variables:**
   ```bash
   # Set these in your hosting platform (Vercel, Netlify, Heroku, etc.)
   NODE_ENV=production
   BASE_URL=https://yourdomain.com
   ```

2. **Frontend Build:**
   ```bash
   cd frontend
   npm run build
   ```

3. **Backend Deployment:**
   - Make sure your backend serves static files from the `uploads` directory
   - Ensure the `BASE_URL` environment variable is set to your production domain

### For Local Development:
- No changes needed - the system automatically uses `http://localhost:5000` in development mode

## How It Works

1. **Development:** Uses `http://localhost:5000` automatically
2. **Production:** Uses the `BASE_URL` environment variable or the request host
3. **Frontend:** The `getImageUrl()` function handles URL construction based on environment

## Testing

After deployment:
1. Upload a new image through the admin panel
2. Check that the image URL in the database uses your production domain
3. Verify images load correctly on the frontend

## Notes

- Existing images in the database will still have localhost URLs
- New uploads will use the correct production URLs
- If you need to fix existing images, you can run a database migration script


