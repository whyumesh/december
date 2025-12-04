// PHASE 1 DEPLOYMENT: Prisma disabled
// This file provides a stub implementation that allows the app to build and run without database
// In Phase 2, this will be replaced with the actual Prisma implementation

import { logger } from './logger'

// Mock PrismaClient type for TypeScript
type MockPrismaClient = {
  [key: string]: any
  $connect: () => Promise<void>
  $disconnect: () => Promise<void>
  $queryRaw: (query: any) => Promise<any[]>
  $transaction: (queries: any[]) => Promise<any>
}

// Create a mock Prisma client that returns empty data
function createMockPrismaClient(): MockPrismaClient {
  const mockModel = {
    findMany: () => Promise.resolve([]),
    findUnique: () => Promise.resolve(null),
    findFirst: () => Promise.resolve(null),
    create: () => Promise.resolve({ id: 'mock-id' }),
    update: () => Promise.resolve({ id: 'mock-id' }),
    delete: () => Promise.resolve({ id: 'mock-id' }),
    count: () => Promise.resolve(0),
    groupBy: () => Promise.resolve([]),
    aggregate: () => Promise.resolve({ _count: 0 }),
    deleteMany: () => Promise.resolve({ count: 0 }),
    updateMany: () => Promise.resolve({ count: 0 }),
    upsert: () => Promise.resolve({ id: 'mock-id' }),
  }

  const mockClient: MockPrismaClient = {
    $connect: async () => {
      logger.warn('Database disabled in Phase 1 deployment - $connect called but ignored')
    },
    $disconnect: async () => {
      logger.warn('Database disabled in Phase 1 deployment - $disconnect called but ignored')
    },
    $queryRaw: async () => {
      logger.warn('Database disabled in Phase 1 deployment - $queryRaw called but returning empty array')
      return []
    },
    $transaction: async (queries: any[]) => {
      logger.warn('Database disabled in Phase 1 deployment - $transaction called but returning empty results')
      return queries.map(() => ({}))
    },
    // Mock all Prisma models
    user: mockModel,
    voter: mockModel,
    vote: mockModel,
    election: mockModel,
    zone: mockModel,
    yuvaPankhCandidate: mockModel,
    yuvaPankhNominee: mockModel,
    karobariCandidate: mockModel,
    trusteeCandidate: mockModel,
    uploadedFile: mockModel,
    admin: mockModel,
    karobariAdmin: mockModel,
  }

  return mockClient
}

// Export mock prisma instance
export const prisma = createMockPrismaClient()

// Database health check - always returns unhealthy in Phase 1
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  latency: number
  error?: string
}> {
  logger.warn('Database health check called but database is disabled in Phase 1')
  return {
    healthy: false,
    latency: 0,
    error: 'Database disabled in Phase 1 deployment. Will be enabled in Phase 2.'
  }
}

// Database connection retry wrapper - returns empty result
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  context: string = 'database-operation'
): Promise<T> {
  logger.warn(`Database operation '${context}' called but database is disabled in Phase 1`)
  
  // Return empty/default value based on operation type
  // This allows the app to continue without crashing
  return Promise.resolve([] as any) as Promise<T>
}

// Graceful shutdown - no-op in Phase 1
if (process.env.NODE_ENV === 'production') {
  process.on('beforeExit', async () => {
    logger.info('Application shutting down - database already disabled')
  })

  process.on('SIGINT', async () => {
    logger.info('SIGINT received - database already disabled')
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received - database already disabled')
    process.exit(0)
  })
}
