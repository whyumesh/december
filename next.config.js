/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
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
      '@radix-ui/react-toast',
    ],
  },
  // Only include Prisma engine for Vercel (rhel). Do NOT include node_modules/next/** —
  // that forces 100MB+ into every function and exceeds the 250 MB limit.
  outputFileTracingIncludes: {
    '*': [
      'node_modules/.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
    ],
  },
  outputFileTracingExcludes: {
    '*': [
        'node_modules/@swc/core-linux-x64-gnu/**/*',
        'node_modules/@swc/core-darwin-x64/**/*',
        'node_modules/@swc/core-darwin-arm64/**/*',
        'node_modules/@swc/core-win32-x64/**/*',
        'node_modules/@esbuild/**/*',
        'node_modules/terser/**/*',
        'node_modules/webpack/**/*',
        'node_modules/.cache/**/*',
        'node_modules/.prisma/client/libquery_engine-darwin*',
        'node_modules/.prisma/client/libquery_engine-windows*',
        'node_modules/.prisma/client/libquery_engine-debian*',
        'node_modules/@prisma/engines/**/query-engine-darwin*',
        'node_modules/@prisma/engines/**/query-engine-windows*',
        'node_modules/@prisma/engines/**/query-engine-debian*',
        'node_modules/@prisma/engines/**/migration-engine*',
        'node_modules/@prisma/engines/**/introspection-engine*',
        'node_modules/@prisma/engines/**/prisma-fmt*',
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
        '!node_modules/next/**',
        '!node_modules/styled-jsx/**',
        '!node_modules/@prisma/client/**',
        '!node_modules/.prisma/client/**',
        '**/*.ts',
        '!**/*.d.ts',
        '!node_modules/next/**/*.ts',
        '!node_modules/@prisma/client/**/*.ts',
        '!node_modules/.prisma/client/**/*.ts',
        'node_modules/@radix-ui/**/*.stories.*',
        'node_modules/@radix-ui/**/README*',
        'node_modules/recharts/**/*.ts',
        'node_modules/recharts/**/examples/**',
        'node_modules/date-fns/**/locale/**',
        'node_modules/date-fns/**/esm/**',
        'node_modules/date-fns/**/fp/**',
        '.next/cache/**',
        '.next/trace*',
        '.next/static/**',
        '.next/BUILD_ID',
        '.next/routes-manifest.json',
        '.next/prerender-manifest.json',
        '.next/images-manifest.json',
    ],
  },
  transpilePackages: [],
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
      
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
  productionBrowserSourceMaps: false,
  compress: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig