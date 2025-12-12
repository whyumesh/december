/**
 * Email Utility - Gmail SMTP Configuration
 * 
 * Clean ES module structure for sending emails via Gmail
 * Uses Nodemailer with proper error handling and logging
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export const runtime = "nodejs";

// Gmail SMTP Configuration
const GMAIL_CONFIG = {
  email: process.env.GMAIL_USER || 'no.reply.electkms@gmail.com',
  password: process.env.GMAIL_APP_PASSWORD || 'sempfpspspderyiw',
};

// Singleton transporter instance (reused across requests for better performance)
let transporterInstance: Transporter | null = null;

/**
 * Create and configure Nodemailer transporter for Gmail
 * Uses singleton pattern to reuse connection
 */
function createTransporter(): Transporter {
  // Return existing instance if available
  if (transporterInstance) {
    return transporterInstance;
  }

  // Validate configuration
  if (!GMAIL_CONFIG.email || !GMAIL_CONFIG.password) {
    const error = new Error('Gmail SMTP configuration missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
    console.error('❌ Email Configuration Error:', error.message);
    throw error;
  }

  // Clean password (remove spaces if present - Gmail app passwords sometimes have spaces)
  const cleanedPassword = GMAIL_CONFIG.password.replace(/\s/g, '').trim();

  // Validate email format
  if (!GMAIL_CONFIG.email.includes('@gmail.com') && !GMAIL_CONFIG.email.includes('@googlemail.com')) {
    console.warn('⚠️  GMAIL_USER does not appear to be a Gmail address:', GMAIL_CONFIG.email);
  }

  // Validate app password format (should be 16 characters, no spaces)
  if (cleanedPassword.length !== 16) {
    console.warn('⚠️  GMAIL_APP_PASSWORD format may be incorrect. App passwords should be 16 characters with no spaces.');
    console.warn('   Current length:', cleanedPassword.length);
  }

  // Log configuration (without exposing password)
  console.log('📧 Gmail SMTP Configuration:');
  console.log('   Email:', GMAIL_CONFIG.email);
  console.log('   Password Length:', cleanedPassword.length, 'characters');

  // Create transporter using Gmail service
  transporterInstance = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_CONFIG.email.trim(),
      pass: cleanedPassword, // Use App Password (cleaned, no spaces), not regular password
    },
    connectionTimeout: 15000, // 15 seconds
    socketTimeout: 15000, // 15 seconds
  });

  return transporterInstance;
}

/**
 * Verify SMTP connection
 * Useful for health checks and debugging
 */
export async function verifyConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log('🔍 Verifying Gmail SMTP connection...');
    console.log('   Email:', GMAIL_CONFIG.email);
    
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('✅ SMTP connection verified successfully');
    return {
      success: true,
      message: 'Gmail SMTP connection verified successfully',
    };
  } catch (error: any) {
    console.error('❌ SMTP connection verification failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response Code:', error.responseCode);
    console.error('   Response:', error.response);
    
    let message = 'SMTP connection verification failed';
    
    if (error?.code === 'EAUTH' || error?.responseCode === 535) {
      message = 'Authentication failed. Please check your Gmail credentials and ensure you are using an App Password (not your regular password).';
      console.error('🔐 Gmail Authentication Failed - Troubleshooting Steps:');
      console.error('   1. Go to: https://myaccount.google.com/apppasswords');
      console.error('   2. Ensure 2-Step Verification is enabled on your Google Account');
      console.error('   3. Generate a new App Password for "Mail" application');
      console.error('   4. Copy the 16-character password (no spaces)');
      console.error('   5. Verify GMAIL_USER is your full email address (e.g., yourname@gmail.com)');
      console.error('   6. Update GMAIL_APP_PASSWORD environment variable with the app password');
      console.error('   7. Restart the application/server after updating environment variables');
    } else if (error?.code === 'ECONNECTION' || error?.code === 'ETIMEDOUT') {
      message = 'Connection timeout. Please check your network connection.';
    }
    
    return {
      success: false,
      message,
      details: {
        error: error.message,
        code: error.code,
        responseCode: error.responseCode,
        response: error.response,
      },
    };
  }
}

