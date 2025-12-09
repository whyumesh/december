import nodemailer from 'nodemailer';
export const runtime = "nodejs";

// Create transporter using Gmail SMTP
const createTransporter = () => {
  const emailUser = process.env.GMAIL_USER
  const emailPassword = process.env.GMAIL_APP_PASSWORD

  console.log('🔍 Checking Gmail configuration...')
  console.log('   GMAIL_USER:', process.env.GMAIL_USER ? 'SET' : 'NOT SET')
  console.log('   GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'SET' : 'NOT SET')
  console.log('   Email:', emailUser || 'NOT SET')
  console.log('   Password length:', emailPassword ? emailPassword.length : 'NOT SET')

  if (!emailUser || !emailPassword) {
    console.error('❌ Gmail SMTP configuration missing:')
    console.error('   GMAIL_USER:', emailUser ? '***' : 'NOT SET')
    console.error('   GMAIL_APP_PASSWORD:', emailPassword ? '***' : 'NOT SET')
    throw new Error('Gmail SMTP configuration is missing. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.')
  }

  // Validate Gmail email format
  const isGmail = emailUser.includes('@gmail.com') || emailUser.includes('@googlemail.com')
  if (!isGmail) {
    console.warn('⚠️  GMAIL_USER does not appear to be a Gmail address:', emailUser)
    console.warn('   Gmail SMTP only works with @gmail.com or @googlemail.com addresses')
  }

  console.log('📧 Using Gmail SMTP:', emailUser)
  console.log('   Password length:', emailPassword.length)
  
  // Validate app password format for Gmail (should be 16 characters, no spaces)
  if (emailPassword.length !== 16 || emailPassword.includes(' ')) {
    if (emailPassword.length > 16) {
      console.warn('⚠️  GMAIL_APP_PASSWORD appears to be a regular password, not an App Password.')
      console.warn('   For Gmail, App Passwords are 16 characters with no spaces.')
      console.warn('   Regular passwords will NOT work for Gmail SMTP authentication.')
      console.warn('   Please generate an App Password from: https://myaccount.google.com/apppasswords')
    } else {
      console.warn('⚠️  GMAIL_APP_PASSWORD format may be incorrect.')
      console.warn('   Gmail App Passwords should be exactly 16 characters with no spaces.')
    }
  } else {
    console.log('   ✅ App Password format looks correct (16 characters)')
  }
  
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser.trim(),
      pass: emailPassword.trim(),
    },
    connectionTimeout: 20000,
    socketTimeout: 20000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
};

