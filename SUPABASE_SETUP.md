# Supabase Auth Setup Guide

## Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Database (keep your existing DATABASE_URL)
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"

# AI Services (keep your existing GEMINI_API_KEY)
GEMINI_API_KEY="your_gemini_api_key_here"

# Supabase Configuration (NEW - ADD THESE)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"

# Optional: Site URL for OAuth callbacks
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

## Supabase Project Setup

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Configure Authentication**
   - In your Supabase dashboard, go to Authentication > Settings
   - Enable Email authentication
   - Enable Google OAuth (optional)
   - Set up Google OAuth credentials if needed

3. **Configure OAuth Redirect URLs**
   - Add these redirect URLs in Supabase Auth settings:
     - `http://localhost:3000/auth/callback` (development)
     - `https://yourdomain.com/auth/callback` (production)

## Google OAuth Setup (Optional)

If you want to enable Google OAuth:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
6. Copy the Client ID and Client Secret to Supabase Auth settings

## Testing the Integration

1. **Start your development server:**
   ```bash
   pnpm dev
   ```

2. **Test Authentication:**
   - Visit `http://localhost:3000`
   - You should be redirected to `/auth/login`
   - Try creating an account with email/password
   - Test Google OAuth (if configured)

3. **Test AI Features:**
   - All AI features (Presentations, Flashcards, Lesson Planner, Lesson Generator, Diagram Generator) now require authentication
   - Make sure you can access them after logging in

## Migration Notes

- **NextAuth is still installed** but not being used
- **Your existing database schema is preserved**
- **All existing functionality should work** with the new authentication
- **Users will need to create new accounts** (existing NextAuth users won't be migrated automatically)

## Next Steps

1. Test all functionality thoroughly
2. Once confirmed working, you can remove NextAuth dependencies:
   ```bash
   pnpm remove next-auth @auth/prisma-adapter
   ```
3. Remove NextAuth-related files:
   - `src/server/auth.ts`
   - `src/provider/NextAuthProvider.tsx`
   - `src/app/api/auth/[...nextauth]/route.ts`
   - `check for the Export Presentation/src/app/auth/signin/page.tsx`

## Troubleshooting

- **"Unauthorized" errors**: Check that your Supabase environment variables are correct
- **OAuth redirect issues**: Verify redirect URLs in both Supabase and Google Console
- **API route errors**: Ensure all AI generation APIs are properly protected
- **Middleware issues**: Check that the middleware is properly configured

## Support

If you encounter any issues, check:
1. Supabase dashboard for authentication logs
2. Browser console for client-side errors
3. Server logs for API errors
4. Environment variables are properly set
