# Page-Level Error Debugging

## ✅ Good News: API Routes Work!

The `/api/health` endpoint is working, which means:
- ✅ Environment variables are set correctly
- ✅ API routes are functioning
- ✅ The app is deployed and running

## 🔍 The Error is Likely on a Specific Page

Since API routes work but you're seeing "Internal server error", it's probably happening on a **page route**, not an API route.

## 📋 Questions to Help Debug:

1. **Which page/URL shows the error?**
   - Home page (`/`)?
   - A specific route (e.g., `/voter/login`, `/admin/dashboard`)?
   - All pages?

2. **When does the error appear?**
   - Immediately on page load?
   - After clicking something?
   - On a specific action?

## 🧪 Quick Tests:

### Test 1: Home Page
Visit: `https://your-app.vercel.app/`
- Does it load?
- Or does it show "Internal server error"?

### Test 2: Check Browser Console
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Visit the page that shows the error
4. **Copy any error messages** you see

### Test 3: Check Network Tab
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Visit the page that shows the error
4. Look for any failed requests (red)
5. Click on failed requests to see error details

## 🔧 Common Page-Level Issues:

### 1. NextAuth SessionProvider Error
**Symptom:** Error on pages that use authentication

**Check:** Browser console for NextAuth errors

**Fix:** Already handled with error boundary, but check logs

### 2. Client Component Error
**Symptom:** Error during page render

**Check:** Browser console for React errors

**Fix:** Check which component is failing

### 3. Database Query Error
**Symptom:** Error when page tries to fetch data

**Check:** Vercel function logs for that specific page route

**Fix:** Check database connection and queries

## 📊 Next Steps:

1. **Tell me which page shows the error** (home page, specific route, etc.)
2. **Check browser console** and share any errors
3. **Check Vercel function logs** for that specific page route:
   - Vercel Dashboard → Deployments → Latest
   - Functions tab → Find the page route (e.g., `/` for home page)
   - Check Logs section

The error message will tell us exactly what's wrong!

