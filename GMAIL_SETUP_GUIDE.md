# Gmail SMTP Setup Guide

## Your Gmail Account
- **Email**: `no.reply.electkms@gmail.com`
- **Regular Password**: `ElectKMSORG@2026` (DO NOT use this for SMTP)

## ⚠️ IMPORTANT: You Need an App Password

Gmail **does NOT** accept regular passwords for SMTP. You **MUST** generate an App Password.

## Step-by-Step Instructions

### Step 1: Enable 2-Step Verification (if not already enabled)

1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" section
3. Click "Get started" or "Turn on"
4. Follow the setup process (usually involves phone verification)

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → App Passwords
   
2. If you see "App passwords aren't available", you need to enable 2-Step Verification first (Step 1)

3. Select app: Choose **"Mail"**

4. Select device: Choose **"Other (Custom name)"**
   - Enter name: `KMS Election SMTP`
   - Click **"Generate"**

5. **Copy the 16-character password immediately**
   - It will look like: `abcd efgh ijkl mnop`
   - Remove spaces when using: `abcdefghijklmnop`
   - **You can only see it once!**

### Step 3: Update `.env.local`

Add or update these lines in your `.env.local` file:

```bash
GMAIL_USER="no.reply.electkms@gmail.com"
GMAIL_APP_PASSWORD="[paste-the-16-character-app-password-here-no-spaces]"
```

**Example:**
```bash
GMAIL_USER="no.reply.electkms@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

### Step 4: Restart Server

After updating `.env.local`:
```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

## Verification

When you restart, check the server console. You should see:
```
🔍 Checking email configuration...
   GMAIL_USER: SET
   GMAIL_APP_PASSWORD: SET
   Selected EMAIL_USER: no.reply.electkms@gmail.com
   Selected EMAIL_PASSWORD length: 16
📧 Using Gmail SMTP: no.reply.electkms@gmail.com
   ✅ App Password format looks correct (16 characters)
```

## Troubleshooting

### "App passwords aren't available"
- **Solution**: Enable 2-Step Verification first (Step 1)

### "Invalid login" or "Authentication failed"
- **Check**: App Password is exactly 16 characters, no spaces
- **Check**: You copied the App Password correctly
- **Check**: 2-Step Verification is enabled

### Still having issues?
- Make sure you're using the App Password, NOT your regular password
- Verify the App Password has no spaces (remove all spaces)
- Restart the server after updating `.env.local`

## Why App Password?

- **Security**: App Passwords are more secure than regular passwords
- **Required**: Gmail SMTP requires App Passwords when 2-Step Verification is enabled
- **Revocable**: You can revoke App Passwords without changing your main password

## Quick Links

- **App Passwords**: https://myaccount.google.com/apppasswords
- **2-Step Verification**: https://myaccount.google.com/security
- **Security Settings**: https://myaccount.google.com/security