/**
 * Send OTP email
 * 
 * @param to - Recipient email address
 * @param otp - 6-digit OTP code
 * @param options - Optional parameters (name, subject, etc.)
 * @returns Promise with success status and message
 */
export async function sendOTP(
  to: string,
  otp: string,
  options?: {
    recipientName?: string;
    subject?: string;
    expiryMinutes?: number;
  }
): Promise<{ success: boolean; message: string; messageId?: string }> {
  const startTime = Date.now();
  const recipientName = options?.recipientName || 'User';
  const subject = options?.subject || 'Login OTP - KMS Election Commission 2026';
  const expiryMinutes = options?.expiryMinutes || 5;

  console.log('📧 Preparing to send OTP email...');
  console.log('   To:', to);
  console.log('   OTP:', otp);
  console.log('   Recipient Name:', recipientName);

  try {
    // Get transporter
    const transporter = createTransporter();

    // Verify connection (optional, but helpful for debugging)
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified');
    } catch (verifyError: any) {
      console.warn('⚠️  SMTP verification failed, but continuing:', verifyError.message);
      // Continue anyway - verification failure doesn't always mean send will fail
    }

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login OTP</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table role="presentation" style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <table role="presentation" style="width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">KMS Election Commission 2026</h1>
                      <p style="color: white; margin: 10px 0 0 0; opacity: 0.9; font-size: 14px;">Voter Login OTP</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <h2 style="color: #333; margin-top: 0; font-size: 20px;">Hello ${recipientName},</h2>
                      
                      <p style="color: #666; line-height: 1.6; font-size: 14px;">
                        You have requested to login to your voter account. Use the OTP below to complete your login:
                      </p>
                      
                      <!-- OTP Box -->
                      <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                        <p style="margin: 0; color: #666; font-size: 14px; font-weight: 500;">Your OTP Code:</p>
                        <h1 style="color: #667eea; font-size: 36px; margin: 10px 0; letter-spacing: 8px; font-weight: bold; font-family: 'Courier New', monospace;">${otp}</h1>
                      </div>
                      
                      <!-- Important Info -->
                      <p style="color: #666; line-height: 1.6; font-size: 14px; margin-top: 20px;">
                        <strong style="color: #333;">Important:</strong>
                      </p>
                      <ul style="color: #666; line-height: 1.8; padding-left: 20px; font-size: 14px;">
                        <li>This OTP is valid for ${expiryMinutes} minutes only</li>
                        <li>Do not share this OTP with anyone</li>
                        <li>If you didn't request this login, please ignore this email</li>
                      </ul>
                      
                      <!-- Security Note -->
                      <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                        <p style="margin: 0; color: #856404; font-size: 13px;">
                          <strong>Security Note:</strong> Our team will never ask for your OTP or password. 
                          Always verify the sender before taking any action.
                        </p>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef;">
                      <p style="margin: 0; color: #999; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                      </p>
                      <p style="margin: 5px 0 0 0; color: #999; font-size: 12px;">
                        © 2025 KMS Election Commission 2026. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Plain text version (for email clients that don't support HTML)
    const textContent = `
KMS Election Commission 2026 - Login OTP

Hello ${recipientName},

You have requested to login to your voter account. Use the OTP below to complete your login:

Your OTP Code: ${otp}

Important:
- This OTP is valid for ${expiryMinutes} minutes only
- Do not share this OTP with anyone
- If you didn't request this login, please ignore this email

Security Note: Our team will never ask for your OTP or password. Always verify the sender before taking any action.

© 2025 KMS Election Commission 2026. All rights reserved.
    `;

    // Mail options
    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: GMAIL_CONFIG.email,
      },
      to: to.trim(),
      subject: subject,
      text: textContent,
      html: htmlContent,
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);
    const duration = Date.now() - startTime;

    // Log success
    console.log('✅ OTP email sent successfully:');
    console.log('   Message ID:', result.messageId);
    console.log('   To:', to);
    console.log('   Duration:', duration, 'ms');
    console.log('   Response:', result.response);

    return {
      success: true,
      message: 'OTP has been sent to your email address',
      messageId: result.messageId,
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    const cleanedPassword = GMAIL_CONFIG.password?.replace(/\s/g, '').trim() || '';

    // Log error details
    console.error('❌ Error sending OTP email:');
    console.error('   To:', to);
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response Code:', error.responseCode);
    console.error('   Duration:', duration, 'ms');

    // Provide user-friendly error messages
    let errorMessage = 'Failed to send OTP email. Please try again.';

    if (error?.message?.includes('Gmail SMTP configuration')) {
      errorMessage = 'Email service is not configured. Please contact administrator.';
    } else if (error?.code === 'EAUTH' || error?.responseCode === 535) {
      errorMessage = 'Email authentication failed. Please check Gmail credentials and ensure you are using an App Password (not your regular password).';
      console.error('🔐 Gmail Authentication Failed - Troubleshooting Steps:');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('   Current Configuration:');
      console.error('   - Email:', GMAIL_CONFIG.email);
      console.error('   - Password Length:', cleanedPassword.length, 'characters');
      console.error('   - Error Code:', error?.code);
      console.error('   - Response Code:', error?.responseCode);
      console.error('   - Response:', error?.response);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('   Troubleshooting Steps:');
      console.error('   1. Go to: https://myaccount.google.com/apppasswords');
      console.error('   2. Ensure 2-Step Verification is enabled on your Google Account');
      console.error('   3. Generate a new App Password for "Mail" application');
      console.error('   4. Copy the 16-character password (no spaces)');
      console.error('   5. Verify GMAIL_USER is your full email address (e.g., yourname@gmail.com)');
      console.error('   6. Update GMAIL_APP_PASSWORD environment variable with the app password');
      console.error('   7. Restart the application/server after updating environment variables');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else if (error?.code === 'ECONNECTION' || error?.code === 'ETIMEDOUT') {
      errorMessage = 'Unable to connect to email service. Please try again later.';
    } else if (error?.responseCode === 550) {
      errorMessage = 'Invalid email address. Please check your email and try again.';
    }

    return {
      success: false,
      message: errorMessage,
    };
  }
}

