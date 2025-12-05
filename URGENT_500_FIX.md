# URGENT: Fix 500 Error - Step by Step

## Step 1: Check Vercel Function Logs (MOST IMPORTANT)

**This will show you the EXACT error:**

1. Go to **Vercel Dashboard** → Your Project
2. Click **Functions** tab (or **Deployments** → Latest deployment)
3. Click on any function that's failing (usually the page route)
4. Look at the **Logs** section
5. **Copy the error message** - this tells us what's wrong

**Common errors you might see:**
- `DATABASE_URL environment variable is required`
- `NEXTAUTH_SECRET is missing`
- `Connection refused` or database connection errors
- `Prisma Client not generated`

## Step 2: Verify ALL Required Environment Variables

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

### MUST HAVE (Check each one):

```bash
✅ DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
✅ NEXTAUTH_URL=https://your-app.vercel.app  (NOT localhost!)
✅ NEXTAUTH_SECRET=your-secret-min-32-chars
✅ JWT_SECRET=your-secret-min-32-chars
✅ CSRF_SECRET=your-secret-min-32-chars
✅ NODE_ENV=production
```

**Check:**
- [ ] All 6 variables are present
- [ ] Values are correct (no typos)
- [ ] Set for **Production** environment
- [ ] `NEXTAUTH_URL` is your Vercel URL (not localhost)

## Step 3: Test Health Endpoint

Visit this URL in your browser:
```
https://your-app.vercel.app/api/health
```

**What to look for:**
- If it returns JSON → App is running, check the error details
- If it returns 500 → Check Vercel logs (Step 1)
- If it says "DATABASE_URL not configured" → Add DATABASE_URL

## Step 4: Check Database Connection

### If DATABASE_URL is set but still failing:

1. **Verify DATABASE_URL format:**
   ```
   postgresql://username:password@host:5432/database?sslmode=require
   ```

2. **Test connection:**
   - Try connecting to your database from your local machine
   - Ensure database allows external connections
   - Check if database is accessible (not paused/shut down)

3. **Common issues:**
   - Missing `?sslmode=require` at the end
   - Wrong password
   - Database paused (Neon, Supabase, etc.)
   - Firewall blocking Vercel IPs

## Step 5: Quick Fixes Based on Error

### Error: "DATABASE_URL environment variable is required"
**Fix:** Add `DATABASE_URL` in Vercel environment variables

### Error: "NEXTAUTH_SECRET is missing"
**Fix:** Add `NEXTAUTH_SECRET` (min 32 characters)

### Error: "Connection refused" or "Connection timeout"
**Fix:** 
- Check DATABASE_URL is correct
- Ensure database is running
- Check database allows external connections
- For Neon/Supabase: Check if database is paused

### Error: "Prisma Client not generated"
**Fix:** 
- Check build logs - should see "Generated Prisma Client"
- If not, the build might have failed
- Redeploy

## Step 6: Redeploy After Changes

**After adding/changing environment variables:**
1. Go to **Deployments** tab
2. Click **three dots** (⋯) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete
5. Test again

## Most Likely Issues (In Order)

1. **Missing DATABASE_URL** (80% of cases)
2. **NEXTAUTH_URL still set to localhost** (you fixed this, but double-check)
3. **Missing NEXTAUTH_SECRET**
4. **Database connection failing** (wrong URL, database paused, etc.)
5. **Missing JWT_SECRET or CSRF_SECRET**

## Quick Checklist

Before asking for more help, check:

- [ ] Checked Vercel Function Logs for exact error
- [ ] Verified all 6 required environment variables are set
- [ ] Tested `/api/health` endpoint
- [ ] Redeployed after changing environment variables
- [ ] Verified DATABASE_URL format is correct
- [ ] Checked database is accessible

## Still Not Working?

**Share this information:**
1. The exact error from Vercel Function Logs
2. Which environment variables you have set
3. What `/api/health` returns
4. Your DATABASE_URL format (hide password)

