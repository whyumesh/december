# Vercel Migration Guide

Complete guide for migrating your Next.js 14 + Prisma project from Netlify to Vercel.

## Table of Contents

1. [Overview](#overview)
2. [Key Changes Made](#key-changes-made)
3. [Prisma Configuration](#prisma-configuration)
4. [Environment Variables](#environment-variables)
5. [Build Configuration](#build-configuration)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Deployment Steps](#deployment-steps)
8. [Troubleshooting](#troubleshooting)
9. [Optional: Prisma Data Proxy](#optional-prisma-data-proxy)

---

## Overview

This migration addresses:
- ✅ Serverless function size limits (250MB → 50MB on Vercel)
- ✅ Prisma binary compatibility (rhel-openssl → linux-musl)
- ✅ Build optimization for Vercel's infrastructure
- ✅ Proper externalization of large dependencies

---

## Key Changes Made

### 1. Package.json Updates

**Removed:**
- `@netlify/plugin-nextjs` dependency
- Netlify-specific scripts (deploy:production, start:production, monitor, etc.)

**Updated:**
- `build` script now includes `prisma generate` before build
- `postinstall` script ensures Prisma client is generated after npm install

**New Scripts:**
```json
{
  "build": "prisma generate && next build",
  "build:prod": "cross-env NODE_ENV=production prisma generate && cross-env NODE_ENV=production next build",
  "postinstall": "prisma generate"
}
```

### 2. Prisma Schema Changes

**Before (Netlify):**
```prisma
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

**After (Vercel):**
```prisma
binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
```

**Why:** Vercel uses Alpine Linux (musl libc) for serverless functions, while Netlify uses RHEL-based images.

### 3. Next.js Configuration

**Key Updates:**
- Removed Netlify-specific Prisma exclusions
- Updated `outputFileTracingExcludes` to keep Prisma binaries for Vercel
- Optimized webpack externals for Vercel's bundling
- Removed Netlify-specific comments

### 4. Vercel Configuration (vercel.json)

Created `vercel.json` with:
- Build command that includes Prisma generation
- Function timeout configuration (30 seconds)
- Memory allocation (1024 MB for API routes)
- Region selection (iad1 - US East)

---

## Prisma Configuration

### Binary Targets Explained

Vercel's serverless functions run on Alpine Linux, which uses musl libc instead of glibc. This requires:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

- `native`: For local development (matches your OS)
- `linux-musl-openssl-3.0.x`: For Vercel's production environment

### Prisma Client Generation

The Prisma client is automatically generated:
1. During `npm install` (via `postinstall` script)
2. During build (via `build` script)
3. On Vercel deployment (via `buildCommand` in vercel.json)

### Schema Location

Your Prisma schema is located at:
- `prisma/schema.prisma` ✅ (Correct location)

Vercel automatically detects and uses this schema.

---

## Environment Variables

### Required Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

#### Database
```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
```

#### Authentication
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
CSRF_SECRET=your-csrf-secret-key-min-32-chars
```

#### Twilio (OTP)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Email (Gmail)
```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
```

#### Storage (Storj)
```bash
STORJ_ACCESS_KEY_ID=your-storj-access-key
STORJ_SECRET_ACCESS_KEY=your-storj-secret-key
STORJ_ENDPOINT=https://gateway.storjshare.io
STORJ_REGION=global
STORJ_BUCKET_NAME=kmselection
```

#### Storage (Cloudinary - Optional)
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

#### Other Settings
```bash
NODE_ENV=production
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf
```

### Environment Variable Setup Steps

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for:
   - **Production** environment
   - **Preview** environment (optional, for testing)
   - **Development** environment (optional, for local testing)

3. **Important:** After adding variables, redeploy your application

---

## Build Configuration

### Vercel Build Process

1. **Install Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Generate Prisma Client**
   ```bash
   prisma generate
   ```
   (Automatically runs via `postinstall` script)

3. **Build Next.js**
   ```bash
   next build
   ```

### Build Command

The `vercel.json` specifies:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

This ensures Prisma client is generated before the build.

### Build Optimization

The `next.config.js` includes:
- **Tree shaking** for unused code
- **Code splitting** for better caching
- **Externalization** of large dependencies
- **Output file tracing** to exclude unnecessary files

---

## Bundle Size Optimization

### Current Optimizations

1. **Externalized Dependencies**
   - Large packages are not bundled, loaded from `node_modules` at runtime
   - Includes: `pg`, `bcryptjs`, `pdf-parse`, `exceljs`, `jspdf`, etc.

2. **Prisma Binary Optimization**
   - Only `linux-musl-openssl-3.0.x` binary is included
   - Other platform binaries are excluded

3. **Output File Tracing**
   - Test files excluded
   - Source maps excluded
   - Unnecessary platform binaries excluded

### Additional Optimization Tips

#### 1. Dynamic Imports for Heavy Libraries

For routes that use heavy libraries (e.g., ExcelJS, PDF parsing), consider dynamic imports:

```typescript
// Instead of:
import ExcelJS from 'exceljs'

// Use:
const ExcelJS = (await import('exceljs')).default
```

#### 2. Route-Specific Optimization

For routes with large dependencies, consider:

```typescript
// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Increase timeout if needed (in vercel.json)
```

#### 3. Monitor Bundle Size

Check function sizes in Vercel Dashboard → Functions tab after deployment.

---

## Deployment Steps

### Step 1: Prepare Repository

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Migrate from Netlify to Vercel"
   git push
   ```

2. **Remove Netlify-specific files** (optional):
   - `netlify.toml` (can be kept for reference)
   - `scripts/optimize-for-netlify*.sh` (can be kept for reference)

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "Add New Project"
4. Import your repository

### Step 3: Configure Project

1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `./` (default)
3. **Build Command:** `prisma generate && next build` (auto-filled from vercel.json)
4. **Output Directory:** `.next` (auto-detected)
5. **Install Command:** `npm install --legacy-peer-deps` (auto-filled from vercel.json)

### Step 4: Set Environment Variables

1. In project settings, go to "Environment Variables"
2. Add all required variables (see [Environment Variables](#environment-variables) section)
3. Set for Production, Preview, and Development environments

### Step 5: Deploy

1. Click "Deploy"
2. Monitor the build logs
3. Check for any errors related to:
   - Prisma client generation
   - Missing environment variables
   - Build failures

### Step 6: Verify Deployment

1. **Check Function Logs:**
   - Vercel Dashboard → Functions → View logs

2. **Test API Routes:**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Test Database Connection:**
   - Check if Prisma queries work
   - Verify no "Prisma binary not found" errors

4. **Monitor Function Size:**
   - Vercel Dashboard → Functions
   - Ensure functions are under 50MB

---

## Troubleshooting

### Issue: Prisma Binary Not Found

**Error:**
```
Error: Can't find binary for current platform "linux-musl-openssl-3.0.x"
```

**Solution:**
1. Ensure `prisma/schema.prisma` has correct binary targets:
   ```prisma
   binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
   ```
2. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```
3. Commit and redeploy

### Issue: Function Size Exceeds 50MB

**Error:**
```
Error: Function size exceeds maximum allowed size
```

**Solutions:**
1. Check which dependencies are bundled:
   - Review `next.config.js` `serverComponentsExternalPackages`
   - Ensure large packages are externalized

2. Use dynamic imports for heavy libraries:
   ```typescript
   const heavyLib = await import('heavy-library')
   ```

3. Split large API routes into smaller functions

4. Check `outputFileTracingExcludes` in `next.config.js`

### Issue: Build Timeout

**Error:**
```
Build exceeded maximum build time
```

**Solutions:**
1. Optimize build:
   - Skip type checking: `typescript.ignoreBuildErrors: true`
   - Skip linting: `eslint.ignoreDuringBuilds: true`

2. Use Vercel's build cache:
   - Ensure `.vercel` is in `.gitignore`
   - Vercel caches `node_modules` automatically

3. Consider using Vercel's Build Logs to identify slow steps

### Issue: Database Connection Failed

**Error:**
```
Can't reach database server
```

**Solutions:**
1. Verify `DATABASE_URL` is set correctly in Vercel environment variables
2. Check database firewall allows Vercel IPs
3. Ensure SSL mode is correct: `?sslmode=require`
4. Test connection locally with same URL

### Issue: Environment Variables Not Found

**Error:**
```
Environment variable X is not defined
```

**Solutions:**
1. Check Vercel Dashboard → Environment Variables
2. Ensure variables are set for correct environment (Production/Preview/Development)
3. Redeploy after adding variables
4. Check variable names match exactly (case-sensitive)

### Issue: Prisma Client Not Generated

**Error:**
```
Module not found: Can't resolve '@prisma/client'
```

**Solutions:**
1. Ensure `postinstall` script runs:
   ```json
   "postinstall": "prisma generate"
   ```
2. Check `vercel.json` build command includes Prisma generation
3. Verify Prisma is in `dependencies` (not `devDependencies`)

---

## Optional: Prisma Data Proxy

For better performance and connection pooling, consider using Prisma Data Proxy:

### Benefits
- Connection pooling
- Reduced cold starts
- Better performance for serverless

### Setup Steps

1. **Enable Data Proxy in Prisma Schema:**
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
     previewFeatures = ["prismaDataProxy"]
   }
   ```

2. **Generate Prisma Client:**
   ```bash
   PRISMA_GENERATE_DATAPROXY=true npx prisma generate
   ```

3. **Update Environment Variables:**
   - Add `PRISMA_CLIENT_ENGINE_TYPE=dataproxy` to Vercel
   - Use Data Proxy URL instead of direct database URL

4. **Update vercel.json:**
   ```json
   {
     "env": {
       "PRISMA_GENERATE_DATAPROXY": "true"
     }
   }
   ```

**Note:** Data Proxy requires a Prisma Cloud account (free tier available).

---

## Post-Migration Checklist

- [ ] All environment variables set in Vercel
- [ ] Prisma schema updated with correct binary targets
- [ ] Build succeeds without errors
- [ ] API routes respond correctly
- [ ] Database connections work
- [ ] Function sizes are under 50MB
- [ ] No "Prisma binary not found" errors
- [ ] Custom domain configured (if needed)
- [ ] Monitoring/logging set up
- [ ] Performance metrics reviewed

---

## Additional Resources

- [Vercel Next.js Documentation](https://vercel.com/docs/frameworks/nextjs)
- [Prisma on Vercel Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Function Limits](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js#limits)

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Review function logs in Vercel Dashboard
3. Verify all environment variables are set
4. Test locally with production environment variables
5. Check Prisma client generation during build

---

**Migration completed!** Your Next.js 14 + Prisma application is now ready for Vercel deployment. 🚀