// Send OTP email for voter login (overseas members)
export async function sendVoterOTP(
  email: string, 
  otp: string, 
  voterName: string
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('📧 Preparing to send voter OTP email...')
    console.log('   Recipient:', email)
    console.log('   Voter Name:', voterName)
    
    const transporter = createTransporter();
    
    // Verify transporter connection
    console.log('🔍 Verifying SMTP connection...')
    try {
      await transporter.verify();
      console.log('✅ SMTP connection verified successfully')
    } catch (verifyError: any) {
      console.error('❌ SMTP verification failed:', verifyError)
      console.error('Verification error details:', {
        message: verifyError?.message,
        code: verifyError?.code,
        responseCode: verifyError?.responseCode,
        command: verifyError?.command,
        response: verifyError?.response,
        stack: verifyError?.stack
      })
      
      // If verification fails due to auth, throw a more specific error
      if (verifyError?.code === 'EAUTH' || verifyError?.responseCode === 535 || verifyError?.responseCode === 534) {
        console.error('🔐 Authentication failed during verification')
        throw verifyError // Re-throw to be caught by outer catch block
      }
      
      // For other verification errors, still try to send (some servers don't support verify)
      console.warn('⚠️  SMTP verification failed, but continuing with send attempt...')
    }

    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: process.env.GMAIL_USER || 'noreply@electkms.org'
      },
      to: email,
      subject: 'Login OTP - KMS Election Commission 2026',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">KMS Election Commission 2026</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Voter Login OTP</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hello ${voterName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              You have requested to login to your voter account. Use the OTP below to complete your login:
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code:</p>
              <h1 style="color: #667eea; font-size: 32px; margin: 10px 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this login, please ignore this email</li>
            </ul>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Note:</strong> Our team will never ask for your OTP or password. 
                Always verify the sender before taking any action.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 KMS Election Commission 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Voter OTP email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      message: 'OTP has been sent to your registered email address' 
    };
  } catch (error: any) {
    console.error('❌ Error sending voter OTP email:', error);
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      responseCode: error?.responseCode,
      response: error?.response,
      command: error?.command,
      stack: error?.stack
    });
    
    // Get email configuration for detection
    const emailUser = process.env.GMAIL_USER || ''
    const emailPassword = process.env.GMAIL_APP_PASSWORD || ''
    
    console.error('📧 Gmail Configuration Check:')
    console.error('   GMAIL_USER:', emailUser || 'NOT SET')
    console.error('   GMAIL_APP_PASSWORD length:', emailPassword.length || 'NOT SET')
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send OTP email. Please try again.'
    
    if (error?.message?.includes('Gmail SMTP configuration')) {
      errorMessage = 'Email service is not configured. Please contact administrator.'
    } else if (error?.code === 'EAUTH' || error?.responseCode === 535 || error?.responseCode === 534 || error?.command === 'AUTH' || 
               error?.message?.includes('Invalid login') || error?.message?.includes('authentication failed') ||
               error?.response?.includes('535') || error?.response?.includes('534')) {
      
      console.error('🔐 Gmail Authentication Error Detected:')
      console.error('   Error Code:', error?.code)
      console.error('   Response Code:', error?.responseCode)
      console.error('   Command:', error?.command)
      console.error('   Response:', error?.response)
      console.error('   Message:', error?.message)
      
      errorMessage = 'Email authentication failed. Please verify your Gmail App Password is correct.'
      console.error('🔐 Gmail Authentication Failed - Detailed Troubleshooting:')
      console.error('')
      console.error('   Current Configuration:')
      console.error('   - GMAIL_USER:', emailUser || 'NOT SET')
      console.error('   - GMAIL_APP_PASSWORD length:', emailPassword.length || 'NOT SET')
      console.error('   - Password starts with:', emailPassword ? emailPassword.substring(0, 3) + '***' : 'N/A')
      console.error('   - Expected: 16 characters (no spaces)')
      console.error('')
      console.error('   Error Details:')
      console.error('   - Error Code:', error?.code || 'N/A')
      console.error('   - Response Code:', error?.responseCode || 'N/A')
      console.error('   - Command:', error?.command || 'N/A')
      console.error('   - Response:', error?.response || 'N/A')
      console.error('   - Message:', error?.message || 'N/A')
      console.error('')
      console.error('   Step-by-Step Fix:')
      console.error('   1. Verify GMAIL_USER is correct:')
      console.error('      Current:', emailUser || 'NOT SET')
      console.error('      Should be: no.reply.electkms@gmail.com')
      console.error('')
      console.error('   2. Check if you\'re using App Password (NOT regular password):')
      console.error('      - Regular password:', emailPassword.length > 16 ? 'YES (WRONG!)' : 'NO')
      console.error('      - App Password (16 chars):', emailPassword.length === 16 ? 'YES' : 'NO')
      console.error('')
      console.error('   3. Generate Gmail App Password:')
      console.error('      a. Go to: https://myaccount.google.com/apppasswords')
      console.error('      b. If you see "App passwords aren\'t available":')
      console.error('         → Enable 2-Step Verification first: https://myaccount.google.com/security')
      console.error('      c. Select "Mail" as the app')
      console.error('      d. Select "Other (Custom name)" → Enter "KMS Election"')
      console.error('      e. Click "Generate"')
      console.error('      f. Copy the 16-character password (it will show as "abcd efgh ijkl mnop")')
      console.error('      g. Remove ALL spaces → Use as: "abcdefghijklmnop"')
      console.error('')
      console.error('   4. Update environment variables:')
      console.error('      - Local: Update .env.local with GMAIL_APP_PASSWORD')
      console.error('      - Vercel: Add GMAIL_APP_PASSWORD in Vercel Dashboard')
      console.error('')
      console.error('   5. Restart server after updating:')
      console.error('      - Local: Stop and restart npm run dev')
      console.error('      - Vercel: Redeploy the project')
      console.error('')
      console.error('   Common Mistakes:')
      console.error('   ❌ Using regular Gmail password (ElectKMSORG@2026)')
      console.error('   ❌ App Password has spaces (should be 16 chars, no spaces)')
      console.error('   ❌ 2-Step Verification not enabled')
      console.error('   ❌ Wrong email address')
      console.error('   ❌ Forgot to restart server after updating .env.local')
    } else if (error?.code === 'ECONNECTION' || error?.code === 'ETIMEDOUT' || error?.code === 'ESOCKET') {
      errorMessage = 'Unable to connect to email service. Please check your internet connection and try again later.'
      console.error('🔌 Connection Error:')
      console.error('   Error Code:', error?.code)
      console.error('   Message:', error?.message)
    } else if (error?.responseCode === 550) {
      errorMessage = 'Invalid email address. Please check your email and try again.'
    } else {
      // Unknown error - log everything
      console.error('❓ Unknown Error Type:')
      console.error('   Full error:', error)
      errorMessage = `Failed to send email: ${error?.message || 'Unknown error'}. Please check server logs.`
    }
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
}

