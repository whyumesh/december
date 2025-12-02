import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/db'
import { logger } from '@/lib/logger'
import { freeStorageService } from '@/lib/free-storage'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Production health check
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = Date.now().toString()

  // Gracefully handle missing database URL (e.g., during build)
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      responseTime: Date.now() - startTime,
      services: {
        database: { healthy: false, error: 'DATABASE_URL not configured' },
        cloudinary: { healthy: false, error: 'Not configured' },
        system: { error: 'Not available' }
      }
    }, { status: 503 })
  }

  try {
    logger.info('Health check request started', { requestId })

    // Check database health
    const dbHealth = await checkDatabaseHealth()

    // Check Cloudinary health (simple test)
    let cloudinaryHealth = { healthy: true, latency: 0, error: undefined }
    try {
      const cloudinaryStart = Date.now()
      await freeStorageService.fileExists('health-check-test')
      cloudinaryHealth.latency = Date.now() - cloudinaryStart
    } catch (error: any) {
      cloudinaryHealth = {
        healthy: false,
        latency: 0,
        error: error.message
      }
    }

    // Check system resources
    const systemHealth = {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
        external: Math.round(process.memoryUsage().external / 1024 / 1024) // MB
      },
      uptime: Math.round(process.uptime()), // seconds
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch
    }

    // Overall health status
    const overallHealthy = dbHealth.healthy && cloudinaryHealth.healthy

    const healthData = {
      status: overallHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      responseTime: Date.now() - startTime,
      services: {
        database: {
          healthy: dbHealth.healthy,
          latency: dbHealth.latency,
          error: dbHealth.error
        },
        cloudinary: cloudinaryHealth,
        system: systemHealth
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        version: process.env.npm_package_version || 'unknown'
      }
    }

    logger.info('Health check completed', {
      requestId,
      status: healthData.status,
      responseTime: healthData.responseTime,
      dbHealthy: dbHealth.healthy,
      cloudinaryHealthy: cloudinaryHealth.healthy
    })

    return NextResponse.json(healthData, {
      status: overallHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error: any) {
    const responseTime = Date.now() - startTime

    logger.error('Health check failed', {
      error: error.message,
      stack: error.stack,
      requestId,
      responseTime
    })

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      responseTime,
      error: 'Health check failed',
      services: {
        database: { healthy: false, error: 'Health check failed' },
        cloudinary: { healthy: false, error: 'Health check failed' },
        system: { error: 'Health check failed' }
      }
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  }
}