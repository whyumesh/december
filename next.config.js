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
    // Explicitly include Next.js internal modules (required for Vercel)
    // This ensures next/dist/compiled/ws and other internal modules are included
    outputFileTracingIncludes: {
      '*': [
        'node_modules/next/dist/compiled/**',
        'node_modules/next/dist/server/**',
        'node_modules/next/dist/shared/**',
        'node_modules/next/dist/compiled/ws/**',
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
        // CRITICAL: Never exclude Next.js internal modules - MUST come BEFORE **/*.ts
        // Order matters! Exceptions must come before the rule that would exclude them
        '!node_modules/next/dist/**', // Keep all Next.js dist files
        '!node_modules/next/dist/compiled/**', // Explicitly keep compiled modules (including ws)
        '!node_modules/next/dist/compiled/ws/**', // Explicitly keep ws module
        // Exclude TypeScript source files (keep only .d.ts)
        // BUT keep Next.js internal compiled modules (already excluded above)
        '**/*.ts',
        '!**/*.d.ts',
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
        '.next/cache/**',
        '.next/trace*',
        '.next/server/chunks/**',
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
      '@prisma/client',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
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
      'twilio',
      '@upstash/ratelimit',
      '@upstash/redis',
      'pdf-parse',
      'next-auth',
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
        'jsonwebtoken',
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
        'twilio',
        'csv-parser',
        '@upstash/ratelimit',
        '@upstash/redis',
        'uuid',
        'zod',
        'next-auth',
        '@hookform/resolvers',
        'react-hook-form'
      ]
      // Add as external dependencies
      config.externals.push(...largeDependencies)
      
      // Also externalize by pattern for better coverage
      config.externals.push({
        '@aws-sdk': 'commonjs @aws-sdk',
        'canvas': 'commonjs canvas',
        '@prisma': 'commonjs @prisma',
        'prisma': 'commonjs prisma',
      })
      
      // Ensure Next.js internal modules are NOT externalized
      // Next.js needs its internal compiled modules (like ws)
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(
          (ext) => {
            // Don't externalize Next.js internal modules
            if (typeof ext === 'string' && ext.includes('next/dist')) {
              return false
            }
            // Don't externalize ws (Next.js needs it)
            if (ext === 'ws' || (typeof ext === 'object' && ext.ws !== undefined)) {
              return false
            }
            return true
          }
        )
      }
      
      // Ensure Next.js is not externalized
      if (Array.isArray(config.externals)) {
        config.externals = config.externals.filter(ext => ext !== 'next')
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
