# Fix: Cannot find module 'next/dist/compiled/ws'

## Problem
Vercel deployment fails with:
```
Cannot find module 'next/dist/compiled/ws'
```

This is an **internal Next.js module** that should be included automatically.

## Root Cause

The `outputFileTracingExcludes` configuration was too aggressive and was excluding Next.js internal compiled modules. The `**/*.ts` exclusion pattern was catching Next.js internal files.

## Solution Applied

### 1. Updated `outputFileTracingExcludes`
- Added exception: `'!node_modules/next/dist/**'`
- This ensures all Next.js internal modules are included
- Next.js needs its compiled modules at runtime

### 2. Updated Webpack Externals
- Ensured Next.js and its internal modules are NOT externalized
- Ensured `ws` is NOT externalized
- Next.js must be bundled, not externalized

### 3. Added `ws` Package
- Added `"ws": "^8.18.0"` to dependencies
- This provides the WebSocket implementation Next.js needs

## Next Steps

1. **Commit and push:**
   ```bash
   git add next.config.js package.json
   git commit -m "Fix missing next/dist/compiled/ws module"
   git push
   ```

2. **Vercel will automatically redeploy**

## Why This Happened

Next.js uses `next/dist/compiled/ws` internally for:
- Server-side WebSocket functionality
- Hot Module Replacement (HMR) in development
- Internal Next.js server features

Our output file tracing exclusions were too broad and accidentally excluded these required modules.

## Verification

After redeploying, the error should be resolved. The app should start successfully on Vercel.

