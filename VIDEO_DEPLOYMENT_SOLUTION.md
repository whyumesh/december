# Video Deployment Solution for Vercel

## Problem
Large video files in `public/videos/` are causing Vercel deployment failures. Vercel has limits on static file sizes and build sizes.

## Vercel Limits
- **Individual static file limit**: 100MB (Hobby plan)
- **Total deployment size**: Can cause timeouts if too large
- **Build timeout**: 45 minutes (Hobby), but large files can slow deployment

## Solutions (Choose One)

### Solution 1: Host Videos Externally (RECOMMENDED)

Host videos on a CDN or video hosting service:

1. **Cloudinary** (Recommended for videos)
   - Free tier: 25GB storage, 25GB bandwidth/month
   - Automatic video optimization
   - Easy to integrate

2. **AWS S3 + CloudFront**
   - Scalable and reliable
   - Requires AWS account setup

3. **YouTube/Vimeo** (Free option)
   - Upload videos as unlisted/private
   - Embed using iframe
   - No storage costs

4. **Cloudflare R2**
   - S3-compatible
   - Free tier: 10GB storage/month

### Solution 2: Compress Videos (If keeping in repo)

Use FFmpeg to compress videos:

```bash
# Install FFmpeg first, then:
ffmpeg -i "Yuva Pankh Demo.mp4" -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 128k "Yuva Pankh Demo-compressed.mp4"
ffmpeg -i "Trust Mandal Demo.mp4" -vcodec libx264 -crf 28 -preset slow -acodec aac -b:a 128k "Trust Mandal Demo-compressed.mp4"
```

Target: Keep videos under 20-30MB each if possible.

### Solution 3: Use .vercelignore (Temporary Fix)

Add videos to `.vercelignore` to exclude from deployment, then host externally.

## Implementation Steps

### Option A: Use Cloudinary (Easiest)

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Upload videos to Cloudinary
3. Get video URLs from Cloudinary dashboard
4. Update landing page to use Cloudinary URLs

### Option B: Compress Videos

1. Install FFmpeg
2. Compress both videos
3. Replace original videos with compressed versions
4. Test locally, then deploy

### Option C: Use YouTube Embed

1. Upload videos to YouTube as unlisted
2. Get embed URLs
3. Update landing page to use YouTube embeds

## Quick Fix: Update Landing Page

See `src/app/landing/page.tsx` for video references. Update video sources to external URLs once videos are hosted.

