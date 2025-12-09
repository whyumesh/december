# Vercel Environment Variables - Email OTP Setup

## Required Environment Variables for Email OTP

Add these to your Vercel project:

### Gmail Configuration (Recommended)

1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. Add these variables:

```bash
GMAIL_USER=no.reply.electkms@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password-here
```

**Important:**
- `GMAIL_APP_PASSWORD` must be a 16-character App Password (not your regular password)
- Generate App Password from: https://myaccount.google.com/apppasswords
- Remove all spaces from the App Password
- Set for **Production**, **Preview**, and **Development** environments

### Alternative: Zoho Mail (if you prefer)

If you want to use Zoho Mail instead:

```bash
EMAIL_USER=no-reply@electkms.org
EMAIL_PASSWORD=your-zoho-app-password
ZOHO_SMTP_HOST=smtp.zoho.in
ZOHO_USE_SSL=true
```

## Steps to Add Variables in Vercel

1. **Go to Vercel Dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project

2. **Open Settings**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the left sidebar

3. **Add Variables**
   - Click **Add New**
   - Enter variable name: `GMAIL_USER`
   - Enter value: `no.reply.electkms@gmail.com`
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

4. **Add App Password**
   - Click **Add New** again
   - Enter variable name: `GMAIL_APP_PASSWORD`
   - Enter value: `[your-16-character-app-password]`
   - Select environments: **Production**, **Preview**, **Development**
   - Click **Save**

5. **Redeploy**
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger deployment

## Verification

After adding variables and redeploying:

1. Check deployment logs for:
   ```
   🔍 Checking email configuration...
      GMAIL_USER: SET
      GMAIL_APP_PASSWORD: SET
   📧 Using Gmail SMTP: no.reply.electkms@gmail.com
   ```

2. Test email OTP:
   - Go to voter login page
   - Select "Email" option
   - Enter an email address
   - Click "Send OTP"
   - Check if email is sent successfully

## Troubleshooting

### Variables not working after deployment?
- **Check**: Variables are set for the correct environment (Production/Preview/Development)
- **Check**: Variable names match exactly (case-sensitive): `GMAIL_USER`, `GMAIL_APP_PASSWORD`
- **Check**: No extra spaces in variable values
- **Solution**: Redeploy after adding variables

### Still getting authentication errors?
- **Check**: App Password is exactly 16 characters (no spaces)
- **Check**: 2-Step Verification is enabled on Gmail account
- **Check**: App Password was generated for "Mail" application
- **Check**: Server logs for specific error messages

## Quick Checklist

- [ ] Gmail App Password generated (16 characters)
- [ ] `GMAIL_USER` added to Vercel (all environments)
- [ ] `GMAIL_APP_PASSWORD` added to Vercel (all environments)
- [ ] Variables saved in Vercel
- [ ] Project redeployed
- [ ] Email OTP tested successfully

## Security Notes

- ✅ App Passwords are more secure than regular passwords
- ✅ You can revoke App Passwords without changing your main password
- ✅ App Passwords are specific to the application (Mail)
- ✅ Never commit App Passwords to Git (they're in `.gitignore`)

