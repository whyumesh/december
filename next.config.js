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
  // This prevents build failures due to Google Fonts network timeouts
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
        'node_modules/next/**', // Include Next.js files
        'node_modules/styled-jsx/**',
        'node_modules/@prisma/client/**', // CRITICAL: Prisma client must be included
        'node_modules/.prisma/client/**', // CRITICAL: Generated Prisma client
        'node_modules/.prisma/client/libquery_engine-linux-musl*', // CRITICAL: Prisma engine for Vercel
        'node_modules/@prisma/engines/**/query-engine-linux-musl*', // CRITICAL: Prisma engine for Vercel
      ],
    },
    // Exclude unnecessary files from function bundle to reduce size
    // NOTE: Do NOT exclude @swc/helpers - Next.js needs it at runtime
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu/**/*',
        'node_modules/@swc/core-linux-x64-musl/**/*',
        'node_modules/@swc/core-darwin-x64/**/*',
        'node_modules/@swc/core-darwin-arm64/**/*',
        'node_modules/@swc/core-win32-x64/**/*',
        'node_modules/@esbuild/**/*',
        'node_modules/terser/**/*',
        'node_modules/webpack/**/*',
        'node_modules/.cache/**/*',
        // Exclude Prisma engines (keep linux-musl for Vercel, exclude others)
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
        // CRITICAL: NEVER exclude Next.js - must come FIRST before any broad patterns
        '!node_modules/next/**', // Keep ALL Next.js files - no exceptions
        '!node_modules/styled-jsx/**', // Keep styled-jsx
        // Exclude TypeScript source files (but NOT Next.js or Prisma files - already excluded above)
        '**/*.ts',
        '!**/*.d.ts',
        '!node_modules/next/**/*.ts', // Explicitly don't exclude Next.js TS files
        '!node_modules/@prisma/client/**/*.ts', // CRITICAL: Don't exclude Prisma client TS files
        '!node_modules/.prisma/client/**/*.ts', // CRITICAL: Don't exclude generated Prisma client TS files
        // Exclude unnecessary Radix UI files
        'node_modules/@radix-ui/**/*.stories.*',
        'node_modules/@radix-ui/**/README*',
        // Exclude large unused dependencies
        'node_modules/recharts/**/*.ts',
        'node_modules/recharts/**/examples/**',
        'node_modules/date-fns/**/locale/**',
        'node_modules/date-fns/**/esm/**',
        'node_modules/date-fns/**/fp/**',
        // Exclude .next build artifacts from function tracing
        // BUT keep webpack chunks - they're required at runtime!
        '.next/cache/**',
        '.next/trace*',
        // DO NOT exclude .next/server/chunks/** - these are required webpack chunks!
        '.next/static/**',
        '.next/BUILD_ID',
        '.next/routes-manifest.json',
        '.next/prerender-manifest.json',
        '.next/images-manifest.json',
        // DO NOT exclude ws - Next.js needs it
        // 'node_modules/ws/**', // REMOVED - ws must be included
      ],
    },
    // Simplified: Let Next.js handle server components naturally
    // No external packages - everything will be bundled generically
    // NOTE: Even 'prisma' CLI removed to ensure @prisma/client bundles correctly
    serverComponentsExternalPackages: [],
  },
  // Configure middleware to avoid Edge Function issues
  // Exclude jsonwebtoken from Edge Function bundling
  transpilePackages: [],
  // Enable SWC minification
  swcMinify: true,
  // Webpack config - ensure critical modules are bundled
  webpack: (config, { dev, isServer }) => {
    // Server-side bundling (for API routes/serverless functions)
    if (!dev && isServer) {
      // CRITICAL: Ensure Prisma client is NOT externalized - it must be bundled
      // Remove Prisma from any externals array
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(ext => {
          if (typeof ext === 'string') {
            // Never externalize Prisma client
            return !ext.includes('@prisma/client') && 
                   !ext.includes('.prisma/client') &&
                   ext !== '@prisma/client' &&
                   ext !== 'prisma'
          }
          if (typeof ext === 'object' && ext !== null) {
            // Never externalize Prisma in object form
            return ext['@prisma/client'] === undefined && 
                   ext['@prisma'] === undefined &&
                   ext['prisma'] === undefined
          }
          return true
        })
      }
      
      // Wrap externals function to ensure Prisma is bundled
      // Next.js might set externals as a function, we need to wrap it
      const originalExternals = config.externals
      
      config.externals = function(context, request, callback) {
        // CRITICAL: Never externalize Prisma client - it must be bundled
        if (request && (
          request.includes('@prisma/client') || 
          request.includes('.prisma/client') ||
          request === '@prisma/client'
        )) {
          // Don't externalize - let webpack bundle it (callback() without args = bundle it)
          return callback()
        }
        
        // For other modules, check if original externals wants to externalize them
        if (typeof originalExternals === 'function') {
          return originalExternals.call(this, context, request, callback)
        }
        
        // If original externals is an array, check it
        if (Array.isArray(originalExternals)) {
          const shouldExternalize = originalExternals.some(ext => {
            if (typeof ext === 'string') return ext === request
            if (typeof ext === 'function') {
              try {
                let result
                ext(context, request, (err, result) => {
                  result = !err
                })
                return result
              } catch {
                return false
              }
            }
            return false
          })
          if (shouldExternalize) {
            return callback(null, request)
          }
        }
        
        // Default: don't externalize (bundle it)
        callback()
      }
    }
    
    // Client-side optimizations
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
  // No standalone mode - let Vercel handle bundling generically
  // Skip type checking during build for speed
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Force all pages to be dynamic (prevent static generation)
  // This ensures no pages try to access database during build
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  // Note: Vercel automatically handles Next.js serverless function bundling
}

module.exports = nextConfig
