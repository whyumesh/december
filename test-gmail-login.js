/**
 * Test script to verify Gmail login functionality for voters
 * Run with: node test-gmail-login.js
 * 
 * Note: This script reads environment variables from process.env
 * Make sure to set GMAIL_USER and GMAIL_APP_PASSWORD in your environment
 */

const nodemailer = require('nodemailer');

// Try to load .env.local if dotenv is available
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, assume env vars are set in environment
}

console.log('🔍 Testing Gmail Login Functionality for Voters\n');
console.log('='.repeat(60));

// Step 1: Check Environment Variables
console.log('\n📋 Step 1: Checking Environment Variables');
console.log('-'.repeat(60));

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

if (!gmailUser) {
  console.error('❌ GMAIL_USER is not set');
  console.error('   Please set GMAIL_USER in your .env.local file');
  process.exit(1);
}

if (!gmailAppPassword) {
  console.error('❌ GMAIL_APP_PASSWORD is not set');
  console.error('   Please set GMAIL_APP_PASSWORD in your .env.local file');
  console.error('   Get it from: https://myaccount.google.com/apppasswords');
  process.exit(1);
}

console.log('✅ GMAIL_USER is set:', gmailUser);
console.log('✅ GMAIL_APP_PASSWORD is set:', gmailAppPassword ? '***' + gmailAppPassword.slice(-4) : 'NOT SET');

// Validate email format
if (!gmailUser.includes('@gmail.com') && !gmailUser.includes('@googlemail.com')) {
  console.warn('⚠️  GMAIL_USER does not appear to be a Gmail address');
}

// Validate app password format
if (gmailAppPassword.length !== 16 || gmailAppPassword.includes(' ')) {
  console.warn('⚠️  GMAIL_APP_PASSWORD format may be incorrect');
  console.warn('   App passwords should be 16 characters with no spaces');
  console.warn('   Current length:', gmailAppPassword.length);
}

// Step 2: Test SMTP Connection
console.log('\n📧 Step 2: Testing Gmail SMTP Connection');
console.log('-'.repeat(60));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailUser.trim(),
    pass: gmailAppPassword.trim(),
  },
  connectionTimeout: 10000,
  socketTimeout: 10000,
});

transporter.verify()
  .then(() => {
    console.log('✅ SMTP connection verified successfully');
    
    // Step 3: Test Email Sending
    console.log('\n📨 Step 3: Testing Email Sending');
    console.log('-'.repeat(60));
    
    const testEmail = {
      from: {
        name: 'KMS Election Commission 2026',
        address: gmailUser
      },
      to: gmailUser, // Send test email to self
      subject: 'Test OTP - Gmail Login Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">KMS Election Commission 2026</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Test Email - Gmail Login</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Test Email</h2>
            
            <p style="color: #666; line-height: 1.6;">
              This is a test email to verify that Gmail SMTP is working correctly for voter login.
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Test OTP Code:</p>
              <h1 style="color: #667eea; font-size: 32px; margin: 10px 0; letter-spacing: 5px; font-weight: bold;">123456</h1>
            </div>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>✅ Gmail SMTP Configuration Working!</strong><br>
                If you received this email, your Gmail login functionality is configured correctly.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is a test email. Please do not reply.</p>
            <p>© 2025 KMS Election Commission 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    return transporter.sendMail(testEmail);
  })
  .then((result) => {
    console.log('✅ Test email sent successfully!');
    console.log('   Message ID:', result.messageId);
    console.log('   Check your inbox at:', gmailUser);
    
    // Step 4: Summary
    console.log('\n📊 Step 4: Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Environment variables configured');
    console.log('✅ SMTP connection successful');
    console.log('✅ Email sending working');
    console.log('\n✅ Gmail login functionality is WORKING CORRECTLY!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Make sure you have voters with email addresses in your database');
    console.log('   2. Test the actual login flow at: /voter/login');
    console.log('   3. Select "Email" option and enter a voter email address');
    console.log('   4. Check if OTP is received in the email');
    console.log('\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error occurred:');
    console.error('-'.repeat(60));
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Response code:', error.responseCode);
    console.error('Response:', error.response);
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.error('\n🔐 Authentication Failed - Troubleshooting:');
      console.error('   1. Go to: https://myaccount.google.com/apppasswords');
      console.error('   2. Ensure 2-Step Verification is enabled on your Google Account');
      console.error('   3. Generate a new App Password for "Mail" application');
      console.error('   4. Copy the 16-character password (no spaces)');
      console.error('   5. Verify GMAIL_USER is your full email address');
      console.error('   6. Update GMAIL_APP_PASSWORD in .env.local');
      console.error('   7. Restart the application/server');
      console.error('\n   Common Issues:');
      console.error('   - Using regular Gmail password instead of App Password');
      console.error('   - App password has spaces (should be 16 characters, no spaces)');
      console.error('   - 2-Step Verification not enabled');
      console.error('   - App password was revoked or expired');
      console.error('   - Wrong email address in GMAIL_USER');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.error('\n🔌 Connection Error:');
      console.error('   Unable to connect to Gmail SMTP servers');
      console.error('   Check your internet connection and try again');
    }
    
    console.error('\n');
    process.exit(1);
  });

