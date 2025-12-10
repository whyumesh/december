# Quick Validation Steps - Do These Now ✅

## ⚡ Fast Track to Production

Follow these steps in order to validate and deploy:

---

## Step 1: Test Locally (2 minutes)

### Option A: Test with YouTube Videos

1. **Create `.env.local` file** in project root:
   ```env
   NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
   NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
   ```

2. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C if running)
   npm run dev
   ```

3. **Visit:** `http://localhost:3000/landing`

4. **Verify:**
   - ✅ YouTube video embeds are visible
   - ✅ Videos play when clicked
   - ✅ No errors in browser console (F12)

**If this works → Your code is correct!**

---

## Step 2: Verify YouTube Videos are Accessible (1 minute)

Open these URLs in your browser:

1. **Yuva Pankh:** https://www.youtube.com/watch?v=QZJSfZsjrcQ
   - ✅ Video plays
   - ✅ Video is "Unlisted" or "Public" (not "Private")

2. **Trust Mandal:** https://www.youtube.com/watch?v=HH1bMm35-QA
   - ✅ Video plays
   - ✅ Video is "Unlisted" or "Public" (not "Private")

**If both play → Videos are ready for embedding!**

---

## Step 3: Add Environment Variables to Vercel (3 minutes)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com
   - Sign in and select your project

2. **Navigate to Environment Variables:**
   - Click **Settings** tab
   - Click **Environment Variables** in sidebar

3. **Add First Variable:**
   - Click **"Add New"**
   - **Name:** `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID`
   - **Value:** `QZJSfZsjrcQ`
   - **Environments:** Check ✅ Production ✅ Preview ✅ Development
   - Click **Save**

4. **Add Second Variable:**
   - Click **"Add New"** again
   - **Name:** `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID`
   - **Value:** `HH1bMm35-QA`
   - **Environments:** Check ✅ Production ✅ Preview ✅ Development
   - Click **Save**

**Done! Variables are now set for production.**

---

## Step 4: Deploy (2 minutes)

### Option A: Automatic (via Git)

```bash
git add .
git commit -m "Add YouTube video embeds for landing page"
git push
```

Vercel will automatically deploy your changes.

### Option B: Manual Redeploy

1. Go to Vercel Dashboard → **Deployments**
2. Find latest deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**
5. Wait for deployment to complete (~2-3 minutes)

---

## Step 5: Verify Production (2 minutes)

1. **Visit your production site:**
   - Go to: `https://your-app.vercel.app/landing`

2. **Check videos:**
   - ✅ YouTube embeds are visible (not placeholders)
   - ✅ Videos play when clicked
   - ✅ Both videos are present

3. **Check console:**
   - Press **F12** → **Console** tab
   - ✅ No red errors

4. **Test mobile:**
   - Resize browser or check on phone
   - ✅ Videos are responsive
   - ✅ Layout looks good

---

## ✅ Validation Complete!

If all steps pass, you're done! 🎉

---

## 🚨 Troubleshooting

### Videos show placeholder instead of YouTube?
→ **Fix:** Environment variables not set. Go back to Step 3.

### Videos don't play?
→ **Fix:** Check videos are "Unlisted" or "Public" on YouTube (not "Private").

### Build fails?
→ **Fix:** Check Vercel build logs. Most likely missing other environment variables (DATABASE_URL, etc.).

### Videos work locally but not in production?
→ **Fix:** You forgot to add environment variables to Vercel (Step 3). Redeploy after adding them.

---

## 📋 Quick Checklist

- [ ] Tested locally with YouTube videos
- [ ] Verified YouTube videos are accessible
- [ ] Added environment variables to Vercel
- [ ] Deployed to production
- [ ] Verified videos work on production site
- [ ] Tested on mobile

**All checked? You're production-ready! 🚀**

