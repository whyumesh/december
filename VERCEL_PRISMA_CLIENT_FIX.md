# Fix: Cannot find module '@prisma/client' on Vercel

## Problem
Vercel deployment was showing this error:
```
Error: Cannot find module '@prisma/client'
Require stack: - /var/task/.next/server/app/api/voter/send-otp/route.js
```

## Root Cause

The issue was that `@prisma/client` was being **externalized** in the webpack configuration, which means:
1. It wasn't being bundled into the serverless function
2. Vercel expected it to be available in `node_modules` at runtime
3. But the Prisma client wasn't being included in the function bundle

## Solution Applied

### 1. Removed Prisma from Webpack Externals
**File:** `next.config.js`

**Before:**
```javascript
config.externals.push({
  '@prisma': 'commonjs @prisma',
  'prisma': 'commonjs prisma',
})
```

**After:**
```javascript
// NOTE: Do NOT externalize @prisma/client - it must be bundled for serverless functions
// '@prisma': 'commonjs @prisma', // REMOVED - causes MODULE_NOT_FOUND errors
// 'prisma': 'commonjs prisma', // REMOVED - causes MODULE_NOT_FOUND errors
```

### 2. Removed from serverComponentsExternalPackages
**File:** `next.config.js`

**Before:**
```javascript
serverComponentsExternalPackages: [
  'prisma',
  '@prisma/client',
  // ...
]
```

**After:**
```javascript
serverComponentsExternalPackages: [
  'prisma',
  // NOTE: @prisma/client should NOT be externalized for API routes (serverless functions)
  // It needs to be bundled so it's available at runtime
  // '@prisma/client', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
  // ...
]
```

### 3. Added to outputFileTracingIncludes
**File:** `next.config.js`

**Added:**
```javascript
outputFileTracingIncludes: {
  '*': [
    'node_modules/next/**',
    'node_modules/styled-jsx/**',
    'node_modules/@prisma/client/**', // CRITICAL: Include Prisma client
    'node_modules/.prisma/client/**', // CRITICAL: Include generated Prisma client
  ],
}
```

## Why This Works

1. **Bundling vs Externalizing**: 
   - When a module is **externalized**, it's not included in the bundle and must be available at runtime
   - When a module is **bundled**, it's included in the function bundle
   - For serverless functions on Vercel, `@prisma/client` needs to be **bundled**

2. **Output File Tracing**: 
   - Vercel uses output file tracing to determine which files to include in serverless functions
   - By explicitly including Prisma client in `outputFileTracingIncludes`, we ensure it's available

3. **Prisma Client Generation**:
   - The build command already includes `prisma generate` (in `vercel.json`)
   - The `postinstall` script also runs `prisma generate` (in `package.json`)
   - This ensures the Prisma client is generated before the build

## Files Changed

1. ✅ `next.config.js` - Removed Prisma from webpack externals
2. ✅ `next.config.js` - Removed `@prisma/client` from `serverComponentsExternalPackages`
3. ✅ `next.config.js` - Added Prisma to `outputFileTracingIncludes`

## Next Steps

1. **Commit and Push:**
   ```bash
   git add next.config.js
   git commit -m "Fix: Bundle @prisma/client for Vercel serverless functions"
   git push
   ```

2. **Redeploy on Vercel:**
   - The deployment should now include Prisma client in the function bundle
   - API routes should be able to import and use `@prisma/client`

3. **Verify:**
   - Test API routes that use Prisma (e.g., `/api/voter/send-otp`)
   - Check Vercel function logs - the error should be gone

## Important Notes

- **API Routes** (serverless functions) need `@prisma/client` to be **bundled**
- **Server Components** can use `serverComponentsExternalPackages`, but API routes cannot
- **Prisma Client** must be generated during build (`prisma generate`)
- **Output File Tracing** ensures Prisma client files are included in the function bundle

## Expected Result

✅ API routes can import `@prisma/client`  
✅ No more "Cannot find module '@prisma/client'" errors  
✅ Database operations work correctly in serverless functions  

