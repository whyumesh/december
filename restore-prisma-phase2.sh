#!/bin/bash
# Phase 2: Restore Prisma Functionality
# Run this script to restore Prisma after Phase 1 deployment

echo "=== Phase 2: Restoring Prisma ==="
echo ""

# Backup current db.ts (stub version)
echo "1. Backing up stub db.ts..."
cp src/lib/db.ts src/lib/db.ts.phase1-backup

# Restore package.json dependencies
echo "2. Restoring @prisma/client in package.json..."
# Note: You'll need to manually edit package.json to add:
# "@prisma/client": "^5.22.0",
# And update postinstall script to: "prisma generate"

# Restore netlify.toml
echo "3. Restoring netlify.toml..."
# Note: You'll need to manually edit netlify.toml to:
# - Add "npx prisma generate" to build command
# - Add "@prisma/client" and "prisma" to external_node_modules
# - Add Prisma engine paths to included_files

# Restore db.ts from git history
echo "4. Restoring original db.ts from git..."
git checkout HEAD~1 -- src/lib/db.ts 2>/dev/null || {
    echo "   Warning: Could not restore from git. Please restore manually from backup."
    echo "   Original db.ts should be in git history or your backup."
}

echo ""
echo "=== Manual Steps Required ==="
echo "1. Edit package.json:"
echo "   - Add '@prisma/client': '^5.22.0' to dependencies"
echo "   - Change postinstall to: 'prisma generate'"
echo ""
echo "2. Edit netlify.toml:"
echo "   - Add 'npx prisma generate' to build command"
echo "   - Add '@prisma/client' and 'prisma' to external_node_modules"
echo "   - Add Prisma engine paths to included_files"
echo ""
echo "3. Test locally:"
echo "   npm install"
echo "   npx prisma generate"
echo "   npm run build"
echo ""
echo "4. Commit and push:"
echo "   git add ."
echo "   git commit -m 'Phase 2: Restore Prisma'"
echo "   git push origin main"
echo ""
echo "=== Done ==="

