# Zoho Mail SMTP Setup Guide

## Overview

The application now uses **Zoho Mail** for sending emails (OTP, notifications, etc.). This guide will help you configure Zoho Mail SMTP.

---

## Step 1: Enable 2-Factor Authentication (2FA) on Zoho Account

1. Go to your Zoho account: https://accounts.zoho.com/
2. Click on **Security** in the left sidebar
3. Find **Two-Factor Authentication** section
4. Click **Enable** and follow the prompts to set up 2FA
5. **Important**: You MUST enable 2FA before you can generate an App Password

---

## Step 2: Generate Zoho App Password

1. Go directly to: https://accounts.zoho.com/home#security/app-passwords
   - If you don't see this page, make sure 2FA is enabled first
2. Click **Generate New Password**
3. Enter a name for the app password (e.g., "Election System" or "SMTP Mail")
4. Click **Generate**
5. **Copy the app password** that appears
   - **Important**: Copy it immediately - you won't be able to see it again!
   - Remove any spaces if present

---

## Step 3: Determine Your SMTP Settings

### For Zoho Mail (International)
- **SMTP Host**: `smtp.zoho.com`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **SMTP Secure**: `false` for port 587, `true` for port 465

### For Zoho Mail India
- **SMTP Host**: `smtp.zoho.in`
- **SMTP Port**: `587` (TLS) or `465` (SSL)
- **SMTP Secure**: `false` for port 587, `true` for port 465

**Recommended**: Use port `587` with TLS (SMTP_SECURE=false) as it's more reliable.

---

## Step 4: Set Environment Variables

### For Local Development (.env.local)

Create or update `.env.local` in your project root:

