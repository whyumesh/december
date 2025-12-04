# Phase 2 Deployment - Restore Prisma

## Overview
This phase restores Prisma functionality after successful Phase 1 deployment.

## Prerequisites
- ✅ Phase 1 deployment successful
- ✅ Bundle size confirmed under 250 MB limit
- ✅ Netlify environment variables configured (DATABASE_URL, etc.)

## Changes to Make

### 1. Restore Package.json
```json
{
  "dependencies": {
    "@prisma/client": "^5.22.0",
    // ... other dependencies
  },
  "scripts": {
    "postinstall": "prisma generate",
    // ... other scripts
  }
}
```

### 2. Restore Netlify Configuration (netlify.toml)
```toml
[build]
  command = "npm install && npx prisma generate && npm run build"

[functions]
  external_node_modules = [
    "@prisma/client",
    "prisma",
    "pg",
    # ... other external modules
  ]
  included_files = [
    "node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node",
    "node_modules/@prisma/engines/**/libquery_engine-rhel-openssl-3.0.x.so.node"
  ]
```

### 3. Restore Database Layer
Replace `src/lib/db.ts` with the original Prisma implementation (backup should be in git history).

## Deployment Steps

1. **Restore Prisma dependencies:**
   ```bash
   # Restore @prisma/client in package.json
   # Restore postinstall script
   ```

2. **Restore netlify.toml:**
   ```bash
   # Restore Prisma in build command
   # Restore Prisma in external_node_modules
   # Restore Prisma engine in included_files
   ```

3. **Restore db.ts:**
   ```bash
   git checkout HEAD~1 -- src/lib/db.ts
   # Or manually restore from backup
   ```

4. **Test locally:**
   ```bash
   npm install
   npx prisma generate
   npm run build
   ```

5. **Commit Phase 2 changes:**
   ```bash
   git add .
   git commit -m "Phase 2: Restore Prisma functionality"
   git push origin main
   ```

6. **Deploy on Netlify:**
   - Netlify will build with Prisma
   - Monitor build logs for any issues
   - Verify bundle size is still acceptable

## Expected Bundle Size
- **With Prisma**: ~150-200 MB (should be under 250 MB limit with optimizations)

## Verification Checklist
- [ ] Build succeeds on Netlify
- [ ] Bundle size under 250 MB
- [ ] Database connection works
- [ ] User authentication works
- [ ] Voter login works
- [ ] Voting functionality works
- [ ] Admin dashboard loads data
- [ ] All API routes return real data

## Rollback Plan
If Phase 2 fails:
1. Revert to Phase 1 commit
2. Investigate bundle size issues
3. Consider further optimizations before retrying

## Notes
- Prisma engine binary (~40-50 MB) is the largest single file
- With external_node_modules, Prisma client is not bundled
- Only the RHEL engine binary is included
- This should keep bundle size manageable

