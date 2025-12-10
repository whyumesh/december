# 🚨 PRE-LAUNCH CRITICAL CHECKLIST
## Elections Starting in a Few Hours - DO NOT MISS ANY STEP!

---

## ✅ PHASE 1: ENVIRONMENT VARIABLES (MUST DO FIRST!)

### 1.1 Vercel Environment Variables - YouTube Videos

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

**Add/Verify these 2 variables:**

✅ **Variable 1:**
- Name: `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID`
- Value: `QZJSfZsjrcQ`
- Environments: ✅ Production ✅ Preview ✅ Development

✅ **Variable 2:**
- Name: `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID`
- Value: `HH1bMm35-QA`
- Environments: ✅ Production ✅ Preview ✅ Development

**⚠️ CRITICAL:** After adding, **Redeploy** your application!

---

### 1.2 Verify ALL Critical Environment Variables

Check these are set in Vercel:

✅ `DATABASE_URL` - PostgreSQL connection string
✅ `NEXTAUTH_URL` - Your Vercel production URL (e.g., `https://your-app.vercel.app`)
✅ `NEXTAUTH_SECRET` - Secure secret (32+ characters)
✅ `JWT_SECRET` - Secure secret (32+ characters)
✅ `CSRF_SECRET` - Secure secret (32+ characters)
✅ `NODE_ENV=production`
✅ `TWILIO_ACCOUNT_SID` - For SMS OTP
✅ `TWILIO_AUTH_TOKEN` - For SMS OTP
✅ `TWILIO_PHONE_NUMBER` - For SMS OTP
✅ `GMAIL_USER` - For email OTP (overseas voters)
✅ `GMAIL_APP_PASSWORD` - For email OTP
✅ `STORJ_ACCESS_KEY_ID` - For file storage
✅ `STORJ_SECRET_ACCESS_KEY` - For file storage
✅ `STORJ_ENDPOINT`
✅ `STORJ_REGION`
✅ `STORJ_BUCKET_NAME`

---

## ✅ PHASE 2: YOUTUBE VIDEOS VERIFICATION

### 2.1 Verify Videos are Accessible

**Test these URLs in your browser:**

✅ Yuva Pankh: https://www.youtube.com/watch?v=QZJSfZsjrcQ
- Video plays correctly
- Video is "Unlisted" or "Public" (NOT "Private")
- Embedding is allowed (default on YouTube)

✅ Trust Mandal: https://www.youtube.com/watch?v=HH1bMm35-QA
- Video plays correctly
- Video is "Unlisted" or "Public" (NOT "Private")
- Embedding is allowed

---

## ✅ PHASE 3: CODE VERIFICATION

### 3.1 Build Test (Local)

```bash
npm run build
```

✅ Build completes without errors
✅ No critical warnings
✅ Build succeeds

### 3.2 Verify Video Code

✅ Root page (`src/app/page.tsx`) has YouTube video IDs
✅ Landing page (`src/app/landing/page.tsx`) has YouTube video IDs
✅ Both pages have fallback to local videos
✅ No linting errors in these files

---

## ✅ PHASE 4: DEPLOYMENT

### 4.1 Deploy to Production

**Option A: Git Push (Auto-deploy)**
```bash
git add .
git commit -m "Add YouTube video embeds for production launch"
git push
```

**Option B: Manual Redeploy**
- Vercel Dashboard → Deployments → Redeploy latest

✅ Deployment succeeds
✅ Build logs show no errors
✅ Deployment status: "Ready" or "Production"

---

## ✅ PHASE 5: POST-DEPLOYMENT VERIFICATION

### 5.1 Test Production Landing Page

**Visit:** `https://your-app.vercel.app/` (root URL)

✅ Page loads without errors
✅ **YouTube video embeds are visible** (not placeholders, not local videos)
✅ Yuva Pankh video embed displays
✅ Trust Mandal video embed displays
✅ Videos are playable when clicked
✅ No JavaScript errors in console (F12 → Console)
✅ Page is responsive (test on mobile)

### 5.2 Test All Critical Pages

✅ **Root Page:** `https://your-app.vercel.app/`
- Videos work
- All content displays

✅ **Voter Login:** `https://your-app.vercel.app/voter/login`
- Page loads
- OTP sending works (test with real phone)

✅ **Voter Dashboard:** `https://your-app.vercel.app/voter/dashboard`
- Logs in correctly
- Shows available elections

✅ **Voting Pages:**
- Trustees voting works
- Yuva Pankh voting works
- Karobari voting works (if applicable)

✅ **Candidate Registration:** `https://your-app.vercel.app/candidate/signup`
- Page loads
- Form works

---

## ✅ PHASE 6: FUNCTIONALITY TESTS

### 6.1 Authentication Flow

✅ **Voter Login:**
- Enter phone number
- Receive OTP via SMS
- Verify OTP
- Login successful

