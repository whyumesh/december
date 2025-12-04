# Netlify Optimization - Quick Start

## Problem
Your Next.js + Prisma app exceeds Netlify's 250MB serverless function limit.

## Solution
Run the optimization script before deploying or let it run automatically during Netlify builds.

## Quick Usage

### Before Deploying (Local)
```bash
# Recommended: Full version (installs all deps, builds, then optimizes)
bash scripts/optimize-for-netlify-full.sh

# Alternative: Production-only version
bash scripts/optimize-for-netlify.sh
```

### Automatic on Netlify
The script runs automatically during builds. The build command in `netlify.toml` is already configured.

## What Gets Optimized

1. ✅ **Production dependencies only** - Dev dependencies removed after build
2. ✅ **Prisma binaries** - Only Linux binary kept (`libquery_engine-rhel-openssl-3.0.x.so.node`)
3. ✅ **Heavy files removed** - Tests, docs, source maps, platform-specific binaries
4. ✅ **Next.js built** - Production build created

## Expected Results

- **Size reduction:** Typically 100-200MB saved
- **Prisma binaries:** ~50-100MB saved by removing unused platforms
- **Total function size:** Should be well under 250MB

## Files Created

- `scripts/optimize-for-netlify.sh` - Production-only version
- `scripts/optimize-for-netlify-full.sh` - Full version (recommended)
- `scripts/optimize-for-netlify.bat` - Windows batch script
- `netlify.toml` - Updated build command
- `NETLIFY_OPTIMIZATION_README.md` - Full documentation

## Next Steps

1. Run the script locally to test
2. Push changes to trigger Netlify build
3. Check Netlify build logs for size reports
4. Verify deployment succeeds

For detailed documentation, see `NETLIFY_OPTIMIZATION_README.md`.

