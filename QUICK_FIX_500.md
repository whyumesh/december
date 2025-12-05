# Quick Fix for 500 Error

## Immediate Steps

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions → Logs
   - Look for the exact error message

2. **Verify Environment Variables**:
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure these are set:
     - `DATABASE_URL`
     - `NEXTAUTH_URL` (must match your Vercel URL exactly)
     - `NEXTAUTH_SECRET`
     - `JWT_SECRET`
     - `CSRF_SECRET`
     - `NODE_ENV=production`

3. **Redeploy**:
   - After adding/changing environment variables, click "Redeploy" in Vercel

## Most Likely Issue

The 500 error is most likely due to:
- Missing `DATABASE_URL` environment variable
- Missing `NEXTAUTH_SECRET` environment variable
- Incorrect `NEXTAUTH_URL` (must match your Vercel deployment URL exactly)

## Test

After fixing, test:
- `https://your-app.vercel.app/api/health` - Should return JSON
- `https://your-app.vercel.app` - Should load homepage

