# Troubleshooting: Environment Variables Not Loading

## Issue: YouTube videos not showing after adding to .env.local

### ✅ Solution Steps:

1. **Verify .env.local format** (important - no extra spaces!)
   
   Your `.env.local` should look exactly like this:
   ```env
   NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
   NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
   ```
   
   **Common mistakes:**
   - ❌ Extra spaces before variable name
   - ❌ Extra spaces around `=`
   - ❌ Quotes around values (not needed)
   - ❌ Missing `NEXT_PUBLIC_` prefix

2. **Restart Dev Server** (CRITICAL!)
   
   Next.js only loads environment variables when it starts. You MUST restart:
   
   ```bash
   # Stop the server (Ctrl+C in terminal)
   # Then restart:
   npm run dev
   ```
   
   **Don't just save the file - fully restart!**

3. **Clear Browser Cache**
   
   Sometimes the browser caches the old version:
   - **Chrome/Edge:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or open in Incognito/Private window

4. **Verify Variables are Loading**
   
   Add this temporarily to your landing page to check:
   ```tsx
   console.log('Yuva Pankh ID:', process.env.NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID);
   console.log('Trust Mandal ID:', process.env.NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID);
   ```
   
   Open browser console (F12) and check if values appear.

---

## Quick Fix Checklist

- [ ] `.env.local` file is in project root (same folder as `package.json`)
- [ ] Variables have no extra spaces
- [ ] Variables start with `NEXT_PUBLIC_`
- [ ] Dev server was **completely stopped** and restarted
- [ ] Browser cache cleared or incognito window used
- [ ] Visiting `http://localhost:3000/landing`

---

## Still Not Working?

### Check .env.local location

The file must be in the **root directory** (same folder as `package.json`):

```
your-project/
├── package.json
├── .env.local          ← HERE
├── next.config.js
├── src/
└── public/
```

### Check file format

Open `.env.local` and ensure:
- No BOM (Byte Order Mark) - save as UTF-8 without BOM
- Unix line endings (LF) not Windows (CRLF)
- No trailing spaces

### Verify in code

Add temporary debug code at the top of your component:

```tsx
export default function LandingPage() {
    console.log('Env check:', {
        yuva: process.env.NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID,
        trust: process.env.NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID
    });
    // ... rest of component
}
```

Check browser console - if `undefined`, variables aren't loading.

---

## Why This Happens

1. **Next.js loads env vars at startup** - must restart server
2. **Client components** - `NEXT_PUBLIC_*` vars are embedded at build time
3. **Caching** - browser may cache old JavaScript bundle

---

## Alternative: Hardcode for Testing (Not for Production!)

If you just want to test quickly, you can temporarily hardcode:

```tsx
const yuvaPankhVideoId = process.env.NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID || 'QZJSfZsjrcQ';
const trustMandalVideoId = process.env.NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID || 'HH1bMm35-QA';
```

But **remove this before production** - use environment variables instead!

