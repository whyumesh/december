# 🚨 EMERGENCY PRODUCTION CHECKLIST
## Critical Steps Before Elections Launch (Next Few Hours)

---

## ⚡ IMMEDIATE ACTIONS (Do These NOW)

### 1. Add YouTube Video Environment Variables to Vercel ⏰

**CRITICAL - DO THIS FIRST:**

1. Go to: **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

2. **Add these 2 variables:**
   ```
   NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID = QZJSfZsjrcQ
   NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID = HH1bMm35-QA
   ```

3. **Set for ALL environments:** ✅ Production ✅ Preview ✅ Development

4. **Click Save for each variable**

5. **Redeploy immediately:**
   - Go to Deployments → Click "..." → "Redeploy"

---

### 2. Verify YouTube Videos Work ✅

**After redeployment, test:**

- Visit: `https://your-app.vercel.app/`
- ✅ YouTube video embeds are visible (NOT local videos, NOT placeholders)
- ✅ Videos play when clicked
- ✅ Both videos (Yuva Pankh & Trust Mandal) are present

**If videos don't show:**
- Check environment variables are set correctly in Vercel
- Verify you redeployed after adding variables
- Clear browser cache

---

### 3. Test Critical User Flows 🔍

**Test as a REAL USER would:**

**A. Voter Login Flow:**
1. Go to `/voter/login`
2. Enter a real phone number
3. ✅ OTP is received via SMS
4. ✅ Enter OTP and login
5. ✅ Redirected to dashboard

**B. Complete Voting Flow:**
1. Login as voter
2. Select an election
3. ✅ Cast your vote
4. ✅ Confirm vote
5. ✅ Vote submitted successfully
6. ✅ Shows as "completed" on dashboard

**C. Mobile Testing:**
1. ✅ Open site on mobile device
2. ✅ Videos are visible and playable
3. ✅ Voting interface works on mobile
4. ✅ OTP login works on mobile

---

### 4. Verify Environment Variables 🔑

**Check ALL these are set in Vercel:**

**Critical (Must Have):**
- ✅ `DATABASE_URL`
- ✅ `NEXTAUTH_URL` (must be your production URL)
- ✅ `NEXTAUTH_SECRET`
- ✅ `JWT_SECRET`
- ✅ `CSRF_SECRET`
- ✅ `NODE_ENV=production`

**For OTP/SMS:**
- ✅ `TWILIO_ACCOUNT_SID`
- ✅ `TWILIO_AUTH_TOKEN`
- ✅ `TWILIO_PHONE_NUMBER`

**For Email OTP (Overseas voters):**
- ✅ `GMAIL_USER`
- ✅ `GMAIL_APP_PASSWORD`

**For File Storage:**
- ✅ `STORJ_ACCESS_KEY_ID`
- ✅ `STORJ_SECRET_ACCESS_KEY`
- ✅ `STORJ_ENDPOINT`
- ✅ `STORJ_REGION`
- ✅ `STORJ_BUCKET_NAME`

**For Videos:**
- ✅ `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ`
- ✅ `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA`

---

### 5. Check Production Logs 📊

**In Vercel Dashboard:**

1. Go to **Functions** → **Logs**
2. ✅ No error messages
3. ✅ No 500 errors
4. ✅ API calls succeeding

**Watch logs during first few votes:**
- Monitor for any errors
- Check response times
- Verify database connections

---

## ✅ CODE VERIFICATION

**All code changes are complete:**
- ✅ Root page (`/`) has YouTube video support
- ✅ Landing page (`/landing`) has YouTube video support
- ✅ Fallback to local videos if YouTube IDs not set
- ✅ No linting errors in video-related code
- ✅ Videos excluded from deployment (`.vercelignore`)

---

## 🚨 IF SOMETHING BREAKS

### Quick Fixes:

**Videos Not Showing:**
1. Check env vars in Vercel
2. Redeploy
3. Clear browser cache

**OTP Not Sending:**
1. Check Twilio credentials
2. Verify Twilio account active
3. Check function logs

**Database Errors:**
1. Check `DATABASE_URL` in Vercel
2. Verify database is accessible
3. Check connection limits

**Build Fails:**
1. Check build logs
2. Verify all env vars set
3. Previous deployment should still work

### Emergency Rollback:

1. Go to Vercel → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

---

## 📋 FINAL CHECKLIST (Do ALL Before Launch)

**30 Minutes Before Elections:**

- [ ] ✅ YouTube video env vars added to Vercel
- [ ] ✅ Redeployed after adding env vars
- [ ] ✅ Videos visible on production site
- [ ] ✅ Videos play correctly
- [ ] ✅ Voter login tested with real phone
- [ ] ✅ OTP received and verified
- [ ] ✅ Complete voting flow tested
- [ ] ✅ Mobile devices tested
- [ ] ✅ All environment variables verified
- [ ] ✅ No errors in production logs
- [ ] ✅ Database connection working
- [ ] ✅ All critical pages accessible
- [ ] ✅ Error handling tested

---

## 🎯 SUCCESS = READY FOR LAUNCH

**You're ready when:**
- ✅ All items above checked
- ✅ Production site works perfectly
- ✅ Real users can vote without issues
- ✅ No critical errors

---

## 📞 MONITORING DURING LAUNCH

**During first hour:**
- Watch Vercel logs continuously
- Monitor error rates
- Check database performance
- Verify OTP delivery
- Test voting flow periodically

**If issues occur:**
- Check logs immediately
- Apply quick fixes
- Have rollback ready

---

**Good luck with your elections! 🗳️ Everything is ready!**

