#!/bin/bash

# Netlify Deployment Optimization Script
# This script optimizes the Next.js + Prisma deployment to stay under Netlify's 250MB limit
#
# Usage: ./scripts/optimize-for-netlify.sh
# Or: bash scripts/optimize-for-netlify.sh

set -e  # Exit on any error

echo "🚀 Starting Netlify deployment optimization..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Step 1: Clean previous builds and caches
print_info "Step 1: Cleaning previous builds and caches..."
rm -rf .next
rm -rf node_modules
rm -rf .cache
rm -rf .turbo
npm cache clean --force 2>/dev/null || true
print_success "Cleanup completed"

# Step 2: Install only production dependencies
print_info "Step 2: Installing production dependencies only..."
print_warning "Note: Some builds may require dev dependencies. If build fails, install all deps first."
export NODE_ENV=production
npm ci --only=production --legacy-peer-deps
print_success "Production dependencies installed"

# Step 3: Generate Prisma client (this will create all binaries)
print_info "Step 3: Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Step 4: Remove unnecessary Prisma binaries (keep only Linux)
print_info "Step 4: Removing unnecessary Prisma binaries..."

# Define the binary we want to keep (for Netlify's Linux environment)
KEEP_BINARY="libquery_engine-rhel-openssl-3.0.x.so.node"

# Directories to check for Prisma binaries
PRISMA_DIRS=(
    "node_modules/.prisma/client"
    "node_modules/@prisma/engines"
)

REMOVED_COUNT=0

for dir in "${PRISMA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_info "  Scanning $dir..."
        
        # Find and remove query engine binaries except the one we need
        find "$dir" -type f \( -name "libquery_engine*.so.node" -o -name "libquery_engine*.dylib.node" -o -name "query_engine*.exe" \) 2>/dev/null | while read -r binary; do
            binary_name=$(basename "$binary")
            
            # Keep only the Linux binary we need
            if [[ "$binary_name" == "$KEEP_BINARY" ]]; then
                print_success "    Keeping: $binary_name"
            else
                print_info "    Removing: $binary_name"
                rm -f "$binary" 2>/dev/null || true
                REMOVED_COUNT=$((REMOVED_COUNT + 1))
            fi
        done
        
        # Remove migration engine, introspection engine, and format binaries for other platforms
        find "$dir" -type f -name "*migration-engine*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        find "$dir" -type f -name "*introspection-engine*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        find "$dir" -type f -name "*prisma-fmt*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        
        # Remove other platform-specific directories
        find "$dir" -type d -name "*darwin*" -exec rm -rf {} + 2>/dev/null || true
        find "$dir" -type d -name "*windows*" -exec rm -rf {} + 2>/dev/null || true
        find "$dir" -type d -name "*debian*" -exec rm -rf {} + 2>/dev/null || true
        find "$dir" -type d -name "*musl*" -exec rm -rf {} + 2>/dev/null || true
    fi
done

print_success "Prisma binaries optimized"

# Step 5: Remove heavy/unused node modules
print_info "Step 5: Removing heavy and unused files from node_modules..."

# Remove TypeScript source files (keep only .d.ts type definitions)
find node_modules -name "*.ts" ! -name "*.d.ts" -not -path "*/node_modules/@types/*" -type f -delete 2>/dev/null || true

# Remove test files and directories
find node_modules -type d \( -name "__tests__" -o -name "test" -o -name "tests" -o -name "__test__" \) -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*.test.js" -type f -delete 2>/dev/null || true
find node_modules -name "*.test.ts" -type f -delete 2>/dev/null || true
find node_modules -name "*.test.tsx" -type f -delete 2>/dev/null || true
find node_modules -name "*.spec.js" -type f -delete 2>/dev/null || true
find node_modules -name "*.spec.ts" -type f -delete 2>/dev/null || true
find node_modules -name "*.spec.tsx" -type f -delete 2>/dev/null || true

# Remove source maps (not needed in production)
find node_modules -name "*.map" -type f -delete 2>/dev/null || true

# Remove documentation files
find node_modules -name "README*" -type f -delete 2>/dev/null || true
find node_modules -name "CHANGELOG*" -type f -delete 2>/dev/null || true
find node_modules -name "LICENSE*" -type f -delete 2>/dev/null || true
find node_modules -name "*.md" -type f -delete 2>/dev/null || true

# Remove example files and directories
find node_modules -type d \( -name "examples" -o -name "example" -o -name "samples" -o -name "sample" \) -exec rm -rf {} + 2>/dev/null || true

# Remove platform-specific binaries we don't need (keep Linux)
find node_modules -name "*.exe" -type f -delete 2>/dev/null || true
find node_modules -name "*.dylib" -type f -delete 2>/dev/null || true
find node_modules -type d -name "win32" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "win32-x64" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "darwin" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "darwin-x64" -exec rm -rf {} + 2>/dev/null || true
find node_modules -type d -name "darwin-arm64" -exec rm -rf {} + 2>/dev/null || true

# Remove unnecessary SWC binaries (keep Linux)
find node_modules/@swc -type f -name "*darwin*" -delete 2>/dev/null || true
find node_modules/@swc -type f -name "*win32*" -delete 2>/dev/null || true
find node_modules/@swc -type d -name "*darwin*" -exec rm -rf {} + 2>/dev/null || true
find node_modules/@swc -type d -name "*win32*" -exec rm -rf {} + 2>/dev/null || true

# Remove esbuild binaries for other platforms
find node_modules/esbuild -type f -name "esbuild-*" ! -name "*linux*" -delete 2>/dev/null || true

# Remove empty directories
find node_modules -type d -empty -delete 2>/dev/null || true

print_success "Heavy and unused files removed"

# Step 6: Calculate current size before build
print_info "Step 6: Calculating size before build..."
NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
PRISMA_SIZE=$(du -sh node_modules/.prisma 2>/dev/null | cut -f1 || echo "unknown")

print_info "  node_modules size: $NODE_MODULES_SIZE"
print_info "  Prisma size: $PRISMA_SIZE"

# Step 7: Build Next.js for production
print_info "Step 7: Building Next.js application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# Try to build - if it fails due to missing dev dependencies, print helpful message
if ! npm run build 2>&1; then
    print_error "Build failed! This might be because dev dependencies are required for building."
    print_warning "Try installing all dependencies first, then building, then pruning."
    print_info "Alternative approach:"
    print_info "  1. npm ci (install all deps)"
    print_info "  2. npm run build"
    print_info "  3. npm prune --production (remove dev deps after build)"
    exit 1
fi

print_success "Next.js build completed"

# Step 8: Final cleanup and size report
print_info "Step 8: Final cleanup and size report..."

# Remove any remaining dev dependencies that might have been installed
npm prune --production 2>/dev/null || true

BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "unknown")
FINAL_NODE_MODULES=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
FINAL_PRISMA=$(du -sh node_modules/.prisma 2>/dev/null | cut -f1 || echo "unknown")

echo ""
print_success "🎉 Optimization complete!"
echo ""
echo "📊 Size Summary:"
echo "   • node_modules: $FINAL_NODE_MODULES"
echo "   • Prisma: $FINAL_PRISMA"
echo "   • .next build: $BUILD_SIZE"
echo ""
echo "✅ Ready for Netlify deployment!"
echo ""
