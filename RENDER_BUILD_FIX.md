# Render.com Build Fix for PDF Export

## Problem
Chrome installation is failing at runtime with 404 error. Chrome should be installed during build, but Puppeteer can't find it at runtime.

## Solution

### 1. Ensure Chrome is Installed During Build

The `postinstall` script in `package.json` should install Chrome. Verify it runs during Render.com build by checking build logs.

### 2. Set Environment Variable on Render.com

Add this environment variable in Render.com dashboard:

**Key:** `PUPPETEER_CACHE_DIR`  
**Value:** `/opt/render/.cache/puppeteer`

This tells Puppeteer where to look for Chrome installed during build.

### 3. Alternative: Use System Chrome (if available)

If Render.com has Chrome installed system-wide, you can set:

**Key:** `PUPPETEER_EXECUTABLE_PATH`  
**Value:** `/usr/bin/google-chrome` (or wherever Chrome is installed)

## How to Set Environment Variables

1. Go to Render.com dashboard
2. Select your service
3. Go to **Environment** tab
4. Add the variable(s) above
5. Save and redeploy

## What Changed

- ✅ Removed runtime Chrome installation (was failing with 404)
- ✅ Code now searches for Chrome in common locations
- ✅ Relies on build-time installation via postinstall script
- ✅ Uses Puppeteer's built-in detection as fallback

## Testing

After setting environment variable and redeploying:
1. Check build logs to ensure `npx puppeteer browsers install chrome` runs
2. Try PDF export
3. Check runtime logs for Chrome detection messages

