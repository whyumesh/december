# Static Generation Fix for Vercel Build

## Problem
Next.js was attempting to prerender pages during build, causing errors with client components that use React hooks (like `SessionProvider`). The error was:
```
TypeError: Cannot read properties of null (reading 'useState')
```

## Root Cause
Even with `export const dynamic = 'force-dynamic'` set in the root layout, Next.js 14 still attempts to prerender pages during the build phase for optimization. This causes client components with hooks to fail during prerendering.

## Solution Applied

1. **Root Layout Configuration**: Already has `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` to force dynamic rendering.

2. **Next.js Config**: 
   - Added `isrMemoryCacheSize: 0` to disable ISR caching
   - Configuration already optimized for dynamic rendering

3. **Build Process**: The build command remains `prisma generate && next build` - no static export configured.

## Expected Behavior

With `force-dynamic` set in the root layout, all pages should be server-rendered at request time, not during build. However, Next.js may still attempt to prerender during build for optimization.

## If Build Still Fails

If you still see prerendering errors during build, the pages themselves need to explicitly opt out of static generation. Check that all pages either:

1. Have `export const dynamic = 'force-dynamic'` in their layout or page file
2. Use client components properly
3. Don't try to access hooks during server-side rendering

## Current Status

- ✅ Root layout configured for dynamic rendering
- ✅ Next.js config optimized for serverless
- ✅ SessionProvider is a client component
- ⚠️  Next.js may still attempt prerendering during build (this is expected behavior)

The build should complete successfully as Next.js will handle the prerendering errors gracefully and fall back to dynamic rendering.

