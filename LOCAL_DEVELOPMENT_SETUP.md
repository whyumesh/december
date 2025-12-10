# Local Development Setup - YouTube Videos

## Quick Setup for Local Testing

To see YouTube videos locally, add these environment variables to your `.env.local` file.

### Step 1: Create/Update `.env.local`

Create a file named `.env.local` in your project root (same folder as `package.json`):

```env
# YouTube Video IDs (for landing page tutorials)
NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA
```

### Step 2: Restart Dev Server

After adding the variables, **restart your development server**:

1. Stop the current server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 3: Verify

Visit: `http://localhost:3000/landing`

You should now see YouTube video embeds instead of local video files.

---

## How It Works

- **If YouTube IDs are set** → Shows YouTube embeds (used in production)
- **If YouTube IDs are NOT set** → Falls back to local video files (for local development)

This way:
- ✅ Production uses YouTube (no deployment issues)
- ✅ Local development works with local files (no setup required)
- ✅ Can test YouTube locally by adding env vars

---

## Full `.env.local` Example

If you want to set up all environment variables for local development:

```env
# Database (if you have local database)
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# NextAuth (for local development)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret-key-min-32-chars"

# YouTube Video IDs (for landing page)
NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=QZJSfZsjrcQ
NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=HH1bMm35-QA

# Other variables as needed...
```

**Note:** `.env.local` is gitignored, so it won't be committed to your repository.

---

## Troubleshooting

**Videos still showing local files?**
- Make sure you added the variables to `.env.local` (not `.env`)
- Restart your dev server after adding variables
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)

**Want to test YouTube locally?**
- Add the two `NEXT_PUBLIC_YOUTUBE_*_ID` variables to `.env.local`
- Restart dev server
- Videos will load from YouTube

**Want to use local videos?**
- Don't add the YouTube ID variables
- Videos will automatically use local files from `/public/videos/`

---

## Production vs Local

| Environment | Video Source | Setup Required |
|------------|--------------|----------------|
| **Production (Vercel)** | YouTube | Add env vars in Vercel Dashboard |
| **Local (no env vars)** | Local files | No setup needed |
| **Local (with env vars)** | YouTube | Add to `.env.local` |

---

You're all set! 🎉

