# Setup Guide for Ace It AI

## ✅ Completed Steps

1. ✅ Dependencies installed (`npm install`)
2. ✅ Prisma client generated
3. ✅ `.env` file created with template values

## 🔧 Required Configuration

Before running the application, you need to configure the following in your `.env` file:

### 1. Database Setup (PostgreSQL)

You need a PostgreSQL database. Update `DATABASE_URL` in `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
```

**Options:**
- Install PostgreSQL locally
- Use a cloud service (Supabase, Neon, Railway, etc.)
- Use Docker: `docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres`

After setting up the database, run migrations:
```bash
npx prisma migrate deploy
```

### 2. Google OAuth Setup (for Authentication)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy the Client ID and Client Secret to `.env`:
   ```env
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 3. Google AI API Key (for Gemini AI)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to `.env`:
   ```env
   GOOGLE_API_KEY="your-api-key"
   ```

### 4. NextAuth Secret

Generate a random secret for session encryption:
```bash
# On Windows PowerShell:
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)))

# Or use an online generator: https://generate-secret.vercel.app/32
```

Update in `.env`:
```env
NEXTAUTH_SECRET="your-generated-secret-here"
```

## 🚀 Running the Application

Once all environment variables are configured:

1. **Run database migrations** (if not done already):
   ```bash
   npx prisma migrate deploy
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000`

## 📝 Notes

- The application uses Next.js 15 with Turbopack for faster development
- Make sure PostgreSQL is running before starting the app
- All API keys should be kept secure and never committed to version control

## 🐛 Troubleshooting

- **Database connection errors**: Verify PostgreSQL is running and `DATABASE_URL` is correct
- **OAuth errors**: Check that redirect URI matches exactly in Google Cloud Console
- **API errors**: Verify `GOOGLE_API_KEY` is valid and has proper permissions