```env
# Zoho Mail Configuration
ZOHO_EMAIL="your-email@zoho.com"
ZOHO_PASSWORD="your-zoho-app-password"
SMTP_HOST="smtp.zoho.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

**For India region:**
```env
ZOHO_EMAIL="your-email@zoho.in"
ZOHO_PASSWORD="your-zoho-app-password"
SMTP_HOST="smtp.zoho.in"
SMTP_PORT="587"
SMTP_SECURE="false"
```

**Important Notes:**
- Use your **full Zoho email address** (e.g., `yourname@zoho.com` or `yourname@zoho.in`)
- Use the **App Password** you generated (not your regular password)
- Remove all spaces from the app password
- Restart your development server after updating

### For Vercel Deployment

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:
   - **Name**: `ZOHO_EMAIL`
     - **Value**: `your-email@zoho.com`
     - **Environment**: Production, Preview, Development (select all)
   - **Name**: `ZOHO_PASSWORD`
     - **Value**: `your-zoho-app-password` (the app password you generated)
     - **Environment**: Production, Preview, Development (select all)
   - **Name**: `SMTP_HOST`
     - **Value**: `smtp.zoho.com` (or `smtp.zoho.in` for India)
     - **Environment**: Production, Preview, Development (select all)
   - **Name**: `SMTP_PORT`
     - **Value**: `587`
     - **Environment**: Production, Preview, Development (select all)
   - **Name**: `SMTP_SECURE`
     - **Value**: `false` (or `true` if using port 465)
     - **Environment**: Production, Preview, Development (select all)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

### For Netlify Deployment

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Environment variables**
3. Click **Add a variable** and add:
   - **Key**: `ZOHO_EMAIL`
     - **Value**: `your-email@zoho.com`
     - **Scopes**: Select all (Production, Deploy previews, Branch deploys)
   - **Key**: `ZOHO_PASSWORD`
     - **Value**: `your-zoho-app-password`
     - **Scopes**: Select all
   - **Key**: `SMTP_HOST`
     - **Value**: `smtp.zoho.com` (or `smtp.zoho.in` for India)
     - **Scopes**: Select all
   - **Key**: `SMTP_PORT`
     - **Value**: `587`
     - **Scopes**: Select all
   - **Key**: `SMTP_SECURE`
     - **Value**: `false`
     - **Scopes**: Select all
4. Click **Save**
5. **Trigger a new deploy** for changes to take effect

---

## Step 5: Verify Configuration

### Check Environment Variables Format

✅ **Correct:**
```env
ZOHO_EMAIL="yourname@zoho.com"
ZOHO_PASSWORD="your-app-password-no-spaces"
SMTP_HOST="smtp.zoho.com"
SMTP_PORT="587"
SMTP_SECURE="false"
```

❌ **Wrong:**
```env
ZOHO_EMAIL="yourname"  # Missing @zoho.com
ZOHO_PASSWORD="your-regular-password"  # Using regular password instead of app password
SMTP_HOST="smtp.gmail.com"  # Wrong SMTP host
SMTP_PORT="25"  # Wrong port
```

---

## Backward Compatibility

The application still supports the old Gmail environment variables for backward compatibility:
- `GMAIL_USER` → Will be used if `ZOHO_EMAIL` is not set
- `GMAIL_APP_PASSWORD` → Will be used if `ZOHO_PASSWORD` is not set

However, **it's recommended to use the new Zoho variables** (`ZOHO_EMAIL` and `ZOHO_PASSWORD`).

---

## Common Issues & Solutions

### Issue 1: "App Password not available"
**Solution**: Enable 2FA first. App Passwords are only available after 2FA is enabled.

### Issue 2: "Authentication failed" even with correct credentials
**Solutions**:
- Make sure you're using the **App Password**, not your regular Zoho password
- Remove all spaces from the App Password
- Verify the email address in `ZOHO_EMAIL` matches the account where you generated the App Password
- Check if the App Password was revoked (generate a new one)
- Verify `SMTP_HOST` is correct (`smtp.zoho.com` or `smtp.zoho.in`)
- Verify `SMTP_PORT` is correct (`587` for TLS or `465` for SSL)

### Issue 3: "Connection timeout" or "Unable to connect"
**Solutions**:
- Check your internet connection
- Verify `SMTP_HOST` is correct for your region
- Try using port `587` with `SMTP_SECURE=false` (TLS)
- Check if your firewall is blocking SMTP ports
- For India region, use `smtp.zoho.in` instead of `smtp.zoho.com`

### Issue 4: "Environment variables not found"
**Solutions**:
- Verify variables are set in your deployment platform (Vercel/Netlify)
- Make sure you **redeployed** after adding environment variables
- For local development, check `.env.local` exists and has correct values
- Restart your development server after updating `.env.local`

---

## Verification Checklist

- [ ] 2FA is enabled on Zoho Account
- [ ] App Password generated and copied
- [ ] `ZOHO_EMAIL` set to full email address (e.g., `yourname@zoho.com`)
- [ ] `ZOHO_PASSWORD` set to App Password (no spaces)
- [ ] `SMTP_HOST` set to `smtp.zoho.com` (or `smtp.zoho.in` for India)
- [ ] `SMTP_PORT` set to `587` (or `465` for SSL)
- [ ] `SMTP_SECURE` set to `false` (or `true` for port 465)
- [ ] Environment variables added to deployment platform (Vercel/Netlify)
- [ ] Application redeployed after adding environment variables
- [ ] Tested email sending functionality

---

## Quick Reference

- **Zoho App Passwords**: https://accounts.zoho.com/home#security/app-passwords
- **Zoho Security Settings**: https://accounts.zoho.com/home#security
- **Zoho Mail SMTP Settings**: https://www.zoho.com/mail/help/zoho-mail-smtp-configuration.html
- **Vercel Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Netlify Environment Variables**: https://docs.netlify.com/environment-variables/overview/

---

## Testing Email Configuration

After setting up the environment variables, test the email functionality by:

1. **Voter Login**: Try logging in with an email address (if email OTP is enabled)
2. **Password Reset**: Try the forgot password flow for candidates
3. **Check Server Logs**: Look for email sending success/failure messages

If emails are not being sent, check the server logs for detailed error messages.

