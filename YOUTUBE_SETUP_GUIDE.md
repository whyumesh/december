# YouTube Video Setup Guide

## Step-by-Step Instructions

### Step 1: Upload Videos to YouTube

1. **Go to YouTube Studio**
   - Visit [youtube.com](https://youtube.com)
   - Sign in with your Google account
   - Click your profile icon → **YouTube Studio**

2. **Upload Your Videos**
   - Click **"Create"** button (top right) → **"Upload videos"**
   - Upload "Yuva Pankh Demo.mp4"
   - Then upload "Trust Mandal Demo.mp4"

3. **Set Video Privacy to "Unlisted"** (Important!)
   - When uploading, set visibility to **"Unlisted"**
   - Unlisted videos are:
     - ✅ Not searchable on YouTube
     - ✅ Only accessible via direct link
     - ✅ Perfect for tutorials embedded on your site
     - ✅ Won't appear in your channel's public videos

4. **Fill Video Details** (Optional but recommended)
   - **Title**: "How to Vote - Yuva Pankh Election" (or similar)
   - **Description**: "Tutorial video for Yuva Pankh Samiti elections"
   - **Thumbnail**: Upload a custom thumbnail if desired

5. **Publish Both Videos**
   - Click **"Publish"** for each video after uploading

---

### Step 2: Get YouTube Video IDs

After uploading, you'll get a URL like:
```
https://www.youtube.com/watch?v=ABC123XYZ789
                                    ^^^^^^^^^^^^
                                    This is your Video ID
```

**For each video:**

1. Go to your YouTube Studio → **Content**
2. Click on the video
3. Copy the **Video ID** from the URL or the video details

**Example:**
- Yuva Pankh video URL: `https://www.youtube.com/watch?v=QZJSfZsjrcQ`
- Video ID: `QZJSfZsjrcQ`

- Trust Mandal video URL: `https://www.youtube.com/watch?v=HH1bMm35-QA`
- Video ID: `HH1bMm35-QA`

---



### Step 3: Add Environment Variables to Vercel

1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in and select your project

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab
   - Click **Environment Variables** in the sidebar

3. **Add Two Environment Variables**

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID`
   - **Value**: `[Your Yuva Pankh Video ID]` (e.g., `dQw4w9WgXcQ`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID`
   - **Value**: `[Your Trust Mandal Video ID]` (e.g., `xyz123abc456`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy Your Application**
   - Go to **Deployments** tab
   - Click the **"..."** menu on the latest deployment
   - Select **"Redeploy"**
   - Or push a new commit to trigger automatic deployment

---

### Step 4: Test Locally (Optional)

To test locally before deploying:

1. **Create/Update `.env.local` file** in your project root:
   ```env
   NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID=dQw4w9WgXcQ
   NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID=xyz123abc456
   ```
   (Replace with your actual video IDs)

2. **Restart your dev server:**
   ```bash
   npm run dev
   ```

3. **Visit your landing page:**
   - Go to `http://localhost:3000/landing`
   - Verify both videos load correctly

---

## Quick Reference

### Environment Variables Needed:
- `NEXT_PUBLIC_YOUTUBE_YUVA_PANKH_ID` - YouTube video ID for Yuva Pankh tutorial
- `NEXT_PUBLIC_YOUTUBE_TRUST_MANDAL_ID` - YouTube video ID for Trust Mandal tutorial

### Video Privacy Settings:
- ✅ **Unlisted** - Recommended (only accessible via link/embed)
- ❌ **Private** - Won't work for embedding
- ⚠️ **Public** - Works but videos will be searchable

---

## Troubleshooting

### Videos not showing?
1. ✅ Check video IDs are correct (no extra spaces)
2. ✅ Verify videos are set to "Unlisted" or "Public" (not "Private")
3. ✅ Ensure environment variables are added to all environments (Production, Preview, Development)
4. ✅ Redeploy after adding environment variables
5. ✅ Check browser console for errors

### Videos showing placeholder?
- Environment variables are not set or not deployed yet
- Add variables to Vercel and redeploy

### Want to test before adding to Vercel?
- Use `.env.local` file locally (see Step 4)

---

## Benefits of YouTube Hosting

✅ **No deployment size limits** - Videos hosted externally  
✅ **Free CDN** - Fast global delivery  
✅ **Automatic optimization** - YouTube handles video encoding  
✅ **Mobile-friendly** - Responsive embeds  
✅ **Analytics** - Track views in YouTube Studio  
✅ **No storage costs** - Unlimited free storage  

---

## Next Steps

1. Upload both videos to YouTube (Step 1)
2. Get video IDs (Step 2)
3. Add environment variables to Vercel (Step 3)
4. Redeploy your application
5. Test on production site

Your videos will now load from YouTube and won't cause any deployment errors! 🎉

