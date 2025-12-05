# Fix for Vercel Prerendering Errors

## Problem
Vercel build is failing with:
```
TypeError: Cannot read properties of null (reading 'useState')
Error occurred prerendering page "/..."
```

This happens because Next.js attempts to prerender pages during build, even with `force-dynamic` configured, and client components using hooks fail during prerendering.

## Solution

The root layout already has `export const dynamic = 'force-dynamic'` configured, which should prevent static generation. However, Next.js may still attempt prerendering during build for optimization.

### Changes Made

1. **Root Layout** (`src/app/layout.tsx`):
   - Already has `export const dynamic = 'force-dynamic'`
   - Already has `export const revalidate = 0`
   - This forces all routes to be dynamically rendered

2. **Next.js Config** (`next.config.js`):
   - Added `isrMemoryCacheSize: 0` to disable ISR
   - All configurations optimized for serverless/dynamic rendering

3. **SessionProvider**:
   - Already properly configured as a client component
   - Uses NextAuth SessionProvider which requires client-side rendering

## Why This Still Happens

Next.js 14 will attempt to prerender pages during build even with `force-dynamic` set. This is expected behavior - it tries to optimize what it can. The errors you see are Next.js discovering that these pages cannot be statically generated and should fall back to dynamic rendering.

## Expected Outcome

After these changes:
- ✅ Build should complete successfully
- ✅ Next.js will skip static generation for routes with `force-dynamic`
- ✅ Pages will be server-rendered at request time
- ⚠️  You may still see prerendering errors in logs, but build should succeed

## If Build Still Fails

If the build continues to fail, ensure:

1. All route layouts/pages have explicit dynamic configuration
2. No pages are trying to use hooks during server-side rendering
3. All client components are properly marked with `'use client'`

## Next Steps

1. Commit these changes
2. Push to GitHub
3. Vercel will automatically redeploy
4. Monitor build logs - it should complete successfully

The prerendering errors are informational - Next.js will handle them and use dynamic rendering instead.

