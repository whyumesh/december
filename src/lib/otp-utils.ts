/**
 * OTP Utility Functions
 * 
 * Clean ES module for OTP generation, validation, and management
 * Includes in-memory store for OTP tracking and rate limiting
 */

import { prisma } from './db';

// OTP Configuration
const OTP_CONFIG = {
  length: 6,
  expiryMinutes: 5,
  maxResendAttempts: 3,
  maxVerifyAttempts: 5,
};

// In-memory store for OTP tracking (for rate limiting and resend tracking)
// In production, consider using Redis for distributed systems
interface OTPRecord {
  otp: string;
  createdAt: Date;
  expiresAt: Date;
  attempts: number;
  verified: boolean;
  resendCount: number;
}

const otpStore = new Map<string, OTPRecord>();

/**
 * Generate a random 6-digit OTP
 * 
 * @returns 6-digit OTP string
 */
export function generateOTP(): string {
  // Generate random 6-digit number (100000 to 999999)
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log('🔑 Generated OTP:', otp);
  return otp;
}

/**
 * Create expiry date for OTP
 * 
 * @param minutes - Minutes until expiry (default: 5)
 * @returns Date object for expiry time
 */
export function createOTPExpiry(minutes: number = OTP_CONFIG.expiryMinutes): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

/**
 * Check if OTP is expired
 * 
 * @param expiresAt - Expiry date
 * @returns true if expired, false otherwise
 */
export function isOTPExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Save OTP to database
 * 
 * @param identifier - Email or phone number
 * @param otp - OTP code
 * @param expiresAt - Expiry date
 * @returns Promise<void>
 */
export async function saveOTP(
  identifier: string,
  otp: string,
  expiresAt: Date
): Promise<void> {
  try {
    // Save to database (using 'phone' field for both phone and email)
    await prisma.oTP.create({
      data: {
        phone: identifier.toLowerCase().trim(),
        code: otp,
        expiresAt: expiresAt,
      },
    });

    // Also store in memory for rate limiting
    otpStore.set(identifier.toLowerCase().trim(), {
      otp,
      createdAt: new Date(),
      expiresAt,
      attempts: 0,
      verified: false,
      resendCount: 0,
    });

    console.log('💾 OTP saved:', {
      identifier: identifier.slice(0, 3) + '***',
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Error saving OTP:', error.message);
    throw new Error('Failed to save OTP');
  }
}

/**
 * Verify OTP from database
 * 
 * @param identifier - Email or phone number
 * @param otp - OTP code to verify
 * @returns Promise with verification result
 */
export async function verifyOTP(
  identifier: string,
  otp: string
): Promise<{ success: boolean; message: string }> {
  try {
    const normalizedIdentifier = identifier.toLowerCase().trim();

    // Get OTP from database
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: normalizedIdentifier,
        code: otp,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc', // Get most recent OTP
      },
    });

    if (!otpRecord) {
      // Update attempts in memory store
      const memoryRecord = otpStore.get(normalizedIdentifier);
      if (memoryRecord) {
        memoryRecord.attempts += 1;
        if (memoryRecord.attempts >= OTP_CONFIG.maxVerifyAttempts) {
          otpStore.delete(normalizedIdentifier);
          return {
            success: false,
            message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          };
        }
      }

      return {
        success: false,
        message: 'Invalid OTP. Please check and try again.',
      };
    }

    // Check if expired
    if (isOTPExpired(otpRecord.expiresAt)) {
      // Mark as used
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      });

      return {
        success: false,
        message: 'OTP has expired. Please request a new one.',
      };
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    // Update memory store
    const memoryRecord = otpStore.get(normalizedIdentifier);
    if (memoryRecord) {
      memoryRecord.verified = true;
    }

    console.log('✅ OTP verified successfully:', {
      identifier: identifier.slice(0, 3) + '***',
    });

    return {
      success: true,
      message: 'OTP verified successfully',
    };

  } catch (error: any) {
    console.error('❌ Error verifying OTP:', error.message);
    return {
      success: false,
      message: 'Failed to verify OTP. Please try again.',
    };
  }
}

/**
 * Check if user can resend OTP (rate limiting)
 * 
 * @param identifier - Email or phone number
 * @returns true if can resend, false otherwise
 */
export function canResendOTP(identifier: string): { allowed: boolean; message?: string } {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const record = otpStore.get(normalizedIdentifier);

  if (!record) {
    return { allowed: true };
  }

  // Check resend count
  if (record.resendCount >= OTP_CONFIG.maxResendAttempts) {
    return {
      allowed: false,
      message: `Maximum resend attempts (${OTP_CONFIG.maxResendAttempts}) exceeded. Please wait before requesting again.`,
    };
  }

  // Check if OTP is already verified
  if (record.verified) {
    return {
      allowed: false,
      message: 'OTP has already been verified. Please request a new one if needed.',
    };
  }

  return { allowed: true };
}

/**
 * Increment resend count for identifier
 * 
 * @param identifier - Email or phone number
 */
export function incrementResendCount(identifier: string): void {
  const normalizedIdentifier = identifier.toLowerCase().trim();
  const record = otpStore.get(normalizedIdentifier);

  if (record) {
    record.resendCount += 1;
    console.log('📤 Resend count incremented:', {
      identifier: identifier.slice(0, 3) + '***',
      count: record.resendCount,
    });
  }
}

/**
 * Clean up expired OTPs from memory store
 * Runs periodically to prevent memory leaks
 */
export function cleanupExpiredOTPs(): void {
  const now = new Date();
  let cleaned = 0;

  for (const [identifier, record] of otpStore.entries()) {
    if (isOTPExpired(record.expiresAt) || record.verified) {
      otpStore.delete(identifier);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`🧹 Cleaned up ${cleaned} expired OTP records from memory`);
  }
}

// Run cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredOTPs, 10 * 60 * 1000);
}

// Export configuration
export { OTP_CONFIG };

