# Stripe CLI Setup for Windows

## Step 1: Download the Correct File

You need the **compiled Windows executable**, not the source code.

1. Go to: https://github.com/stripe/stripe-cli/releases/latest
2. Download the file: `stripe_X.X.X_windows_x86_64.zip` (not the source code)
3. Extract the ZIP file
4. You should see `stripe.exe` inside

## Step 2: Add to PATH (Recommended)

### Option A: Add to PATH Permanently

1. **Copy the folder path** where `stripe.exe` is located
   - Example: `C:\Users\92324\Downloads\stripe-cli-1.33.0\stripe.exe`

2. **Add to PATH**:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "User variables", find "Path" and click "Edit"
   - Click "New" and paste the folder path (the folder containing stripe.exe)
   - Click "OK" on all dialogs
   - **Restart your terminal/PowerShell**

3. **Verify**:
   ```powershell
   stripe --version
   ```

### Option B: Use Full Path (Quick Test)

You can use the full path without adding to PATH:

```powershell
# Replace with your actual path
C:\Users\92324\Downloads\stripe-cli-1.33.0\stripe.exe --version
```

## Step 3: Login to Stripe CLI

Once you can run `stripe` (or the full path), login:

```powershell
stripe login
```

Or with full path:
```powershell
C:\Users\92324\Downloads\stripe-cli-1.33.0\stripe.exe login
```

This will:
1. Show a pairing code
2. Open your browser
3. Ask you to authenticate

## Step 4: Forward Webhooks to Local Server

After logging in, start webhook forwarding:

```powershell
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Or with full path:
```powershell
C:\Users\92324\Downloads\stripe-cli-1.33.0\stripe.exe listen --forward-to localhost:3000/api/stripe-webhook
```

## Step 5: Copy Webhook Secret

When you run `stripe listen`, you'll see output like:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copy this secret** and add it to your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## Quick Setup Script

If you want to use it without adding to PATH, create a batch file:

1. Create `stripe-cli.bat` in your project root:
   ```batch
   @echo off
   C:\Users\92324\Downloads\stripe-cli-1.33.0\stripe.exe %*
   ```

2. Then you can run:
   ```powershell
   .\stripe-cli.bat login
   .\stripe-cli.bat listen --forward-to localhost:3000/api/stripe-webhook
   ```

## Troubleshooting

### "stripe is not recognized"

- Make sure you added the folder to PATH
- Restart your terminal after adding to PATH
- Or use the full path to stripe.exe

### "Access Denied" or Antivirus Warning

- Windows Defender may flag it as unsafe (false positive)
- Add an exception in Windows Defender
- Or download from the official GitHub releases page

### Can't Find stripe.exe

- Make sure you downloaded the **Windows ZIP** (not source code)
- Look for `stripe_X.X.X_windows_x86_64.zip`
- Extract and find `stripe.exe` inside

## Next Steps

Once webhook forwarding is running:

1. ✅ Keep the terminal window open (it needs to stay running)
2. ✅ Start your dev server: `pnpm dev`
3. ✅ Test subscription flow
4. ✅ Watch webhook events in the Stripe CLI terminal

