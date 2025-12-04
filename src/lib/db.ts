import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Production database configuration
const createPrismaClient = () => {
  // Use environment variable for database URL (required for security)
  const databaseUrl = process.env.DATABASE_URL
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  logger.info('Creating Prisma client', {
    url: databaseUrl.substring(0, 50) + '...',
    environment: process.env.NODE_ENV
  })

  const client = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'minimal',
  })

  return client
}

// Lazy initialization - only create client when actually needed
let prismaInstance: PrismaClient | undefined

// Check if we're in build phase
const isBuildTime = typeof process !== 'undefined' && (
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-export' ||
  (process.env.NETLIFY === 'true' && !process.env.DATABASE_URL) ||
  (process.env.CI === 'true' && !process.env.DATABASE_URL && process.env.NODE_ENV === 'production')
)

function getPrisma(): PrismaClient {
  // Return existing instance if available
  if (prismaInstance) {
    return prismaInstance
  }

  // During build time, if DATABASE_URL is not available, return a safe proxy
  if (isBuildTime && !process.env.DATABASE_URL) {
    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return undefined
        }
        if (prop === Symbol.toStringTag || prop === 'constructor') {
          return 'PrismaClient'
        }
        if (typeof prop === 'string' && prop.startsWith('$')) {
          return () => Promise.resolve()
        }
        if (typeof prop === 'string') {
          return new Proxy({}, {
            get() {
              return () => Promise.resolve([])
            }
          })
        }
        return undefined
      }
    })
  }

  // At runtime, DATABASE_URL must be available
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  try {
    // Use global instance if available (for development hot-reload)
    if (globalForPrisma.prisma) {
      prismaInstance = globalForPrisma.prisma
      return prismaInstance
    }

    // Create new instance
    prismaInstance = createPrismaClient()
    
    // Cache in global for development (prevents multiple instances during hot-reload)
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance
    }
    
    logger.info('Prisma client initialized successfully')
    return prismaInstance
  } catch (error: any) {
    logger.error('Failed to initialize Prisma client', {
      error: error.message,
      stack: error.stack
    })
    throw error
  }
}

// Create a safe proxy for model access
function createSafeModelProxy(modelName: string): any {
  return new Proxy({}, {
    get(_target, prop) {
      if (prop === Symbol.toStringTag || prop === 'constructor' || prop === 'then' || prop === 'catch' || prop === 'finally') {
        return undefined
      }
      
      return function(...args: any[]) {
        try {
          const client = getPrisma()
          const model = (client as any)[modelName]
          if (model && typeof model[prop] === 'function') {
            return model[prop].apply(model, args)
          }
          throw new Error(`Method ${String(prop)} not found on ${modelName}`)
        } catch (error: any) {
          if (error.message.includes('DATABASE_URL')) {
            throw new Error('DATABASE_URL environment variable is required. Please set it in your environment variables.')
          }
          throw error
        }
      }
    }
  })
}

// Export prisma with lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    // Handle special Prisma properties
    if (prop === '$connect' || prop === '$disconnect' || prop === '$queryRaw' || prop === '$transaction' || prop === '$use') {
      return function(...args: any[]) {
        try {
          const client = getPrisma()
          const method = (client as any)[prop]
          if (typeof method === 'function') {
            return method.apply(client, args)
          }
        } catch (error: any) {
          if (error.message.includes('DATABASE_URL')) {
            throw new Error('DATABASE_URL environment variable is required. Please set it in your environment variables.')
          }
          throw error
        }
      }
    }
    
    // Allow safe property checks
    if (prop === Symbol.toStringTag || prop === 'constructor') {
      return 'PrismaClient'
    }
    if (prop === 'then' || prop === 'catch' || prop === 'finally') {
      return undefined
    }
    
    // For model access (user, voter, etc.), return a safe proxy
    if (typeof prop === 'string' && !prop.startsWith('$')) {
      return createSafeModelProxy(prop)
    }
    
    // For other properties, try to get them from the actual client
    if (!process.env.DATABASE_URL && !isBuildTime) {
      return undefined
    }
    
    try {
      const client = getPrisma()
      const value = (client as any)[prop]
      
      if (typeof value === 'function') {
        return value.bind(client)
      }
      
      return value
    } catch (error: any) {
      if (error.message.includes('DATABASE_URL') && !isBuildTime) {
        return undefined
      }
      throw error
    }
  }
})

// Database health check
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const client = getPrisma()
    await client.$queryRaw`SELECT 1`
    const latency = Date.now() - startTime
    
    logger.debug('Database health check passed', { latency })
    
    return {
      healthy: true,
      latency
    }
  } catch (error: any) {
    const latency = Date.now() - startTime
    
    logger.error('Database health check failed', {
      error: error.message,
      latency
    })
    
    return {
      healthy: false,
      latency,
      error: error.message
    }
  }
}

// Database connection retry wrapper
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'database-operation'
): Promise<T> {
  let lastError: any

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries})`, {
        context,
        error: error.message,
        attempt
      })

      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  logger.error(`Database operation failed after ${maxRetries} attempts`, {
    context,
    error: lastError.message,
    maxRetries
  })

  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError.message}`)
}

// Graceful shutdown
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    logger.info('Application shutting down - disconnecting database')
    if (prismaInstance) {
      await prismaInstance.$disconnect()
    }
  })

  process.on('SIGINT', async () => {
    logger.info('SIGINT received - disconnecting database')
    if (prismaInstance) {
      await prismaInstance.$disconnect()
    }
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received - disconnecting database')
    if (prismaInstance) {
      await prismaInstance.$disconnect()
    }
    process.exit(0)
  })
}
