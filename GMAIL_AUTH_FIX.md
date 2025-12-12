# Gmail Authentication Fix Guide

## 🔴 Error: "Email authentication failed. Please check Gmail credentials and ensure you are using an App Password (not your regular password)."

This error occurs when Gmail SMTP authentication fails. Follow these steps to fix it:

---

## Step 1: Enable 2-Step Verification on Your Google Account

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Under "Signing in to Google", find **2-Step Verification**
4. Click **Get started** and follow the prompts to enable it
5. **Important**: You MUST enable 2-Step Verification before you can generate an App Password

---

## Step 2: Generate a Gmail App Password

1. Go directly to: https://myaccount.google.com/apppasswords
   - If you don't see this page, make sure 2-Step Verification is enabled first
2. Under "Select app", choose **Mail**
3. Under "Select device", choose **Other (Custom name)**
4. Type: **"Election System"** (or any name you prefer)
5. Click **Generate**
6. **Copy the 16-character password** that appears (it will look like: `abcd efgh ijkl mnop`)
   - **Important**: Remove all spaces when copying (should be 16 characters with NO spaces)
   - Example: `abcdefghijklmnop` (16 characters, no spaces)

---

## Step 3: Set Environment Variables

### For Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

**Important Notes:**
- Use your **full Gmail address** (e.g., `yourname@gmail.com`)
- Use the **16-character App Password** (no spaces)
- Do NOT use your regular Gmail password
- Restart your development server after updating

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - **Name**: `GMAIL_USER`
     - **Value**: `your-email@gmail.com`
     - **Environment**: Production, Preview, Development (select all)
   - **Name**: `GMAIL_APP_PASSWORD`
     - **Value**: `abcdefghijklmnop` (your 16-character app password)
     - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add:
   - **Key**: `GMAIL_USER`
     - **Value**: `your-email@gmail.com`
     - **Scopes**: Select all (Production, Deploy previews, Branch deploys)
   - **Key**: `GMAIL_APP_PASSWORD`
     - **Value**: `abcdefghijklmnop` (your 16-character app password)
     - **Scopes**: Select all (Production, Deploy previews, Branch deploys)
5. Click **Save**
6. **Trigger a new deploy** for changes to take effect

---

## Step 4: Verify Configuration

### Check Environment Variables Format

✅ **Correct:**
```
GMAIL_USER="yourname@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

❌ **Wrong:**
```
GMAIL_USER="yourname@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"  # Has spaces
GMAIL_APP_PASSWORD="your-regular-password"  # Using regular password
GMAIL_USER="yourname"  # Missing @gmail.com
```

### Test Gmail SMTP Connection (Local Only)

If you have the test script, run:
```bash
node test-gmail-login.js
```

This will verify your Gmail credentials are working correctly.

---

## Common Issues & Solutions

### Issue 1: "App Password not available"
**Solution**: Enable 2-Step Verification first. App Passwords are only available after 2-Step Verification is enabled.

### Issue 2: "Authentication failed" even with correct credentials
**Solutions**:
- Make sure you're using the **App Password**, not your regular Gmail password
- Remove all spaces from the App Password (should be exactly 16 characters)
- Verify the email address in `GMAIL_USER` matches the account where you generated the App Password
- Check if the App Password was revoked (generate a new one)

### Issue 3: "Environment variables not found"
**Solutions**:
- Verify variables are set in your deployment platform (Vercel/Netlify)
- Make sure you **redeployed** after adding environment variables
- For local development, check `.env.local` exists and has correct values
- Restart your development server after updating `.env.local`

### Issue 4: "Still getting error after fixing"
**Solutions**:
- Wait a few minutes for changes to propagate
- Clear your browser cache
- Try generating a **new App Password** (old one might be revoked)
- Check server logs for more detailed error messages

---

## Verification Checklist

- [ ] 2-Step Verification is enabled on Google Account
- [ ] App Password generated (16 characters, no spaces)
- [ ] `GMAIL_USER` set to full email address (e.g., `yourname@gmail.com`)
- [ ] `GMAIL_APP_PASSWORD` set to 16-character App Password (no spaces)
- [ ] Environment variables added to deployment platform (Vercel/Netlify)
- [ ] Application redeployed after adding environment variables
- [ ] Tested email sending functionality

---

## Still Having Issues?

1. **Check Server Logs**: Look for detailed error messages in your deployment platform logs
2. **Verify App Password**: Generate a new App Password and update environment variables
3. **Test Locally**: Try running the application locally with `.env.local` to isolate the issue
4. **Contact Support**: If the issue persists, check your deployment platform's documentation for environment variable configuration

---

## Quick Reference

- **Gmail App Passwords**: https://myaccount.google.com/apppasswords
- **2-Step Verification**: https://myaccount.google.com/security
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Netlify Environment Variables**: https://docs.netlify.com/environment-variables/overview/

