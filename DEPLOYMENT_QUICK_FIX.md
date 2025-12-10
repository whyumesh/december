# Quick Fix for Video Deployment Error on Vercel

## Immediate Solutions (Choose One)

### ✅ Solution 1: Compress Videos (Recommended - 5 minutes)

If your videos are larger than 30-50MB, compress them:

**Using FFmpeg:**
```bash
# Install FFmpeg: https://ffmpeg.org/download.html

# Compress Yuva Pankh video
ffmpeg -i "public/videos/Yuva Pankh Demo.mp4" -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 128k "public/videos/Yuva Pankh Demo-compressed.mp4"

# Compress Trust Mandal video  
ffmpeg -i "public/videos/Trust Mandal Demo.mp4" -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 128k "public/videos/Trust Mandal Demo-compressed.mp4"
```

Then replace the original files with compressed versions.

**Using Online Tools:**
- [CloudConvert](https://cloudconvert.com/mp4-compressor) - Free online compressor
- [HandBrake](https://handbrake.fr/) - Free desktop app

**Target:** Keep videos under 20-30MB each for easier deployment.

---

### ✅ Solution 2: Host Videos on Cloudinary (Best for Production - 10 minutes)

1. **Sign up at [Cloudinary](https://cloudinary.com)** (free tier available)

2. **Upload your videos:**
   - Go to Media Library → Upload
   - Upload both video files
   - Set upload mode to "Unlisted" or "Public"

3. **Get video URLs:**
   - Click on each video
   - Copy the "Secure URL" (HTTPS)

4. **Add to Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     ```
     NEXT_PUBLIC_VIDEO_YUVA_PANKH = https://res.cloudinary.com/your-cloud/video/upload/v1234/yuva-pankh.mp4
     NEXT_PUBLIC_VIDEO_TRUST_MANDAL = https://res.cloudinary.com/your-cloud/video/upload/v1234/trust-mandal.mp4
     ```

5. **Deploy:**
   - The landing page will automatically use these URLs
   - Videos won't be included in your deployment

---

### ✅ Solution 3: Use YouTube Embed (Free - 5 minutes)

1. **Upload to YouTube:**
   - Create a YouTube channel (if needed)
   - Upload videos as "Unlisted" (private but shareable)
   - Get the video IDs from URLs

2. **Update landing page:**
   - Replace `<video>` tags with YouTube embeds
   - See code example below

---

### ✅ Solution 4: Temporary Workaround - Exclude Videos

If you need to deploy immediately:

1. **Add videos to `.vercelignore`:**
   ```
   public/videos/*.mp4
   ```

2. **Upload videos to a temporary hosting service:**
   - Use [Imgur](https://imgur.com) or [Google Drive](https://drive.google.com) (make public)
   - Update environment variables with URLs

3. **Deploy and then migrate to proper hosting**

---

## Current Status

✅ Landing page updated to support environment variables
✅ Videos use lazy loading for better performance
✅ Preload set to "none" to reduce initial load

## Next Steps

1. Choose one solution above
2. If using Solution 2 or 3, add environment variables to Vercel
3. Deploy your changes
4. Test videos load correctly

---

## YouTube Embed Alternative Code

If you want to use YouTube instead:

```tsx
<iframe
  className="w-full h-full"
  src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
  title="Yuva Pankh Demo"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>
```

Replace `YOUR_VIDEO_ID` with actual YouTube video IDs.

---

## Why This Happens

- Vercel free/hobby plan has 100MB limit per static file
- Large videos slow down deployment and can cause timeouts
- Total deployment size matters for build times
- External hosting is better for performance and costs

