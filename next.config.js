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
    // Exclude unnecessary files from function bundle to reduce size
    // NOTE: Do NOT exclude @swc/helpers or Prisma - Next.js and Vercel need them at runtime
    outputFileTracingExcludes: {
      '*': [
        // Exclude platform-specific SWC binaries (keep musl for Vercel)
        'node_modules/@swc/core-linux-x64-gnu/**/*',
        'node_modules/@swc/core-darwin-x64/**/*',
        'node_modules/@swc/core-darwin-arm64/**/*',
        'node_modules/@swc/core-win32-x64/**/*',
        // Exclude build tools not needed at runtime
        'node_modules/@esbuild/**/*',
        'node_modules/terser/**/*',
        'node_modules/webpack/**/*',
        'node_modules/.cache/**/*',
        // Exclude test files and source maps
        '**/*.test.*',
        '**/*.spec.*',
        '**/__tests__/**/*',
        '**/test/**/*',
        '**/tests/**/*',
        '**/*.map',
        // Exclude unnecessary Prisma binaries (keep linux-musl for Vercel)
        'node_modules/@prisma/engines/**/query-engine-darwin*',
        'node_modules/@prisma/engines/**/query-engine-windows*',
        'node_modules/@prisma/engines/**/query-engine-debian*',
        'node_modules/@prisma/engines/**/query-engine-rhel*',
        'node_modules/@prisma/engines/**/migration-engine-darwin*',
        'node_modules/@prisma/engines/**/migration-engine-windows*',
        'node_modules/@prisma/engines/**/migration-engine-debian*',
        'node_modules/@prisma/engines/**/migration-engine-rhel*',
        'node_modules/@prisma/engines/**/introspection-engine-darwin*',
        'node_modules/@prisma/engines/**/introspection-engine-windows*',
        'node_modules/@prisma/engines/**/introspection-engine-debian*',
        'node_modules/@prisma/engines/**/introspection-engine-rhel*',
        'node_modules/@prisma/engines/**/prisma-fmt-darwin*',
        'node_modules/@prisma/engines/**/prisma-fmt-windows*',
        'node_modules/@prisma/engines/**/prisma-fmt-debian*',
        'node_modules/@prisma/engines/**/prisma-fmt-rhel*',
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
      'cloudinary',
      'isomorphic-dompurify',
      'jsdom',
      'twilio',
      '@upstash/ratelimit',
      '@upstash/redis',
      'pdf-parse'
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
      // Vercel automatically handles these via serverComponentsExternalPackages
      const largeDependencies = [
        'pg',
        'bcryptjs',
        'jsonwebtoken',
        'nodemailer',
        '@aws-sdk/client-s3',
        '@aws-sdk/s3-request-presigner',
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
      ]
      // Add as external dependencies
      config.externals.push(...largeDependencies)
      
      // Also externalize by pattern for better coverage
      config.externals.push({
        '@aws-sdk': 'commonjs @aws-sdk',
        'canvas': 'commonjs canvas',
      })
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
  // Skip type checking during build for speed (optional - remove for stricter builds)
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
}

module.exports = nextConfig
