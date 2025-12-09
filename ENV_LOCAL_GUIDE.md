# `.env.local` Configuration Guide

This file contains all environment variables needed for local development. Copy `env.example` to `.env.local` and fill in your actual values.

## 🔴 CRITICAL - Required for Application to Run

### Database
```bash
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```
- **Required for**: All database operations
- **Get from**: Your Supabase project dashboard → Settings → Database
- **Note**: Must include `?sslmode=require` for Supabase

### NextAuth Configuration
```bash
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key-here-change-in-production"
```
- **Required for**: Authentication and session management
- **Generate NEXTAUTH_SECRET**: Run `openssl rand -base64 32` in terminal
- **NEXTAUTH_URL**: Use `http://localhost:3000` for local development

### Security Secrets
```bash
JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
CSRF_SECRET="your-super-secure-csrf-secret-key-change-in-production"
```
- **Required for**: JWT tokens and CSRF protection
- **Generate**: Run `openssl rand -base64 32` for each (minimum 32 characters)
- **Important**: Use different values for each secret

---

## 🟡 IMPORTANT - Required for Core Features

### Twilio SMS Configuration (for OTP sending)
```bash
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```
- **Required for**: SMS OTP functionality
- **Get from**: [Twilio Console](https://console.twilio.com/)
- **Note**: If not set, OTP will be logged to console only (development mode)

### Email Configuration (Gmail) - **Currently Needed**
```bash
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"
```
- **Required for**: Email OTP functionality (overseas members)
- **Get Gmail App Password**:
  1. Enable 2-Step Verification: https://myaccount.google.com/security
  2. Generate App Password: https://myaccount.google.com/apppasswords
  3. Select "Mail" → Generate → Copy 16-character password (no spaces)
- **Important**: Use App Password (16 chars), NOT your regular Gmail password

### Storj DCS Configuration (File Storage)
```bash
STORJ_ACCESS_KEY_ID="your-storj-access-key-id"
STORJ_SECRET_ACCESS_KEY="your-storj-secret-access-key"
STORJ_ENDPOINT="https://gateway.storjshare.io"
STORJ_REGION="global"
STORJ_BUCKET_NAME="kms-election-files"
```
- **Required for**: File uploads and document storage
- **Get from**: Your Storj account dashboard

---

## 🟢 OPTIONAL - For Additional Features

### Admin Credentials
```bash
ADMIN_EMAIL="admin@kms-election.com"
ADMIN_PASSWORD="SecureAdmin123!"
ADMIN_PHONE="+1234567890"
```
- **Optional**: Default admin login credentials
- **Important**: Change these in production!

### Cloudinary Configuration (Legacy File Viewing)
```bash
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"
```
- **Optional**: For legacy file viewing features
- **Get from**: [Cloudinary Dashboard](https://cloudinary.com/console)

### Security Settings
```bash
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
UPLOAD_DIR="./uploads"
```
- **Optional**: Custom security and file upload settings
- **Defaults**: These values are already set in code if not specified

---

## 📋 Complete `.env.local` Template

Copy this template and fill in your values:

```bash
# ============================================
# 🔴 CRITICAL - Required for Application
# ============================================

# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key-here-change-in-production"

# Security Secrets
JWT_SECRET="your-super-secure-jwt-secret-key-change-in-production"
CSRF_SECRET="your-super-secure-csrf-secret-key-change-in-production"

# ============================================
# 🟡 IMPORTANT - Required for Core Features
# ============================================

# Twilio SMS (for OTP)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Email (Gmail) - Currently Needed
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-gmail-app-password"

# Storj File Storage
STORJ_ACCESS_KEY_ID="your-storj-access-key-id"
STORJ_SECRET_ACCESS_KEY="your-storj-secret-access-key"
STORJ_ENDPOINT="https://gateway.storjshare.io"
STORJ_REGION="global"
STORJ_BUCKET_NAME="kms-election-files"

# ============================================
# 🟢 OPTIONAL - Additional Features
# ============================================

# Admin Credentials (Change in production!)
ADMIN_EMAIL="admin@kms-election.com"
ADMIN_PASSWORD="SecureAdmin123!"
ADMIN_PHONE="+1234567890"

# Cloudinary (Optional - Legacy)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Security Settings (Optional - Has defaults)
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES="image/jpeg,image/png,application/pdf"
UPLOAD_DIR="./uploads"
```

---

## 🚀 Quick Setup Steps

1. **Copy the example file:**
   ```bash
   cp env.example .env.local
   ```

2. **Fill in critical variables:**
   - `DATABASE_URL` - From Supabase dashboard
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `JWT_SECRET` - Generate with `openssl rand -base64 32`
   - `CSRF_SECRET` - Generate with `openssl rand -base64 32`

3. **Fill in core feature variables:**
   - `TWILIO_*` - From Twilio console
   - `GMAIL_USER` and `GMAIL_APP_PASSWORD` - From Google App Passwords
   - `STORJ_*` - From Storj dashboard

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

---

## ⚠️ Important Notes

1. **Never commit `.env.local` to Git** - It's already in `.gitignore`
2. **Use App Password for Gmail** - Not your regular password
3. **Generate strong secrets** - Minimum 32 characters for security
4. **Restart server** - After changing environment variables
5. **Check format** - No spaces in App Passwords, proper quotes for strings

---

## 🔍 Verification

After setting up `.env.local`, verify it's working:

1. **Check server starts without errors**
2. **Test database connection** - Try logging in
3. **Test OTP sending** - Try voter login with phone/email
4. **Check console logs** - Should not show "missing" errors

---

## 📞 Need Help?

If you see errors about missing environment variables:
- Check the variable name matches exactly (case-sensitive)
- Ensure no extra spaces or quotes
- Restart the development server
- Check server console for specific error messages

