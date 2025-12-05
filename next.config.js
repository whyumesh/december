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
    // CRITICAL: Explicitly include ALL Next.js internal modules (required for Vercel)
    // This ensures ALL Next.js files are included - no exceptions
    outputFileTracingIncludes: {
      '*': [
        'node_modules/next/**', // Include EVERYTHING from Next.js
        'node_modules/styled-jsx/**',
        'node_modules/@prisma/client/**', // CRITICAL: Include Prisma client for serverless functions
        'node_modules/.prisma/client/**', // CRITICAL: Include generated Prisma client
        'node_modules/twilio/**', // CRITICAL: Include Twilio for serverless functions
        'node_modules/next-auth/**', // CRITICAL: Include NextAuth for serverless functions
        'node_modules/jsonwebtoken/**', // CRITICAL: Include jsonwebtoken for serverless functions
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
        // Exclude TypeScript source files (but NOT Next.js files - already excluded above)
        '**/*.ts',
        '!**/*.d.ts',
        '!node_modules/next/**/*.ts', // Explicitly don't exclude Next.js TS files
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
    serverComponentsExternalPackages: [
      'prisma',
      // NOTE: @prisma/client should NOT be externalized for API routes (serverless functions)
      // It needs to be bundled so it's available at runtime
      // '@prisma/client', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
      'pg',
      'bcryptjs',
      // NOTE: jsonwebtoken should NOT be externalized for API routes (serverless functions)
      // It needs to be bundled so it's available at runtime
      // 'jsonwebtoken', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
      'nodemailer',
      'csv-parser',
      'exceljs',
      'jspdf',
      'uuid',
      'zod',
      '@aws-sdk/client-s3',
      '@aws-sdk/s3-request-presigner',
      '@aws-sdk/client-sso',
      '@aws-sdk/client-sso-oidc',
      '@aws-sdk/credential-providers',
      'cloudinary',
      'isomorphic-dompurify',
      'jsdom',
      // NOTE: twilio and next-auth should NOT be externalized for API routes (serverless functions)
      // They need to be bundled so they're available at runtime
      // 'twilio', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
      '@upstash/ratelimit',
      '@upstash/redis',
      'pdf-parse',
      // 'next-auth', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
      '@hookform/resolvers',
      'react-hook-form'
    ],
  },
  // Configure middleware to avoid Edge Function issues
  // Exclude jsonwebtoken from Edge Function bundling
  transpilePackages: [],
  // Enable SWC minification
  swcMinify: true,
  // Optimize bundle
  webpack: (config, { dev, isServer }) => {
    // Externalize large dependencies for server-side (Vercel serverless functions)
    if (!dev && isServer) {
      config.externals = config.externals || []
      // Externalize large dependencies to reduce Vercel function bundle size
      // These will be loaded from node_modules at runtime, not bundled
      // NOTE: Prisma binaries are automatically handled by Vercel
      const largeDependencies = [
        'pg',
        'bcryptjs',
        // NOTE: jsonwebtoken must be bundled for serverless functions
        // 'jsonwebtoken', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
        'nodemailer',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
        '@aws-sdk/client-sso',
        '@aws-sdk/client-sso-oidc',
        '@aws-sdk/credential-providers',
        'cloudinary',
        'pdf-parse',
        'exceljs',
        'jspdf',
        'jsdom',
        'isomorphic-dompurify',
        // NOTE: twilio and next-auth must be bundled for serverless functions
        // 'twilio', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
        'csv-parser',
        '@upstash/ratelimit',
        '@upstash/redis',
        'uuid',
        'zod',
        // 'next-auth', // REMOVED - causes MODULE_NOT_FOUND in serverless functions
        '@hookform/resolvers',
        'react-hook-form'
      ]
      // Add as external dependencies
      config.externals.push(...largeDependencies)
      
      // Also externalize by pattern for better coverage
      config.externals.push({
        '@aws-sdk': 'commonjs @aws-sdk',
        'canvas': 'commonjs canvas',
        // NOTE: Do NOT externalize @prisma/client - it must be bundled for serverless functions
        // '@prisma': 'commonjs @prisma', // REMOVED - causes MODULE_NOT_FOUND errors
        // 'prisma': 'commonjs prisma', // REMOVED - causes MODULE_NOT_FOUND errors
      })
      
      // CRITICAL: Ensure Next.js and ALL its internal modules are NOT externalized
      // Next.js must be bundled, not externalized
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (ext) => {
            // Never externalize Next.js or any of its internal modules
            if (typeof ext === 'string') {
              if (ext === 'next' || 
                  ext === 'ws' || 
                  ext === 'styled-jsx' ||
                  ext.includes('next/') ||
                  ext.includes('next/dist')) {
                return false
              }
            }
            // Don't externalize Next.js modules in object form
            if (typeof ext === 'object') {
              if (ext.next !== undefined || 
                  ext.ws !== undefined || 
                  ext['styled-jsx'] !== undefined) {
                return false
              }
            }
            return true
          }
        )
      }
      
      // Final check: Remove Next.js and its dependencies from externals
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(ext => {
          if (typeof ext === 'string') {
            return ext !== 'next' && ext !== 'styled-jsx' && ext !== 'ws'
          }
          return true
        })
      }
    }
    
    if (!dev && !isServer) {
      // Enable tree shaking
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
  // Output standalone mode - DISABLED for Vercel
  // Vercel's Next.js runtime handles server bundling automatically
  // output: 'standalone',
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
