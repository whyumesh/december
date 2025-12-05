# Vercel 500 Error - Debug Checklist

## 🔍 Step 1: Get the Exact Error

1. **Vercel Dashboard** → Your Project → **Functions**
2. Click on a failing function
3. **Copy the error message** from logs

## ✅ Step 2: Environment Variables Checklist

Go to **Vercel Dashboard** → **Settings** → **Environment Variables**

### Required Variables (ALL must be set):

```
□ DATABASE_URL
□ NEXTAUTH_URL (must be your Vercel URL, not localhost)
□ NEXTAUTH_SECRET
□ JWT_SECRET
□ CSRF_SECRET
□ NODE_ENV=production
```

## 🧪 Step 3: Test Endpoints

1. **Health Check:**
   ```
   https://your-app.vercel.app/api/health
   ```
   Should return JSON, not 500

2. **Home Page:**
   ```
   https://your-app.vercel.app
   ```
   Should load, not show 500

## 🔧 Step 4: Common Fixes

| Error | Fix |
|-------|-----|
| "DATABASE_URL required" | Add DATABASE_URL |
| "NEXTAUTH_SECRET missing" | Add NEXTAUTH_SECRET |
| "Connection refused" | Check DATABASE_URL, ensure DB is running |
| "Invalid NEXTAUTH_URL" | Set to your Vercel URL |

## 🚀 Step 5: Redeploy

After fixing:
1. **Deployments** → Latest → **Redeploy**
2. Wait for completion
3. Test again

