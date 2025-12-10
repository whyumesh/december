# Pre-Deployment Validation Checklist ✅

Complete validation guide to ensure everything works before and after production deployment.

---

## 📋 Phase 1: Local Validation

### Step 1: Test Local Videos (Fallback)
**Purpose:** Verify fallback to local videos works

1. **Ensure `.env.local` does NOT have YouTube IDs** (or temporarily remove them)
2. **Start dev server:**
   ```bash
   npm run dev
   ```
3. **Visit:** `http://localhost:3000/landing`
4. **Verify:**
   - [ ] Local video files load and play
   - [ ] Both videos (Yuva Pankh & Trust Mandal) are visible
   - [ ] Videos are playable and controls work
   - [ ] No console errors (check browser DevTools → Console)

---

### Step 2: Test YouTube Videos Locally
**Purpose:** Verify YouTube embeds work locally (same as production)

1. **Create/Update `.env.local`** with:
   ```env
   NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
   NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Visit:** `http://localhost:3000/landing`
4. **Verify:**
   - [ ] YouTube embeds load (not local videos)
   - [ ] Both videos are visible
   - [ ] Videos play when clicked
   - [ ] Videos are responsive (test on mobile/tablet view)
   - [ ] No console errors
   - [ ] Videos load from YouTube (check Network tab → should see youtube.com requests)

---

### Step 3: Code Quality Checks

1. **Run linter:**
   ```bash
   npm run lint
   ```
   - [ ] No linting errors

2. **Type check:**
   ```bash
   npm run type-check
   ```
   - [ ] No TypeScript errors

3. **Build locally (test production build):**
   ```bash
   npm run build
   ```
   - [ ] Build succeeds without errors
   - [ ] No warnings about missing environment variables
   - [ ] Build completes successfully

4. **Test production build locally:**
   ```bash
   npm run start
   ```
   - [ ] Server starts
   - [ ] Landing page loads
   - [ ] Videos work (check if YouTube IDs are in build)

---

## 📋 Phase 2: Environment Variables Setup

### Step 4: Verify Vercel Environment Variables

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Select your project
   - Go to **Settings** → **Environment Variables**

2. **Add/Verify Required YouTube Variables:**

   **Variable 1:**
   - [ ] Name: `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID`
   - [ ] Value: `QZJSfZsjrcQ`
   - [ ] Environment: ✅ Production ✅ Preview ✅ Development

   **Variable 2:**
   - [ ] Name: `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID`
   - [ ] Value: `HH1bMm35-QA`
   - [ ] Environment: ✅ Production ✅ Preview ✅ Development

3. **Verify Other Critical Variables:**
   - [ ] `DATABASE_URL` is set
   - [ ] `NEXTAUTH_URL` matches your Vercel domain
   - [ ] `NEXTAUTH_SECRET` is set (32+ characters)
   - [ ] `JWT_SECRET` is set (32+ characters)
   - [ ] `CSRF_SECRET` is set (32+ characters)
   - [ ] `NODE_ENV=production` is set

---

## 📋 Phase 3: Pre-Deployment Verification

### Step 5: Verify YouTube Videos are Public/Unlisted

1. **Check Yuva Pankh Video:**
   - Visit: https://www.youtube.com/watch?v=QZJSfZsjrcQ
   - [ ] Video is accessible (not Private)
   - [ ] Video plays correctly
   - [ ] Embedding is allowed (YouTube settings)

2. **Check Trust Mandal Video:**
   - Visit: https://www.youtube.com/watch?v=HH1bMm35-QA
   - [ ] Video is accessible (not Private)
   - [ ] Video plays correctly
   - [ ] Embedding is allowed (YouTube settings)

**Note:** Videos should be "Unlisted" or "Public" (not "Private") for embedding to work.

---

### Step 6: Verify Video Files are Excluded from Deployment

1. **Check `.vercelignore`:**
   - [ ] `public/videos/*.mp4` is listed
   - [ ] This prevents large video files from being deployed

2. **Verify file exists locally:**
   - [ ] `public/videos/Yuva Pankh Demo.mp4` exists (for local fallback)
   - [ ] `public/videos/Trust Mandal Demo.mp4` exists (for local fallback)

---

## 📋 Phase 4: Deploy to Production

### Step 7: Deploy

1. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Add YouTube video embeds for landing page"
   git push
   ```
   - [ ] All changes committed
   - [ ] Changes pushed to repository

2. **OR manually redeploy in Vercel:**
   - Go to Vercel Dashboard → Deployments
   - Click "..." on latest deployment
   - Select "Redeploy"
   - [ ] Deployment triggered

3. **Monitor deployment:**
   - [ ] Build succeeds
   - [ ] No errors in build logs
   - [ ] Deployment completes successfully

---

## 📋 Phase 5: Post-Deployment Validation

### Step 8: Verify Production Site

1. **Visit landing page:**
   - Go to: `https://your-app.vercel.app/landing`
   - [ ] Page loads without errors
   - [ ] No white/blank page

2. **Check YouTube Videos:**
   - [ ] Yuva Pankh video embed is visible
   - [ ] Trust Mandal video embed is visible
   - [ ] Videos are responsive (test on mobile)
   - [ ] Videos play when clicked
   - [ ] No placeholder messages showing

3. **Browser Console Check:**
   - Open DevTools (F12) → Console tab
   - [ ] No JavaScript errors
   - [ ] No 404 errors for videos
   - [ ] No CORS errors

4. **Network Check:**
   - Open DevTools → Network tab
   - Refresh page
   - [ ] YouTube embed requests succeed (status 200)
   - [ ] No failed requests

5. **Mobile Testing:**
   - [ ] Open site on mobile device
   - [ ] Videos are visible
   - [ ] Videos play correctly
   - [ ] Layout is responsive

---

### Step 9: Verify Environment Variables in Production

1. **Check if variables are loaded:**
   - Visit: `https://your-app.vercel.app/landing`
   - Open browser DevTools → Console
   - Type: `console.log(process.env.NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID)`
   - Should show: `QZJSfZsjrcQ` (in browser, it may show undefined in console, but video should still work)

2. **Verify in Vercel Dashboard:**
   - Go to Settings → Environment Variables
   - [ ] Both YouTube ID variables are present
   - [ ] Values are correct
   - [ ] Production environment is selected

---

### Step 10: Final Checks

1. **Performance Check:**
   - [ ] Landing page loads quickly (< 3 seconds)
   - [ ] Videos load without blocking page render
   - [ ] No large file downloads (videos are from YouTube, not your server)

2. **Functionality Check:**
   - [ ] All other pages work (not just landing page)
   - [ ] Navigation works
   - [ ] No broken links

3. **Error Monitoring:**
   - Check Vercel Dashboard → Functions → Logs
   - [ ] No runtime errors
   - [ ] No 500 errors

---

## 🎯 Quick Validation Script

Run these commands to quickly validate:

```bash
# 1. Build test
npm run build

# 2. Type check
npm run type-check

# 3. Lint check
npm run lint

# All should pass without errors
```

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Local build succeeds
- ✅ YouTube videos work locally (with env vars)
- ✅ Local videos work as fallback (without env vars)
- ✅ Environment variables are set in Vercel
- ✅ YouTube videos are accessible (Unlisted/Public)
- ✅ Production deployment succeeds
- ✅ Production site shows YouTube embeds
- ✅ Videos play correctly in production
- ✅ No console errors
- ✅ Mobile responsive

---

## 🚨 Common Issues & Fixes

### Issue: Videos show placeholder instead of YouTube
**Fix:** 
- Check environment variables are set in Vercel
- Ensure variables are set for Production environment
- Redeploy after adding variables

### Issue: Videos don't play
**Fix:**
- Verify YouTube videos are "Unlisted" or "Public" (not "Private")
- Check video IDs are correct (no extra spaces)
- Verify embedding is enabled on YouTube

### Issue: Build fails
**Fix:**
- Check build logs in Vercel
- Verify all environment variables are set
- Check for TypeScript/lint errors locally first

### Issue: Videos load but page is slow
**Fix:**
- This is normal - videos are loaded from YouTube (external)
- Lazy loading is enabled (videos load when scrolled into view)
- This is actually better than hosting videos yourself

---

## 📝 Final Checklist Before Going Live

- [ ] All Phase 1 checks completed
- [ ] All Phase 2 checks completed
- [ ] All Phase 3 checks completed
- [ ] Production deployment successful
- [ ] All Phase 5 checks completed
- [ ] Tested on mobile device
- [ ] No console errors
- [ ] Videos play correctly

**If all checked ✅ - You're ready for production!** 🎉

---

## 🔗 Quick Reference

- **Local Test (YouTube):** Add vars to `.env.local` → Restart server
- **Local Test (Local Files):** Don't add YouTube vars → Use local videos
- **Production:** Add vars in Vercel Dashboard → Redeploy
- **YouTube Video IDs:**
  - Yuva Pankh: `QZJSfZsjrcQ`
  - Trust Mandal: `HH1bMm35-QA`

