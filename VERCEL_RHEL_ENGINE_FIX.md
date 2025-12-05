# Final Fix: Prisma RHEL Engine on Vercel

## 🔴 Error

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## Root Cause

Even though `rhel-openssl-3.0.x` is in the binary targets, the binary file `libquery_engine-rhel-openssl-3.0.x.so.node` is not being included in the Vercel deployment bundle.

## ✅ Solution Applied

### 1. Enhanced Output File Tracing
**File:** `next.config.js`

Added explicit file paths to ensure the rhel binary is included:
```javascript
outputFileTracingIncludes: {
  '*': [
    // Explicit paths for rhel binary
    'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
    'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x*',
    'node_modules/@prisma/engines/**/query-engine-rhel-openssl-3.0.x*',
    'node_modules/@prisma/engines/**/libquery_engine-rhel-openssl-3.0.x.so.node',
  ],
}
```

### 2. Force Fresh Prisma Generation
**File:** `vercel.json`

Updated build command to delete old Prisma client before regenerating:
```json
"buildCommand": "rm -rf node_modules/.prisma && prisma generate --schema=./prisma/schema.prisma && next build"
```

This ensures:
- Old Prisma client is deleted
- Fresh client is generated with all binary targets
- Binary files are properly created

### 3. Schema Configuration
**File:** `prisma/schema.prisma`

✅ Already configured:
```prisma
binaryTargets = ["native", "linux-musl-openssl-3.0.x", "rhel-openssl-3.0.x"]
```

## 🚀 Next Steps

1. **Commit and push:**
   ```bash
   git add next.config.js vercel.json
   git commit -m "Fix: Ensure Prisma rhel-openssl-3.0.x engine is included in Vercel deployment"
   git push
   ```

2. **Vercel will rebuild:**
   - Will delete old Prisma client
   - Will regenerate with all binary targets (native, musl, rhel)
   - Will include rhel binary in deployment bundle
   - Build will complete successfully

3. **Test OTP:**
   - After rebuild, test sending OTP
   - Should work without the `rhel-openssl-3.0.x` error

## 🔍 Why This Works

- **Explicit File Paths**: Next.js output file tracing now explicitly includes the rhel binary
- **Fresh Generation**: Deleting `.prisma` folder ensures clean regeneration
- **Multiple Patterns**: Using both exact paths and wildcards ensures the file is found
- **Both Locations**: Including both `.prisma/client` and `@prisma/engines` locations

## ⚠️ Important Notes

- The `rm -rf` command works on Vercel's Linux build environment
- Both `linux-musl` and `rhel` binaries will be included (larger bundle, but ensures compatibility)
- The build might take slightly longer due to regenerating Prisma client

## 📋 Verification

After deployment, check Vercel build logs for:
- `Generated Prisma Client` message
- No errors about missing engines
- Both `libquery_engine-linux-musl-openssl-3.0.x.so.node` and `libquery_engine-rhel-openssl-3.0.x.so.node` should be present