// Send OTP email for forgot password
export async function sendForgotPasswordOTP(
  email: string, 
  otp: string, 
  candidateName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: process.env.GMAIL_USER || 'noreply@electkms.org'
      },
      to: email,
      subject: 'Password Reset OTP - KMS Election Commission 2026',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">KMS Election Commission 2026</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hello ${candidateName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password for your candidate account. 
              Use the OTP below to proceed with password reset:
            </p>
            
            <div style="background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code:</p>
              <h1 style="color: #667eea; font-size: 32px; margin: 10px 0; letter-spacing: 5px; font-weight: bold;">${otp}</h1>
            </div>
            
            <p style="color: #666; line-height: 1.6;">
              <strong>Important:</strong>
            </p>
            <ul style="color: #666; line-height: 1.6; padding-left: 20px;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Do not share this OTP with anyone</li>
              <li>If you didn't request this password reset, please ignore this email</li>
            </ul>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Note:</strong> Our team will never ask for your OTP or password. 
                Always verify the sender before taking any action.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 KMS Election Commission 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      message: 'OTP sent successfully to your email address' 
    };
  } catch (error) {
    console.error('Error sending forgot password OTP email:', error);
    return { 
      success: false, 
      message: 'Failed to send OTP email. Please try again.' 
    };
  }
}

// Send password reset confirmation email
export async function sendPasswordResetConfirmation(
  email: string, 
  candidateName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: process.env.GMAIL_USER || 'noreply@electkms.org'
      },
      to: email,
      subject: 'Password Reset Successful - KMS Election Commission 2026',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">KMS Election Commission 2026</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Successful</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Hello ${candidateName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Your password has been successfully reset. You can now log in to your candidate account 
              using your new password.
            </p>
            
            <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #155724; font-size: 14px;">
                <strong>✓ Password Reset Complete</strong><br>
                Your account is now secure with your new password.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/candidate/login" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Login to Your Account
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Reminder:</strong> If you didn't make this change, please contact our support team immediately.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 KMS Election Commission 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      message: 'Password reset confirmation sent' 
    };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    return { 
      success: false, 
      message: 'Failed to send confirmation email' 
    };
  }
}

// Send candidate rejection notification email
export async function sendCandidateRejectionEmail(
  email: string, 
  candidateName: string,
  position: string,
  rejectionReason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: {
        name: 'KMS Election Commission 2026',
        address: process.env.GMAIL_USER || 'noreply@electkms.org'
      },
      to: email,
      subject: 'Nomination Status Update - KMS Election Commission 2026',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">KMS Election Commission 2026</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Nomination Status Update</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
            <h2 style="color: #333; margin-top: 0;">Dear ${candidateName},</h2>
            
            <p style="color: #666; line-height: 1.6;">
              Thank you for your interest in participating in the KMS elections. After careful review 
              of your nomination, we regret to inform you 
              that your application has not been approved at this time.
            </p>
            
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #721c24; margin-top: 0; font-size: 16px;">Rejection Reason:</h3>
              <p style="color: #721c24; margin: 0; line-height: 1.6; font-style: italic;">
                "${rejectionReason}"
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Important Information:</strong>
              </p>
              <ul style="color: #856404; line-height: 1.6; padding-left: 20px; margin: 10px 0 0 0;">
                <li>To resubmit the nomination, login to your dashboard</li>
                <li>If you have any questions, please contact our support team</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://electkms.org/candidate/login" 
                 style="background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Access Your Account
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; text-align: center; margin-top: 30px;">
              We appreciate your participation in the democratic process and encourage you to 
              stay engaged with the KMS community.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2025 KMS Election Commission 2026. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Rejection email sent successfully:', result.messageId);
    
    return { 
      success: true, 
      message: 'Rejection notification sent successfully' 
    };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { 
      success: false, 
      message: 'Failed to send rejection notification' 
    };
  }
}
