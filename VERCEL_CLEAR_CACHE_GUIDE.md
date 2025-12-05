# How to Clear Vercel Build Cache

## Method 1: Force Redeploy (Easiest)

1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click on the **latest deployment**
3. Click the **⋯** (three dots) menu
4. Select **"Redeploy"**
5. Check **"Use existing Build Cache"** - **UNCHECK THIS** (important!)
6. Click **"Redeploy"**

This will force a fresh build without using cached files.

## Method 2: Add Empty Commit (Alternative)

If you can't find the redeploy option, force a new build by adding an empty commit:

```bash
git commit --allow-empty -m "Force rebuild - clear cache"
git push
```

This will trigger a new deployment with a fresh build.

## Method 3: Update vercel.json to Force Rebuild

Add a comment or change to `vercel.json` to trigger a rebuild:

```json
{
  "buildCommand": "prisma generate && next build",
  "installCommand": "npm install --legacy-peer-deps",
  "framework": "nextjs",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "regions": ["iad1"],
  "_comment": "Updated to force rebuild"
}
```

Then commit and push.

## Method 4: Delete .next Folder Locally (If Building Locally)

If you're testing locally first:

```bash
rm -rf .next
npm run build
```

## Method 5: Check Vercel Project Settings

Sometimes the cache clear option is in a different location:

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** (gear icon)
3. Look for:
   - **General** tab → Scroll to bottom
   - **Build & Development Settings** → Look for cache options
   - **Advanced** tab → May have cache settings

## Recommended Approach

**Use Method 1 (Redeploy without cache)** - This is the most reliable way to ensure a fresh build.

If that's not available, use **Method 2 (empty commit)** to force a new deployment.

## After Clearing Cache

Once you've forced a fresh build:
1. Monitor the build logs to ensure `prisma generate` runs successfully
2. Check that Prisma client is being included
3. Verify API routes work after deployment

