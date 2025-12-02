import nodemailer from 'nodemailer';
export const runtime = "nodejs";

// Create transporter using Gmail SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
    },
  });
};

// Send OTP email for voter login (overseas members)
export async function sendVoterOTP(
  email: string, 
  otp: string, 
  voterName: string
): Promise<{ success: boolean; message: string }> {
  try {
    const transporter = createTransporter();

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
  } catch (error) {
    console.error('Error sending voter OTP email:', error);
    return { 
      success: false, 
      message: 'Failed to send OTP email. Please try again.' 
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