✅ **Voter Login (Overseas - Email OTP):**
- Enter phone number (international format)
- Receive OTP via email
- Verify OTP
- Login successful

### 6.2 Voting Flow

✅ **Test Complete Voting Process:**
1. Login as voter
2. Select election
3. Cast vote
4. Confirm vote
5. Vote submitted successfully
6. Redirect to dashboard
7. Vote shows as "completed"

### 6.3 Error Handling

✅ **Test Error Scenarios:**
- Invalid OTP → Shows error
- Network errors → Shows error message
- Session timeout → Redirects to login
- Already voted → Shows "voted" status

---

## ✅ PHASE 7: PERFORMANCE & SECURITY

### 7.1 Performance

✅ Landing page loads quickly (< 3 seconds)
✅ Videos load without blocking page render
✅ No large file downloads (videos from YouTube, not your server)
✅ Mobile performance is acceptable

### 7.2 Security

✅ HTTPS is enabled (Vercel default)
✅ No sensitive data in console logs
✅ Authentication tokens are secure
✅ CSRF protection working

---

## ✅ PHASE 8: MONITORING SETUP

### 8.1 Vercel Monitoring

✅ Check Vercel Dashboard → Functions → Logs
- No error messages
- No 500 errors
- All API calls succeeding

✅ Check Vercel Analytics (if enabled)
- Page views tracking
- Performance metrics

### 8.2 Error Tracking

✅ Set up error monitoring (if available)
✅ Check for runtime errors
✅ Monitor API response times

---

## 🚨 CRITICAL PRE-LAUNCH FINAL CHECKS

### Last 30 Minutes Before Launch:

- [ ] ✅ All environment variables are set in Vercel
- [ ] ✅ Latest deployment is successful
- [ ] ✅ Production site tested on root URL (`/`)
- [ ] ✅ YouTube videos are visible and playable
- [ ] ✅ Voter login tested with real phone number
- [ ] ✅ OTP sending/receiving works
- [ ] ✅ Complete voting flow tested end-to-end
- [ ] ✅ Mobile devices tested
- [ ] ✅ No errors in Vercel logs
- [ ] ✅ Database connection working
- [ ] ✅ File uploads working (if needed)
- [ ] ✅ All critical pages accessible

---

## 🔧 QUICK FIXES IF ISSUES FOUND

### Issue: YouTube Videos Not Showing

**Fix:**
1. Check environment variables are set in Vercel
2. Verify variable names are exactly correct (case-sensitive)
3. Redeploy after adding variables
4. Clear browser cache (Ctrl+Shift+R)

### Issue: Videos Show But Don't Play

**Fix:**
1. Verify videos are "Unlisted" or "Public" (not "Private")
2. Check video IDs are correct (no extra spaces)
3. Test video URLs directly in browser

### Issue: OTP Not Sending

**Fix:**
1. Check Twilio credentials in Vercel
2. Verify Twilio account is active
3. Check phone number format
4. Check Vercel function logs for errors

### Issue: Database Connection Errors

**Fix:**
1. Verify `DATABASE_URL` is correct in Vercel
2. Check database is accessible
3. Verify SSL mode is set if required
4. Check database connection limits

### Issue: Build Fails

**Fix:**
1. Check build logs in Vercel
2. Verify all environment variables are set
3. Check for TypeScript errors (should be ignored)
4. Verify Prisma generation succeeds

---

## 📞 EMERGENCY CONTACTS & RESOURCES

### If Something Breaks:

1. **Check Vercel Dashboard:**
   - Deployments → Latest → Logs
   - Functions → Logs
   - Settings → Environment Variables

2. **Quick Rollback:**
   - Vercel Dashboard → Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

3. **Test Environment:**
   - Use Preview deployments to test fixes
   - Don't test fixes directly on production

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

**Before Elections Start:**

- [ ] All environment variables set ✅
- [ ] Production deployment successful ✅
- [ ] YouTube videos working on production ✅
- [ ] Root page (`/`) displays correctly ✅
- [ ] Voter login tested and working ✅
- [ ] Complete voting flow tested ✅
- [ ] Mobile devices tested ✅
- [ ] No errors in production logs ✅
- [ ] All critical pages accessible ✅
- [ ] Error handling working ✅
- [ ] Performance acceptable ✅
- [ ] Security verified ✅

---

## 🎯 SUCCESS CRITERIA

You're ready for launch when:

✅ All checks above are completed
✅ Production site works correctly
✅ No critical errors
✅ All features tested and working
✅ Monitoring in place

**If ALL checked → YOU'RE READY! 🚀**

---

## ⚠️ REMEMBER

1. **Environment variables MUST be set in Vercel** - Not just locally
2. **Redeploy after adding environment variables**
3. **Test on production URL** - Not just localhost
4. **Test with real phone numbers** - Don't just assume it works
5. **Monitor logs during launch** - Watch for errors
6. **Have rollback plan ready** - Know how to revert if needed

**Good luck with the elections! 🗳️**

