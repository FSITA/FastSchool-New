# Mindmap AI - Setup Complete

## ✅ What Was Done

1. **Removed all other features:**
   - Deleted chat, quiz, flashcard, dashboard pages
   - Removed all related API routes
   - Cleaned up navigation and components

2. **Made Mindmap the main page:**
   - `localhost:3000` now shows the mindmap generator directly
   - No redirects or landing pages

3. **Kept essential components:**
   - Mindmap API routes (`/api/mindmap`)
   - Mindmap components and utilities
   - Minimal NextAuth setup (to avoid errors)
   - Guest context for guest users

## 🔑 Environment Variables Required

### For Mindmap Generation (Required):
- **`GOOGLE_API_KEY`** - Used by Google Gemini AI to generate mindmaps
  - Get from: https://makersuite.google.com/app/apikey

### For Authentication (Required to avoid errors):
- **`GOOGLE_CLIENT_ID`** - Google OAuth Client ID
- **`GOOGLE_CLIENT_SECRET`** - Google OAuth Client Secret
  - Get from: https://console.cloud.google.com/
  - Redirect URI: `http://localhost:3000/api/auth/callback/google`

### Optional (for authenticated users who want to save mindmaps):
- **`DATABASE_URL`** - PostgreSQL connection string
  - Only needed if users want to save mindmaps to database
  - Guest users can use the app without this (mindmaps saved in localStorage)

- **`NEXTAUTH_URL`** - Should be `http://localhost:3000`
- **`NEXTAUTH_SECRET`** - Random secret for session encryption

## 🚀 Running the App

1. **Minimum setup (Guest mode only):**
   ```env
   GOOGLE_API_KEY=your-api-key
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=any-random-string
   ```

2. **Start the server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

## 📝 Notes

- **Guest users:** Can generate 1 mindmap (stored in localStorage)
- **Authenticated users:** Can generate unlimited mindmaps (stored in database if DATABASE_URL is configured)
- The app will work in guest mode even without DATABASE_URL
- Authentication is optional but the env vars are required to avoid NextAuth errors

## 🎯 Features Available

- Generate mindmaps from any topic
- Upload PDF for context-aware mindmaps
- Edit mindmap structure
- Save/load mindmaps (localStorage for guests, database for authenticated users)
- Responsive design (mobile and desktop)
- Dark theme support

