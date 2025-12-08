# PDF Export Fix for Render.com

## Problem
PDF export works on localhost but fails on Render.com with error:
```
Could not find Chrome (ver. 141.0.7390.54)
```

## Root Cause
Puppeteer can't find the Chrome executable on Render.com because:
1. The cache directory path might be different
2. Chrome might not be installed during build
3. The executable path isn't being detected correctly

## Solution Applied

### Code Changes
- ✅ Added automatic Chrome detection for Render.com
- ✅ Added fallback Chrome installation if not found
- ✅ Improved path detection for different Chrome installation structures
- ✅ Better error handling and logging

### Files Modified
- ✅ `src/app/api/export-pdf/route.ts`

## Render.com Environment Variables

To ensure PDF export works on Render.com, set these environment variables:

### Required (if not already set):
```
PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer
```

### Optional (if you want to specify Chrome path directly):
```
PUPPETEER_EXECUTABLE_PATH=/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux/chrome
```

## How to Set Environment Variables on Render.com

1. Go to your Render.com dashboard
2. Select your service
3. Go to **Environment** tab
4. Add the environment variable:
   - **Key:** `PUPPETEER_CACHE_DIR`
   - **Value:** `/opt/render/.cache/puppeteer`
5. Save changes
6. Redeploy your service

## How It Works Now

1. **Checks environment variable** `PUPPETEER_EXECUTABLE_PATH` first
2. **If on Render.com**, looks for Chrome in `/opt/render/.cache/puppeteer`
3. **Searches multiple possible paths** where Chrome might be installed
4. **If not found**, automatically installs Chrome using `@puppeteer/browsers`
5. **Sets the executable path** for Puppeteer to use

## Testing

After deploying:
1. ✅ Try exporting a PDF from a presentation
2. ✅ Check Render.com logs for Chrome detection messages
3. ✅ PDF should download successfully

## Troubleshooting

### If PDF export still fails:

1. **Check Render.com logs** for Chrome-related errors
2. **Verify environment variable** is set correctly
3. **Check build logs** to ensure `postinstall` script ran:
   ```
   npx puppeteer browsers install chrome
   ```
4. **Manually set executable path** if needed:
   ```
   PUPPETEER_EXECUTABLE_PATH=/opt/render/.cache/puppeteer/chrome/linux-*/chrome-linux/chrome
   ```

### If Chrome installation fails:

The code will automatically try to install Chrome if it's not found. If this fails, you may need to:
- Check Render.com disk space
- Verify network access during build
- Check Render.com build logs for installation errors

## What's Protected

- ✅ Supabase Auth system - **NOT TOUCHED**
- ✅ User database - **NOT TOUCHED**
- ✅ Subscription system - **NOT TOUCHED**
- ✅ Prisma schema - **NOT TOUCHED**
- ✅ Presentation system - **NOT TOUCHED**
- ✅ Image generation - **NOT TOUCHED**

Only the PDF export Chrome detection logic was updated.

