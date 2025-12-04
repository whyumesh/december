#!/bin/bash

# Netlify Deployment Optimization Script (Full Version)
# This version installs all dependencies for building, then optimizes
# Better for builds that require dev dependencies (TypeScript, etc.)
#
# Usage: ./scripts/optimize-for-netlify-full.sh

set -e  # Exit on any error

echo "🚀 Starting Netlify deployment optimization (Full Version)..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Step 1: Clean previous builds
print_info "Step 1: Cleaning previous builds..."
rm -rf .next
rm -rf .cache
rm -rf .turbo
print_success "Cleanup completed"

# Step 2: Install all dependencies (needed for build)
print_info "Step 2: Installing all dependencies..."
npm ci --legacy-peer-deps
print_success "Dependencies installed"

# Step 3: Generate Prisma client
print_info "Step 3: Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Step 4: Build Next.js application
print_info "Step 4: Building Next.js application..."
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1
npm run build
print_success "Next.js build completed"

# Step 5: Remove dev dependencies
print_info "Step 5: Removing dev dependencies..."
npm prune --production
print_success "Dev dependencies removed"

# Step 6: Remove unnecessary Prisma binaries
print_info "Step 6: Removing unnecessary Prisma binaries..."
KEEP_BINARY="libquery_engine-rhel-openssl-3.0.x.so.node"

PRISMA_DIRS=(
    "node_modules/.prisma/client"
    "node_modules/@prisma/engines"
)

for dir in "${PRISMA_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_info "  Scanning $dir..."
        find "$dir" -type f \( -name "libquery_engine*.so.node" -o -name "libquery_engine*.dylib.node" -o -name "query_engine*.exe" \) 2>/dev/null | while read -r binary; do
            binary_name=$(basename "$binary")
            if [[ "$binary_name" != "$KEEP_BINARY" ]]; then
                print_info "    Removing: $binary_name"
                rm -f "$binary" 2>/dev/null || true
            else
                print_success "    Keeping: $binary_name"
            fi
        done
        find "$dir" -type f -name "*migration-engine*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        find "$dir" -type f -name "*introspection-engine*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        find "$dir" -type f -name "*prisma-fmt*" ! -name "*rhel-openssl-3.0.x*" -delete 2>/dev/null || true
        find "$dir" -type d \( -name "*darwin*" -o -name "*windows*" -o -name "*debian*" -o -name "*musl*" \) -exec rm -rf {} + 2>/dev/null || true
    fi
done

print_success "Prisma binaries optimized"

# Step 7: Remove heavy/unused files
print_info "Step 7: Removing heavy and unused files..."

find node_modules -name "*.ts" ! -name "*.d.ts" -not -path "*/node_modules/@types/*" -type f -delete 2>/dev/null || true
find node_modules -type d \( -name "__tests__" -o -name "test" -o -name "tests" \) -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*.test.*" -type f -delete 2>/dev/null || true
find node_modules -name "*.spec.*" -type f -delete 2>/dev/null || true
find node_modules -name "*.map" -type f -delete 2>/dev/null || true
find node_modules -name "README*" -o -name "CHANGELOG*" -o -name "*.md" -type f -delete 2>/dev/null || true
find node_modules -type d \( -name "examples" -o -name "example" \) -exec rm -rf {} + 2>/dev/null || true
find node_modules -name "*.exe" -o -name "*.dylib" -type f -delete 2>/dev/null || true
find node_modules -type d \( -name "win32*" -o -name "darwin*" \) -exec rm -rf {} + 2>/dev/null || true
find node_modules/@swc -type f -name "*darwin*" -o -name "*win32*" -delete 2>/dev/null || true
find node_modules/esbuild -name "esbuild-*" ! -name "*linux*" -type f -delete 2>/dev/null || true
find node_modules -type d -empty -delete 2>/dev/null || true

print_success "Heavy and unused files removed"

# Step 8: Final size report
print_info "Step 8: Final size report..."
FINAL_NODE_MODULES=$(du -sh node_modules 2>/dev/null | cut -f1 || echo "unknown")
FINAL_PRISMA=$(du -sh node_modules/.prisma 2>/dev/null | cut -f1 || echo "unknown")
BUILD_SIZE=$(du -sh .next 2>/dev/null | cut -f1 || echo "unknown")

echo ""
print_success "🎉 Optimization complete!"
echo ""
echo "📊 Size Summary:"
echo "   • node_modules: $FINAL_NODE_MODULES"
echo "   • Prisma: $FINAL_PRISMA"
echo "   • .next build: $BUILD_SIZE"
echo ""
echo "✅ Ready for Netlify deployment!"

