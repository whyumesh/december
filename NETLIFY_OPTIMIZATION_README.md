# Netlify Deployment Optimization Script

This script optimizes your Next.js + Prisma deployment to stay under Netlify's 250MB serverless function limit.

## What the Script Does

1. **Cleans previous builds** - Removes `.next`, `node_modules`, and cache directories
2. **Installs only production dependencies** - Uses `npm ci --only=production` to exclude dev dependencies
3. **Generates Prisma client** - Creates the Prisma client with all binary targets
4. **Removes unnecessary Prisma binaries** - Keeps only the Linux binary needed for Netlify (`libquery_engine-rhel-openssl-3.0.x.so.node`)
5. **Removes heavy/unused files** - Cleans up test files, source maps, documentation, and platform-specific binaries
6. **Builds Next.js** - Creates the production build optimized for deployment

## Available Scripts

There are two optimization scripts available:

### 1. `optimize-for-netlify.sh` (Production-Only)
Installs only production dependencies, then builds. Use this if your build doesn't require dev dependencies.

### 2. `optimize-for-netlify-full.sh` (Recommended)
Installs all dependencies, builds, then removes dev dependencies. More reliable for builds that require TypeScript or other dev tools.

## Usage

### Option 1: Run Before Deploying (Recommended)

**Using the full version (recommended):**
```bash
bash scripts/optimize-for-netlify-full.sh
```

**Using the production-only version:**
```bash
bash scripts/optimize-for-netlify.sh
```

**On Windows (Git Bash or WSL):**
```bash
bash scripts/optimize-for-netlify-full.sh
```

**On Windows (Command Prompt):**
```batch
scripts\optimize-for-netlify.bat
```

**On Linux/Mac:**
```bash
chmod +x scripts/optimize-for-netlify-full.sh
./scripts/optimize-for-netlify-full.sh
```

### Option 2: Automatic During Netlify Build

The `netlify.toml` is configured to run the optimization script automatically during builds. You can choose which version to use by updating the build command in `netlify.toml`:

**For the full version (recommended):**
```toml
command = "chmod +x scripts/optimize-for-netlify-full.sh && bash scripts/optimize-for-netlify-full.sh"
```

**For the production-only version:**
```toml
command = "chmod +x scripts/optimize-for-netlify.sh && bash scripts/optimize-for-netlify.sh"
```

## What Gets Removed

- **Prisma binaries** - All except `libquery_engine-rhel-openssl-3.0.x.so.node` (Linux)
- **Test files** - `__tests__`, `*.test.js`, `*.spec.js`, etc.
- **Source maps** - `*.map` files
- **Documentation** - README, CHANGELOG, LICENSE, `.md` files
- **Examples** - `examples/` directories
- **Platform-specific binaries** - Windows `.exe`, macOS `.dylib`, etc.
- **Development tools** - Unnecessary SWC and esbuild binaries for other platforms
- **TypeScript source files** - Only compiled types are kept

## Prisma Binary Details

The script keeps only the Linux binary required for Netlify's environment:
- **Kept:** `libquery_engine-rhel-openssl-3.0.x.so.node`
- **Removed:** All other platform binaries (Windows, macOS, other Linux variants)

This is configured in `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

## Size Optimization

After running the script, you should see:
- Reduced `node_modules` size (typically 100-200MB saved)
- Smaller Prisma binaries (removes ~50-100MB of unused platform binaries)
- Cleaner production build

## Troubleshooting

### Script fails with "permission denied"
Make sure the script is executable:
```bash
chmod +x scripts/optimize-for-netlify.sh
```

### Build fails on Netlify
1. Check Netlify build logs for specific errors
2. Ensure all environment variables are set in Netlify dashboard
3. Verify the script has execute permissions in your repository

### Still exceeding 250MB limit
1. Check what large files are included:
   ```bash
   du -sh node_modules/*
   ```
2. Consider externalizing more dependencies in `netlify.toml`
3. Review the `external_node_modules` list in `netlify.toml`
4. Check if there are large files in your project root that should be in `.gitignore`

## Manual Steps (if script doesn't work)

If you need to do this manually:

1. Clean install production dependencies:
   ```bash
   rm -rf node_modules
   npm ci --only=production
   ```

2. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

3. Remove unnecessary Prisma binaries:
   ```bash
   find node_modules/.prisma -name "*.so.node" ! -name "libquery_engine-rhel-openssl-3.0.x.so.node" -delete
   find node_modules/@prisma -name "*.so.node" ! -name "libquery_engine-rhel-openssl-3.0.x.so.node" -delete
   ```

4. Build:
   ```bash
   npm run build
   ```

## Integration with CI/CD

The script is designed to be idempotent and safe to run multiple times. It's integrated into the Netlify build process via `netlify.toml`, so it runs automatically on every deployment.

## Notes

- The script requires `bash` (available on Linux, macOS, Git Bash, and WSL on Windows)
- Netlify runs on Linux, so the shell script will work during builds
- The Windows batch script (`.bat`) is provided for local testing but has limited optimization capabilities

