# Vercel Environment Variables Checklist

Complete checklist of environment variables needed for Vercel deployment.

## Quick Setup

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add each variable below
3. Set for **Production**, **Preview**, and **Development** environments
4. **Redeploy** after adding variables

---

## Required Variables

### 🔴 Critical (Must Have)

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

#### Authentication Secrets
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
CSRF_SECRET=your-csrf-secret-key-min-32-chars
```

**⚠️ Important:** Generate strong secrets (min 32 characters):
```bash
# Generate secrets (run in terminal):
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For CSRF_SECRET
```

#### Node Environment
```bash
NODE_ENV=production
```

---

### 🟡 Important (For Core Features)

#### Twilio (OTP/SMS)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Get from:** [Twilio Console](https://console.twilio.com/)

#### Email (Gmail)
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

**Get Gmail App Password:**
1. Enable 2FA on Google Account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Generate app password for "Mail"

#### Storage (Storj - Primary)
```bash
STORJ_ACCESS_KEY_ID=your-storj-access-key
STORJ_SECRET_ACCESS_KEY=your-storj-secret-key
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_REGION=global
STORJ_BUCKET_NAME=kmselection
```

---

### 🟢 Optional (For Additional Features)

#### Cloudinary (Legacy File Viewing)
```bash
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

#### Admin Credentials
```bash
ADMIN_EMAIL=admin@kms-election.com
ADMIN_PASSWORD=SecureAdmin123!
ADMIN_PHONE=+1234567890
```

**⚠️ Change these in production!**

#### Security Settings
```bash
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

#### YouTube Video IDs (For Landing Page Tutorials)
```bash
NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
```

**Videos:**
- Yuva Pankh: https://www.youtube.com/watch?v=QZJSfZsjrcQ
- Trust Mandal: https://www.youtube.com/watch?v=HH1bMm35-QA

---

## Environment-Specific Setup

### Production Environment
- Set all variables above
- Use production database URL
- Use production secrets
- Set `NODE_ENV=production`

### Preview Environment (for Pull Requests)
- Can use same variables as production
- Or use separate preview database
- Useful for testing before merging

### Development Environment (for local testing)
- Use local development values
- Can use local database or development database
- Set `NODE_ENV=development`

---

## Variable Format Examples

### PostgreSQL Database URL
```bash
# Standard format
DATABASE_URL=postgresql://username:password@hostname:5432/database?sslmode=require

# With connection pooler (recommended for serverless)
DATABASE_URL=postgresql://username:password@hostname:5432/database?sslmode=require&connection_limit=1&pool_timeout=20
```

### NextAuth URL
```bash
# Production
NEXTAUTH_URL=https://your-app.vercel.app

# Preview (auto-set by Vercel, but can override)
NEXTAUTH_URL=https://your-app-git-branch.vercel.app

# Local development
NEXTAUTH_URL=http://localhost:3000
```

---

## Verification Steps

After setting variables:

1. **Check in Vercel Dashboard:**
   - Settings → Environment Variables
   - Verify all variables are present
   - Check correct environment is selected

2. **Redeploy:**
   - Go to Deployments
   - Click "Redeploy" on latest deployment
   - Or push a new commit

3. **Test in Function Logs:**
   - Go to Functions tab
   - Check logs for any "undefined" environment variable errors

4. **Test API Routes:**
   ```bash
   # Health check
   curl https://your-app.vercel.app/api/health
   
   # Should return success, not errors about missing env vars
   ```

---

## Common Issues

### Variable Not Found
- **Cause:** Variable not set or wrong environment
- **Fix:** Check Vercel Dashboard, ensure variable is set for correct environment

### Wrong Value
- **Cause:** Typo or incorrect format
- **Fix:** Double-check variable value, especially URLs and secrets

### Variable Not Updated
- **Cause:** Need to redeploy after adding variables
- **Fix:** Redeploy application in Vercel Dashboard

### Secret Too Short
- **Cause:** NEXTAUTH_SECRET, JWT_SECRET, CSRF_SECRET must be min 32 chars
- **Fix:** Generate longer secrets using `openssl rand -base64 32`

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`

2. **Use different secrets for each environment**
   - Production secrets should be different from development

3. **Rotate secrets regularly**
   - Especially after team member changes
   - Update in Vercel Dashboard

4. **Use Vercel's built-in secret management**
   - Don't hardcode secrets in code
   - Use environment variables only

5. **Limit access to Vercel project**
   - Only add team members who need access
   - Use Vercel's team permissions

---

## Quick Reference

Copy-paste this list to track which variables you've set:

```
[ ] DATABASE_URL
[ ] NEXTAUTH_URL
[ ] NEXTAUTH_SECRET
[ ] JWT_SECRET
[ ] CSRF_SECRET
[ ] NODE_ENV
[ ] TWILIO_ACCOUNT_SID
[ ] TWILIO_AUTH_TOKEN
[ ] TWILIO_PHONE_NUMBER
[ ] GMAIL_USER
[ ] GMAIL_APP_PASSWORD
[ ] STORJ_ACCESS_KEY_ID
[ ] STORJ_SECRET_ACCESS_KEY
[ ] STORJ_ENDPOINT
[ ] STORJ_REGION
[ ] STORJ_BUCKET_NAME
[ ] CLOUDINARY_CLOUD_NAME (optional)
[ ] CLOUDINARY_API_KEY (optional)
[ ] CLOUDINARY_API_SECRET (optional)
[ ] ADMIN_EMAIL (optional)
[ ] ADMIN_PASSWORD (optional)
[ ] ADMIN_PHONE (optional)
[ ] BCRYPT_ROUNDS (optional)
[ ] MAX_FILE_SIZE (optional)
[ ] ALLOWED_FILE_TYPES (optional)
[ ] NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID
[ ] NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID
```

---

**Ready to deploy!** Once all variables are set, your application is ready for Vercel. 🚀

