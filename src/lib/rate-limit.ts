import { logger } from './logger'
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

// Rate limit entry
interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

// Production rate limiter
class ProductionRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config: RateLimitConfig
  private cleanupInterval: NodeJS.Timeout | undefined

  constructor(config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  }) {
    this.config = config
    this.startCleanup()
  }

  private startCleanup() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  private cleanup() {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Rate limiter cleanup: removed ${cleanedCount} expired entries`)
    }
  }

  private getKey(identifier: string): string {
    // Normalize identifier (remove port, normalize IP)
    return identifier.split(':')[0].toLowerCase()
  }

  private isAllowed(identifier: string): boolean {
    const key = this.getKey(identifier)
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry) {
      // First request
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false
      })
      return true
    }

    if (now > entry.resetTime) {
      // Window expired, reset
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false
      })
      return true
    }

    if (entry.blocked) {
      return false
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      entry.blocked = true
      logger.warn('Rate limit exceeded', {
        identifier: key,
        count: entry.count,
        maxRequests: this.config.maxRequests,
        resetTime: new Date(entry.resetTime).toISOString()
      })
      return false
    }

    // Increment count
    entry.count++
    return true
  }

  public allow(identifier: string): boolean {
    try {
      return this.isAllowed(identifier)
    } catch (error: any) {
      logger.error('Rate limiter error', { error: error.message, identifier })
      // Fail open - allow request if rate limiter fails
      return true
    }
  }

  public getStatus(identifier: string): {
    allowed: boolean
    count: number
    maxRequests: number
    resetTime: Date
    blocked: boolean
  } {
    const key = this.getKey(identifier)
    const entry = this.limits.get(key)
    const now = Date.now()

    if (!entry || now > entry.resetTime) {
      return {
        allowed: true,
        count: 0,
        maxRequests: this.config.maxRequests,
        resetTime: new Date(now + this.config.windowMs),
        blocked: false
      }
    }

    return {
      allowed: !entry.blocked && entry.count < this.config.maxRequests,
      count: entry.count,
      maxRequests: this.config.maxRequests,
      resetTime: new Date(entry.resetTime),
      blocked: entry.blocked
    }
  }

  public reset(identifier: string): void {
    const key = this.getKey(identifier)
    this.limits.delete(key)
    logger.info('Rate limit reset', { identifier: key })
  }

  public getStats(): {
    totalEntries: number
    blockedEntries: number
    config: RateLimitConfig
  } {
    let blockedEntries = 0
    for (const entry of this.limits.values()) {
      if (entry.blocked) blockedEntries++
    }

    return {
      totalEntries: this.limits.size,
      blockedEntries,
      config: this.config
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.limits.clear()
  }
}

// Create rate limiter instances for different endpoints
export const rateLimiter = new ProductionRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100 // 100 requests per window
})

export const uploadRateLimiter = new ProductionRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20 // 20 uploads per hour
})

export const authRateLimiter = new ProductionRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5 // 5 login attempts per 15 minutes
})

// Rate limit configurations for different endpoint types
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 login attempts per 15 minutes
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20 // 20 uploads per hour
  },
  otp: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 3 // 3 OTP requests per 15 minutes
  },
  voting: {
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 1 // 1 vote per 24 hours (already enforced by hasVoted flag)
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per window
  }
}

// Helper function to get client identifier from request
function getClientIdentifier(request: NextRequest): string {
  // Try to get IP from various headers (for proxies)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')
  
  return cfIp || realIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown')
}

// Create a rate-limited route handler
export function createRateLimitedRoute(
  handler: (request: NextRequest) => Promise<Response>,
  config: RateLimitConfig = rateLimitConfigs.general
) {
  // Create a rate limiter for this specific config
  const limiter = new ProductionRateLimiter(config)
  
  return async (request: NextRequest) => {
    const identifier = getClientIdentifier(request)
    
    // Check rate limit
    if (!limiter.allow(identifier)) {
      const status = limiter.getStatus(identifier)
      logger.warn('Rate limit exceeded', {
        identifier,
        endpoint: request.url,
        count: status.count,
        maxRequests: status.maxRequests,
        resetTime: status.resetTime
      })
      
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please try again later',
          resetTime: status.resetTime.toISOString()
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((status.resetTime.getTime() - Date.now()) / 1000).toString()
          }
        }
      )
    }
    
    // Call the handler with proper error handling
    try {
      const response = await handler(request)
      // Ensure we always return a response
      if (!response) {
        logger.error('Handler returned empty response', { identifier, url: request.url })
        return NextResponse.json(
          { error: 'Internal server error', message: 'Empty response from handler' },
          { status: 500 }
        )
      }
      return response
    } catch (error) {
      logger.error('Handler error', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        identifier,
        url: request.url
      })
      
      // Always return a proper error response - never throw or return empty
      try {
        return NextResponse.json(
          { 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
            details: process.env.NODE_ENV === 'development' 
              ? (error instanceof Error ? error.stack : undefined) 
              : undefined
          },
          { status: 500 }
        )
      } catch (responseError) {
        // If even creating error response fails, return minimal response
        logger.error('Failed to create error response', { responseError })
        return new NextResponse(
          JSON.stringify({ error: 'Internal server error' }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    }
  }
}

// Export types
export type { RateLimitConfig, RateLimitEntry }