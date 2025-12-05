/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'upload.wikimedia.org'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Skip font optimization during build if network fails (non-blocking)
  optimizeFonts: process.env.SKIP_FONT_OPTIMIZATION !== 'true',
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@radix-ui/react-icons',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-label',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slot',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast'
    ],
    // Disable ISR to prevent static generation
    isrMemoryCacheSize: 0,
    // Output file tracing - explicitly include critical dependencies
    // Vercel needs these explicitly listed to include them in serverless functions
    outputFileTracingIncludes: {
      '*': [
        'node_modules/next/**',
        'node_modules/styled-jsx/**',
        'node_modules/@prisma/client/**',
        'node_modules/.prisma/client/**',
        'node_modules/.prisma/client/libquery_engine-linux-musl*',
        'node_modules/@prisma/engines/**/query-engine-linux-musl*',
      ],
    },
    // Exclude unnecessary files from function bundle to reduce size
    outputFileTracingExcludes: {
      '*': [
        // Exclude platform-specific SWC binaries (keep only what's needed)
        'node_modules/@swc/core-linux-x64-gnu/**/*',
        'node_modules/@swc/core-darwin-x64/**/*',
        'node_modules/@swc/core-darwin-arm64/**/*',
        'node_modules/@swc/core-win32-x64/**/*',
        'node_modules/@esbuild/**/*',
        'node_modules/terser/**/*',
        'node_modules/webpack/**/*',
        'node_modules/.cache/**/*',
        // Exclude Prisma engines for other platforms (keep linux-musl for Vercel)
        'node_modules/.prisma/client/libquery_engine-darwin*',
        'node_modules/.prisma/client/libquery_engine-windows*',
        'node_modules/.prisma/client/libquery_engine-debian*',
        'node_modules/.prisma/client/libquery_engine-rhel*',
        'node_modules/@prisma/engines/**/query-engine-darwin*',
        'node_modules/@prisma/engines/**/query-engine-windows*',
        'node_modules/@prisma/engines/**/query-engine-debian*',
        'node_modules/@prisma/engines/**/query-engine-rhel*',
        'node_modules/@prisma/engines/**/migration-engine*',
        'node_modules/@prisma/engines/**/introspection-engine*',
        'node_modules/@prisma/engines/**/prisma-fmt*',
        // Exclude test files and documentation
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**/*',
        '**/test/**/*',
        '**/tests/**/*',
        '**/*.map',
        '**/README*',
        '**/CHANGELOG*',
        '**/LICENSE*',
        '**/examples/**',
        '**/example/**',
        '**/docs/**',
        '**/documentation/**',
        // CRITICAL: NEVER exclude Next.js or Prisma files
        '!node_modules/next/**',
        '!node_modules/styled-jsx/**',
        '!node_modules/@prisma/client/**',
        '!node_modules/.prisma/client/**',
        // Exclude TypeScript source files (but keep .d.ts and critical packages)
        '**/*.ts',
        '!**/*.d.ts',
        '!node_modules/next/**/*.ts',
        '!node_modules/@prisma/client/**/*.ts',
        '!node_modules/.prisma/client/**/*.ts',
        // Exclude unnecessary Radix UI files
        'node_modules/@radix-ui/**/*.stories.*',
        'node_modules/@radix-ui/**/README*',
        // Exclude large unused dependencies
        'node_modules/recharts/**/*.ts',
        'node_modules/recharts/**/examples/**',
        'node_modules/date-fns/**/locale/**',
        'node_modules/date-fns/**/esm/**',
        'node_modules/date-fns/**/fp/**',
        // Exclude .next build artifacts (but keep chunks)
        '.next/cache/**',
        '.next/trace*',
        '.next/static/**',
        '.next/BUILD_ID',
        '.next/routes-manifest.json',
        '.next/prerender-manifest.json',
        '.next/images-manifest.json',
      ],
    },
    // Let Next.js handle server components naturally - no externalization
    serverComponentsExternalPackages: [],
  },
  // Configure middleware to avoid Edge Function issues
  transpilePackages: [],
  // Enable SWC minification
  swcMinify: true,
  // Simplified webpack config - let Next.js handle bundling automatically
  // No manual externals manipulation - rely on outputFileTracingIncludes instead
  webpack: (config, { dev, isServer }) => {
    // Only apply client-side optimizations
    if (!dev && !isServer) {
      // Enable tree shaking for client bundle
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
      // Split chunks for better caching
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 15,
          },
        },
      }
    }
    
    // For server-side: Let Next.js/Vercel handle bundling automatically
    // outputFileTracingIncludes ensures Prisma is included
    // No need to manipulate externals - it causes webpack errors
    
    return config
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/api/admin/view-document',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Enable compression
  compress: true,
  // Skip type checking during build for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Force all pages to be dynamic (prevent static generation)
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig
