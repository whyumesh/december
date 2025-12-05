# Vercel White Blank Page - Troubleshooting Guide

If you're seeing a white blank page on your Vercel deployment, follow these steps:

## Quick Fix Checklist

### 1. Check Environment Variables (Most Common Issue)

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables** and ensure these are set:

#### Required Variables:
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key-min-32-chars
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NODE_ENV=production
```

**⚠️ Critical:** 
- `NEXTAUTH_URL` must match your actual Vercel deployment URL (e.g., `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` must be a strong random string (minimum 32 characters)
- After adding/updating environment variables, **redeploy** your application

### 2. Check Build Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Check the **Build Logs** for any errors
4. Look for:
   - Missing environment variable warnings
   - Build failures
   - TypeScript errors
   - Prisma generation errors

### 3. Check Runtime Logs

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the latest deployment
3. Click **View Function Logs** or check **Runtime Logs**
4. Look for:
   - NextAuth initialization errors
   - Database connection errors
   - JavaScript runtime errors

### 4. Test the Health Endpoint

Visit: `https://your-app.vercel.app/api/health`

This will show you which environment variables are missing:
```json
{
  "checks": {
    "nextAuthUrl": { "present": true, "value": "Set" },
    "nextAuthSecret": { "present": true, "value": "Set" },
    "databaseUrl": { "present": true, "value": "Set" }
  },
  "status": "ok"
}
```

### 5. Check Browser Console

1. Open your deployed site
2. Press `F12` to open Developer Tools
3. Go to **Console** tab
4. Look for JavaScript errors (red messages)
5. Common errors:
   - `NEXTAUTH_URL is not defined`
   - `NEXTAUTH_SECRET is not defined`
   - `Failed to fetch` (API errors)
   - React rendering errors

### 6. Verify Build Command

In `vercel.json`, ensure the build command is correct:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

### 7. Common Issues and Solutions

#### Issue: Missing NEXTAUTH_URL
**Symptom:** White page, console shows NextAuth errors
**Solution:** 
1. Set `NEXTAUTH_URL` to your exact Vercel URL
2. For production: `https://your-app.vercel.app`
3. For preview: `https://your-app-git-branch.vercel.app`
4. Redeploy after setting

#### Issue: Missing NEXTAUTH_SECRET
**Symptom:** White page, authentication doesn't work
**Solution:**
1. Generate a secure secret: `openssl rand -base64 32`
2. Set it in Vercel environment variables
3. Redeploy

#### Issue: Database Connection Error
**Symptom:** White page, API errors in console
**Solution:**
1. Verify `DATABASE_URL` is set correctly
2. Ensure database allows connections from Vercel IPs
3. Check database SSL settings (should include `?sslmode=require`)

#### Issue: Build Succeeds but Page is White
**Symptom:** Build logs show success, but page is blank
**Solution:**
1. Check browser console for JavaScript errors
2. Check runtime logs in Vercel dashboard
3. Verify all environment variables are set for the correct environment (Production/Preview/Development)

### 8. Force Redeploy

After fixing environment variables:
1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger a new deployment

### 9. Verify Deployment Settings

In **Vercel Dashboard** → Your Project → **Settings** → **General**:
- Framework Preset: **Next.js**
- Build Command: `prisma generate && next build` (or leave default)
- Output Directory: (leave default)
- Install Command: `npm install --legacy-peer-deps` (if needed)

### 10. Test Locally First

Before deploying, test locally with production environment variables:
```bash
# Create .env.local with production values
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
DATABASE_URL=your-database-url
NODE_ENV=production

# Build and test
npm run build
npm start
```

If it works locally but not on Vercel, the issue is likely:
- Environment variables not set in Vercel
- Different environment variable values
- Vercel-specific build/runtime issues

## Still Having Issues?

1. **Check Vercel Status**: https://www.vercel-status.com/
2. **Review Error Messages**: Check both build logs and runtime logs
3. **Compare with Working Deployment**: If you have a previous working deployment, compare environment variables
4. **Contact Support**: If all else fails, contact Vercel support with:
   - Your deployment URL
   - Build log output
   - Runtime log output
   - Environment variable names (not values) that are set

## Prevention

To prevent this issue in the future:
1. Always set required environment variables before first deployment
2. Use Vercel's environment variable templates
3. Document required environment variables in your README
4. Add environment variable validation in your code (already added)
5. Test deployments in preview environments before promoting to production

