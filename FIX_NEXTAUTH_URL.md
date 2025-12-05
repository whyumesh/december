# Fix NEXTAUTH_URL for Vercel

## Problem
`NEXTAUTH_URL` is set to `http://localhost:3000` which causes 500 errors in production.

## Solution

### Step 1: Find Your Vercel URL

1. Go to **Vercel Dashboard** → Your Project
2. Look at the **Domains** section
3. Your production URL will be something like:
   - `https://your-app-name.vercel.app`
   - Or your custom domain if you have one

### Step 2: Update NEXTAUTH_URL

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Find `NEXTAUTH_URL`
3. Click **Edit** or **Add** if it doesn't exist
4. Set the value to your Vercel URL:
   ```
   NEXTAUTH_URL=https://your-app-name.vercel.app
   ```
   **Important:**
   - Use `https://` not `http://`
   - Don't include trailing slash
   - Use your exact Vercel deployment URL

### Step 3: Set for All Environments

Make sure `NEXTAUTH_URL` is set for:
- ✅ **Production**
- ✅ **Preview** (can use same value or preview URL)
- ✅ **Development** (can keep localhost for local dev)

### Step 4: Redeploy

1. After updating the environment variable, go to **Deployments**
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger redeploy

## Example

**Before (Wrong):**
```
NEXTAUTH_URL=http://localhost:3000
```

**After (Correct):**
```
NEXTAUTH_URL=https://kms-election.vercel.app
```
(Replace with your actual Vercel URL)

## Why This Matters

NextAuth uses `NEXTAUTH_URL` to:
- Generate correct callback URLs
- Handle authentication redirects
- Set cookies with correct domain
- Validate OAuth redirects

If it's set to localhost in production, NextAuth will fail and cause 500 errors.

## Verify It's Fixed

After redeploying:
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Try to access a page that uses authentication
3. Check Vercel Function Logs - should no longer see NextAuth errors

