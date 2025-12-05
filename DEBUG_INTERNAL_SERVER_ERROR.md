# Debug Internal Server Error on Vercel

## 🔍 Step 1: Get the Exact Error Message

**This is the MOST IMPORTANT step - we need to see the actual error:**

1. Go to **Vercel Dashboard** → Your Project
2. Click **Deployments** → Latest deployment
3. Click on **Functions** tab
4. Click on any function (start with the page route or `/api/health`)
5. Scroll down to **Logs** section
6. **Copy the error message** - this will tell us exactly what's wrong

**Common errors you might see:**
- `DATABASE_URL environment variable is required`
- `NEXTAUTH_SECRET is missing`
- `Cannot find module '@prisma/client'`
- `Connection refused` (database connection error)
- `Invalid NEXTAUTH_URL`

## 🧪 Step 2: Test Health Endpoint

Visit this URL in your browser:
```
https://your-app.vercel.app/api/health
```

**Expected Response:**
```json
{
  "timestamp": "...",
  "environment": "production",
  "vercel": true,
  "checks": {
    "nextAuthUrl": { "present": true, "value": "Set" },
    "nextAuthSecret": { "present": true, "value": "Set" },
    "databaseUrl": { "present": true, "value": "Set" }
  },
  "status": "ok"
}
```

**If it returns 500:**
- Check Vercel function logs (Step 1)
- The error message will tell you what's missing

## ✅ Step 3: Verify Environment Variables

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

### Critical Checks:

1. **NEXTAUTH_URL** ⚠️ **MOST COMMON ISSUE**
   - Must be: `https://your-actual-vercel-domain.vercel.app`
   - NOT: `http://localhost:3000`
   - NOT: `https://localhost:3000`
   - Check your actual Vercel URL and make sure they match exactly

2. **DATABASE_URL**
   - Format: `postgresql://user:password@host:port/database?sslmode=require`
   - Must include `?sslmode=require` for most cloud databases
   - Verify it's accessible from Vercel

3. **NEXTAUTH_SECRET**
   - Must be at least 32 characters
   - Should be a random secure string

## 🔧 Step 4: Common Fixes

### Fix 1: NEXTAUTH_URL Mismatch

**Problem:** `NEXTAUTH_URL` doesn't match your Vercel domain

**Solution:**
1. Go to Vercel Dashboard → Your Project
2. Check your deployment URL (e.g., `https://december-mu.vercel.app`)
3. Go to Settings → Environment Variables
4. Update `NEXTAUTH_URL` to match exactly: `https://december-mu.vercel.app`
5. Redeploy

### Fix 2: Database Connection

**Problem:** Database connection fails

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database allows connections from Vercel IPs
3. Ensure database is running and accessible
4. For PostgreSQL, ensure `?sslmode=require` is in the URL

### Fix 3: Prisma Client Not Found

**Problem:** `Cannot find module '@prisma/client'`

**Solution:**
- This should be fixed already, but if it persists:
1. Check build logs - verify `prisma generate` ran successfully
2. Ensure `DATABASE_URL` is available during build
3. Redeploy with fresh build

### Fix 4: NextAuth Initialization Error

**Problem:** NextAuth fails to initialize

**Solution:**
1. Ensure `NEXTAUTH_SECRET` is set (min 32 chars)
2. Ensure `NEXTAUTH_URL` matches Vercel domain
3. Check NextAuth route: `/api/auth/[...nextauth]`

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] Checked Vercel function logs for exact error
- [ ] Tested `/api/health` endpoint
- [ ] Verified `NEXTAUTH_URL` matches Vercel domain exactly
- [ ] Verified `DATABASE_URL` is set and correct
- [ ] Verified `NEXTAUTH_SECRET` is set (32+ chars)
- [ ] Checked build logs for Prisma generation
- [ ] Redeployed after fixing environment variables

## 🚨 Most Likely Causes (in order)

1. **NEXTAUTH_URL mismatch** (80% of cases)
2. **Missing DATABASE_URL** (10% of cases)
3. **Database connection issue** (5% of cases)
4. **Prisma client not bundled** (5% of cases - should be fixed)

## 📞 Next Steps

1. **Get the error from Vercel logs** (Step 1)
2. **Share the error message** - this will tell us exactly what to fix
3. **Test `/api/health`** endpoint and share the response

The error message from Vercel logs is the key to fixing this quickly!

