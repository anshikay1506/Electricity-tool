
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

interface OTPStore {
  otp: string;
  expiresAt: number;
}


const otpStore = new Map<string, OTPStore>();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
});

// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email service is ready to send OTPs');
  }
});

// Generate 6-digit OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send real OTP via Email using Gmail App Password
export const sendEmailOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    // Store OTP in memory
    otpStore.set(`email:${email}`, { otp, expiresAt });
    
    // Send real email using nodemailer with App Password
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Green Energy Portal" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your Login OTP - Green Energy Open Access Portal',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1b4d3e 0%, #2d6a4f 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .logo { background: white; width: 60px; height: 60px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; }
            .content { background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .otp-box { background: #f0f4f2; padding: 20px; text-align: center; border-radius: 8px; margin: 25px 0; border: 1px solid #d4e6de; }
            .otp-code { font-size: 40px; font-weight: bold; letter-spacing: 8px; color: #2d6a4f; font-family: monospace; }
            .footer { text-align: center; margin-top: 25px; padding-top: 25px; border-top: 1px solid #e0e8e4; color: #999; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 12px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="#2d6a4f" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L4 7v5c0 5.25 3.4 10.15 8 11.35C16.6 22.15 20 17.25 20 12V7l-8-5z"/>
                  <path d="M9 12l2 2 4-4" stroke="white" stroke-width="1.5" fill="none" stroke-linecap="round"/>
                </svg>
              </div>
              <h1 style="color: white; margin: 0; font-size: 24px;">Green Energy Open Access</h1>
              <p style="color: #a8e6cf; margin: 10px 0 0 0;">RERC GEOA Portal</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1b4d3e; margin-top: 0;">Hello!</h2>
              <p style="color: #555; line-height: 1.6;">You requested a One-Time Password (OTP) to log in to your Green Energy Open Access account.</p>
              
              <div class="otp-box">
                <p style="color: #666; margin: 0 0 10px 0; font-size: 14px;">Your OTP is:</p>
                <div class="otp-code">${otp}</div>
                <p style="color: #999; margin: 10px 0 0 0; font-size: 12px;">This OTP is valid for 10 minutes</p>
              </div>
              
              <p style="color: #555; line-height: 1.6;">If you didn't request this OTP, please ignore this email and ensure your account is secure.</p>
              
              <div class="warning">
                ⚠️ Never share this OTP with anyone. Our support team will never ask for your OTP.
              </div>
              
              <div class="footer">
                <p>This is an automated message, please do not reply.</p>
                <p>© 2024 Green Energy Open Access Portal | RERC Compliant</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    
    console.log(`✅ OTP sent to ${email} (OTP: ${otp})`); // Log for debugging (remove in production)
    return { success: true, message: 'OTP sent to your email' };
    
  } catch (error: any) {
    console.error('❌ Error sending email OTP:', error);
    
    // Provide user-friendly error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your Gmail App Password configuration.');
    } else if (error.code === 'ESOCKET') {
      throw new Error('Network error. Please check your internet connection.');
    } else {
      throw new Error('Failed to send OTP email. Please try again later.');
    }
  }
};

// Send OTP via SMS (Phone OTP - requires Twilio for production)
export const sendPhoneOTP = async (phone: string): Promise<{ success: boolean; message: string }> => {
  try {
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    
    // Store OTP
    otpStore.set(`phone:${phone}`, { otp, expiresAt });
    
    
    
    return { success: true, message: 'OTP sent to your phone' };
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    throw new Error('Failed to send OTP SMS');
  }
};

// Verify OTP
export const verifyOTP = async (
  identifier: string, 
  otp: string, 
  type: 'email' | 'phone'
): Promise<{ success: boolean; error?: string }> => {
  const key = `${type}:${identifier}`;
  const storedData = otpStore.get(key);
  
//   console.log(`🔍 Verifying OTP for ${identifier}:`, {
//     type,
//     receivedOTP: otp,
//     storedOTP: storedData?.otp,
//     isValid: storedData?.otp === otp,
//     isExpired: storedData ? Date.now() > storedData.expiresAt : false
//   });
  
  if (!storedData) {
    return { success: false, error: 'OTP not found or expired. Please request a new OTP.' };
  }
  
  if (Date.now() > storedData.expiresAt) {
    otpStore.delete(key);
    return { success: false, error: 'OTP has expired. Please request a new OTP.' };
  }
  
  if (storedData.otp !== otp) {
    return { success: false, error: 'Invalid OTP. Please try again.' };
  }
  
  // OTP is valid, delete it (one-time use)
  otpStore.delete(key);
  return { success: true };
};

// Clean up expired OTPs every hour
setInterval(() => {
  const now = Date.now();
  let deletedCount = 0;
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiresAt) {
      otpStore.delete(key);
      deletedCount++;
    }
  }
  if (deletedCount > 0) {
    console.log(`🧹 Cleaned up ${deletedCount} expired OTPs`);
  }
}, 60 * 60 * 1000);