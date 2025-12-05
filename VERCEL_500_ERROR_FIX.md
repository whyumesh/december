# Fix for Vercel 500 Internal Server Error

## Problem
After deployment, getting 500 Internal Server Error on all pages.

## Most Common Causes

### 1. Missing Environment Variables (Most Likely)

Check Vercel Dashboard → Settings → Environment Variables and ensure these are set:

#### Critical (Required):
```bash
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-key-min-32-chars
JWT_SECRET=your-jwt-secret-key-min-32-chars
CSRF_SECRET=your-csrf-secret-key-min-32-chars
NODE_ENV=production
```

#### Important:
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check database is accessible from Vercel
- Ensure database allows connections from Vercel IPs
- For PostgreSQL, ensure `?sslmode=require` is included

### 3. NextAuth Configuration

- Verify `NEXTAUTH_URL` matches your Vercel deployment URL exactly
- Ensure `NEXTAUTH_SECRET` is set (min 32 characters)
- Check that NextAuth API route is accessible: `/api/auth/[...nextauth]`

## How to Debug

### Step 1: Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project → **Functions** tab
2. Click on a function that's failing
3. Check the **Logs** section for error messages
4. Look for:
   - "DATABASE_URL environment variable is required"
   - "NEXTAUTH_SECRET is missing"
   - Database connection errors
   - Prisma errors

### Step 2: Check Build Logs

1. Go to Vercel Dashboard → **Deployments**
2. Click on the latest deployment
3. Check the build logs for any errors
4. Look for:
   - Environment variable warnings
   - Database connection errors during build
   - Prisma generation errors

### Step 3: Test API Routes

Try accessing these endpoints directly:
- `https://your-app.vercel.app/api/health` - Should return health status
- `https://your-app.vercel.app/api/auth/signin` - Should show sign-in page

### Step 4: Verify Environment Variables

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Ensure all variables are set for **Production** environment
3. Check that values are correct (no extra spaces, correct format)
4. **Redeploy** after adding/changing variables

## Quick Fixes

### Fix 1: Add Missing Environment Variables

If you see errors about missing variables:
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Add the missing variable
3. Click **Redeploy** on the latest deployment

### Fix 2: Fix Database URL

If database connection is failing:
1. Verify your `DATABASE_URL` format:
   ```
   postgresql://username:password@host:5432/database?sslmode=require
   ```
2. Test the connection string locally
3. Ensure database allows external connections
4. Update in Vercel and redeploy

### Fix 3: Fix NextAuth URL

If NextAuth is failing:
1. Set `NEXTAUTH_URL` to your exact Vercel URL:
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   ```
2. Don't include trailing slash
3. Use `https://` not `http://`
4. Redeploy after updating

## Verification

After fixing, verify:
1. ✅ Home page loads: `https://your-app.vercel.app`
2. ✅ Health check works: `https://your-app.vercel.app/api/health`
3. ✅ No errors in Vercel function logs
4. ✅ Database queries work (test a page that uses database)

## Still Getting 500 Error?

1. **Check Vercel Function Logs** - This will show the exact error
2. **Check Build Logs** - Look for warnings or errors
3. **Test Locally** - Run `npm run build && npm start` to see if it works locally
4. **Check Database** - Verify database is accessible and has correct schema

## Common Error Messages

| Error | Solution |
|-------|----------|
| "DATABASE_URL environment variable is required" | Add `DATABASE_URL` in Vercel environment variables |
| "NEXTAUTH_SECRET is missing" | Add `NEXTAUTH_SECRET` in Vercel environment variables |
| "Connection refused" | Check database URL and ensure database allows connections |
| "Prisma Client not generated" | Check build logs - `prisma generate` should run during build |
| "Invalid NEXTAUTH_URL" | Set `NEXTAUTH_URL` to your exact Vercel deployment URL |