/**
 * Send generic email (for notifications, etc.)
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 * @returns Promise with success status and message
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<{ success: boolean; message: string; messageId?: string }> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: GMAIL_CONFIG.email,
      },
      to: to.trim(),
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text version
    };

    const result = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', result.messageId);

    return {
      success: true,
      message: 'Email sent successfully',
      messageId: result.messageId,
    };

  } catch (error: any) {
    console.error('❌ Error sending email:', error.message);

    return {
      success: false,
      message: error.message || 'Failed to send email',
    };
  }
}

/**
 * Test email sending with current configuration
 * Useful for debugging authentication issues
 */
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    console.log('🧪 Testing Gmail email configuration...');
    
    if (!GMAIL_CONFIG.email) {
      return {
        success: false,
        message: 'GMAIL_USER is not set. Please configure Gmail credentials.',
      };
    }
    
    // First verify connection
    const verifyResult = await verifyConnection();
    if (!verifyResult.success) {
      return verifyResult;
    }
    
    // Try sending a test email to the same address
    const testResult = await sendOTP(
      GMAIL_CONFIG.email,
      '123456',
      {
        recipientName: 'Test User',
        subject: 'Test Email - Gmail Configuration',
        expiryMinutes: 5,
      }
    );
    
    if (testResult.success) {
      return {
        success: true,
        message: 'Gmail configuration test successful! Test email sent.',
        details: {
          messageId: testResult.messageId,
        },
      };
    } else {
      return {
        success: false,
        message: testResult.message,
      };
    }
  } catch (error: any) {
    console.error('❌ Email configuration test failed:', error);
    return {
      success: false,
      message: error.message || 'Email configuration test failed',
      details: {
        error: error.message,
        code: error.code,
      },
    };
  }
}

// Export configuration for testing/debugging
export { GMAIL_CONFIG };
