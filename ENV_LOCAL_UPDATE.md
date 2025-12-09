# Update `.env.local` for Gmail SMTP

## Required Changes

Add or update these lines in your `.env.local` file:

```bash
GMAIL_USER="no.reply.electkms@gmail.com"
GMAIL_APP_PASSWORD="[your-16-character-app-password-here]"
```

## Step-by-Step Instructions

### Step 1: Generate Gmail App Password

**⚠️ IMPORTANT:** You cannot use your regular password (`ElectKMSORG@2026`). You MUST generate an App Password.

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other (Custom name)" → Enter "KMS Election"
   - Click "Generate"
   - **Copy the 16-character password immediately** (you can only see it once!)
   - It will look like: `abcd efgh ijkl mnop`
   - Remove spaces: `abcdefghijklmnop`

### Step 2: Update `.env.local`

Open your `.env.local` file and add/update:

```bash
# Email Configuration (Gmail SMTP)
GMAIL_USER="no.reply.electkms@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"
```

**Replace `abcdefghijklmnop` with your actual 16-character App Password (no spaces)**

### Step 3: Remove Old Zoho Variables (if present)

If you have these old variables, you can remove them (they're no longer needed):

```bash
# Remove these (if present):
# EMAIL_USER="no-reply@electkms.org"
# EMAIL_PASSWORD="dUJxxwmdF6XQ"
# ZOHO_SMTP_HOST="smtp.zoho.in"
# ZOHO_USE_SSL="true"
```

### Step 4: Restart Server

After updating `.env.local`:
```bash
# Stop the server (Ctrl+C) and restart:
npm run dev
```

## Example `.env.local` File

```bash
# Database
DATABASE_URL="your-database-url"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"

# Security
JWT_SECRET="your-jwt-secret"
CSRF_SECRET="your-csrf-secret"

# Gmail SMTP (for Email OTP)
GMAIL_USER="no.reply.electkms@gmail.com"
GMAIL_APP_PASSWORD="your-16-character-app-password-here"

# Twilio (for SMS OTP)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Storj (for file storage)
STORJ_ACCESS_KEY_ID="your-storj-key"
STORJ_SECRET_ACCESS_KEY="your-storj-secret"
STORJ_ENDPOINT="https://gateway.storjshare.io"
STORJ_REGION="global"
STORJ_BUCKET_NAME="kmselection"
```

## Verification

After restarting, check your server console. You should see:

```
🔍 Checking Gmail configuration...
   GMAIL_USER: SET
   GMAIL_APP_PASSWORD: SET
   Email: no.reply.electkms@gmail.com
   Password length: 16
📧 Using Gmail SMTP: no.reply.electkms@gmail.com
   ✅ App Password format looks correct (16 characters)
```

## Common Mistakes to Avoid

❌ **DON'T use your regular password:**
```bash
GMAIL_APP_PASSWORD="ElectKMSORG@2026"  # WRONG!
```

✅ **DO use App Password:**
```bash
GMAIL_APP_PASSWORD="abcdefghijklmnop"  # RIGHT (16 chars, no spaces)
```

❌ **DON'T include spaces:**
```bash
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"  # WRONG!
```

✅ **DO remove spaces:**
```bash
GMAIL_APP_PASSWORD="abcdefghijklmnop"  # RIGHT
```

## Need Help?

If you're still having issues:
1. Check server console for detailed error messages
2. Verify App Password is exactly 16 characters (no spaces)
3. Ensure 2-Step Verification is enabled
4. Make sure you restarted the server after updating `.env.local`

