# Fix: Prisma Engine Error - RHEL vs Linux Musl

## 🔴 Error Found

```
Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
```

## Root Cause

The Prisma schema has the correct binary target (`linux-musl-openssl-3.0.x`), but the **generated Prisma client** still references the old `rhel-openssl-3.0.x` engine. This happens when:

1. Prisma client was generated with old binary targets
2. The generated client wasn't regenerated after schema change
3. Build cache might have old generated client

## ✅ Solution

### Step 1: Regenerate Prisma Client Locally

Run this command to regenerate the Prisma client with the correct binary target:

```bash
npx prisma generate
```

This will regenerate the client with `linux-musl-openssl-3.0.x` binary target.

### Step 2: Verify Build Command

The `vercel.json` already has:
```json
"buildCommand": "prisma generate && next build"
```

This ensures Prisma client is regenerated during Vercel build.

### Step 3: Clear Build Cache and Redeploy

1. **Commit the changes:**
   ```bash
   git add .
   git commit -m "Fix: Regenerate Prisma client with linux-musl binary target"
   git push
   ```

2. **Force a fresh build on Vercel:**
   - The build command will regenerate Prisma client
   - This should fix the engine mismatch

## 🔍 Verification

After redeploying, check:
1. Build logs should show: `Generated Prisma Client`
2. The error should be gone
3. OTP sending should work

## 📝 Why This Happened

The schema was updated to use `linux-musl-openssl-3.0.x`, but the generated Prisma client in `node_modules/.prisma/client` still had references to the old `rhel-openssl-3.0.x` engine. Regenerating the client fixes this.

