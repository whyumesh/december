# Quick Validation Test Commands

Run these commands in sequence to validate everything before deployment.

## 1. Code Quality Checks

```bash
# Type check
npm run type-check

# Lint check
npm run lint

# Build test (simulates production build)
npm run build
```

**Expected:** All commands should complete without errors.

---

## 2. Test Production Build Locally

```bash
# Build for production
npm run build

# Start production server
npm run start
```

**Then visit:** `http://localhost:3000/landing`

**Verify:**
- Page loads
- Videos are visible (either YouTube or local fallback)
- No errors in browser console

**Stop server:** Press `Ctrl+C`

---

## 3. Test Development Server (With YouTube)

```bash
# Create .env.local (if not exists)
echo NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ > .env.local
echo NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA >> .env.local

# Start dev server
npm run dev
```

**Visit:** `http://localhost:3000/landing`

**Verify:**
- YouTube embeds are visible
- Videos play correctly

**Stop server:** Press `Ctrl+C`

---

## 4. Test Development Server (Without YouTube - Fallback)

```bash
# Remove or comment YouTube vars in .env.local
# Or temporarily rename .env.local to .env.local.backup

# Start dev server
npm run dev
```

**Visit:** `http://localhost:3000/landing`

**Verify:**
- Local video files are visible
- Videos play correctly

**Stop server:** Press `Ctrl+C`

---

## 5. Verify Environment Variables (Manual Check)

**Check `.env.local` exists and has:**
```env
NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
```

**Check Vercel Dashboard:**
- Settings → Environment Variables
- Both YouTube ID variables should be present
- Values should be correct

---

## 6. Test YouTube Video URLs

Open these URLs in browser to verify videos are accessible:

1. **Yuva Pankh:**
   - https://www.youtube.com/watch?v=QZJSfZsjrcQ
   - Should play correctly
   - Should be "Unlisted" or "Public" (not "Private")

2. **Trust Mandal:**
   - https://www.youtube.com/watch?v=HH1bMm35-QA
   - Should play correctly
   - Should be "Unlisted" or "Public" (not "Private")

---

## 7. Post-Deployment Verification

After deploying to Vercel:

1. **Visit production site:**
   ```bash
   # Replace with your actual Vercel URL
   open https://your-app.vercel.app/landing
   ```

2. **Check browser console:**
   - Open DevTools (F12)
   - Console tab
   - Should have no errors

3. **Check network requests:**
   - DevTools → Network tab
   - Refresh page
   - Should see YouTube embed requests (status 200)

---

## Quick All-in-One Test Script

Create a file `test-validation.sh` (or run commands manually):

```bash
#!/bin/bash

echo "🔍 Running validation checks..."

# Type check
echo "1. Type checking..."
npm run type-check || exit 1

# Lint check
echo "2. Linting..."
npm run lint || exit 1

# Build test
echo "3. Building..."
npm run build || exit 1

echo "✅ All checks passed!"
echo "🚀 Ready to deploy!"
```

**Windows PowerShell equivalent:**

```powershell
Write-Host "🔍 Running validation checks..."

Write-Host "1. Type checking..."
npm run type-check
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "2. Linting..."
npm run lint
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "3. Building..."
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "✅ All checks passed!"
Write-Host "🚀 Ready to deploy!"
```

---

## Expected Results

✅ **Type check:** No TypeScript errors  
✅ **Lint check:** No linting errors  
✅ **Build:** Successful build with no errors  
✅ **Local test:** Videos visible and playable  
✅ **Production test:** YouTube embeds work correctly  

If all pass, you're ready for production deployment! 🎉

