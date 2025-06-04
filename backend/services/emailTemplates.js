const otpTemplate = (firstName, otp) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #3498db;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0 0 5px 5px;
      }
      .otp-code {
        font-size: 24px;
        font-weight: bold;
        color: #2c3e50;
        text-align: center;
        padding: 10px;
        margin: 20px 0;
        background-color: #fff;
        border-radius: 4px;
        border: 1px solid #ddd;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Your Verification Code</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName},</p>
      <p>Your one-time password (OTP) for login is:</p>
      <div class="otp-code">${otp}</div>
      <p>This code is valid for 5 minutes. Please do not share it with anyone.</p>
      <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>© ${new Date().getFullYear()} Employee Portal. All rights reserved.</p>
    </div>
  </body>
</html>
`;

const otpExpiredTemplate = (firstName) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #e74c3c;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0 0 5px 5px;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>OTP Expired</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName},</p>
      <p>Your verification code has expired. Please request a new code to continue with your login.</p>
      <p>For security reasons, OTP codes are only valid for 5 minutes.</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>© ${new Date().getFullYear()} Employee Portal. All rights reserved.</p>
    </div>
  </body>
</html>
`;

const tooManyAttemptsTemplate = (firstName) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #e74c3c;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0 0 5px 5px;
      }
      .warning {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
        padding: 10px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Too Many Attempts</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName},</p>
      <div class="warning">
        <p><strong>Security Alert:</strong> Too many failed verification attempts have been detected.</p>
      </div>
      <p>For your security, we've temporarily locked your account. You can try again in 10 minutes.</p>
      <p>If you believe this is an error or need immediate assistance, please contact our support team.</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>© ${new Date().getFullYear()} Employee Portal. All rights reserved.</p>
    </div>
  </body>
</html>
`;

const passwordResetTemplate = (firstName, resetLink) => `
<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #3498db;
        color: white;
        padding: 20px;
        text-align: center;
        border-radius: 5px 5px 0 0;
      }
      .content {
        padding: 20px;
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 0 0 5px 5px;
      }
      .reset-button {
        display: inline-block;
        background-color: #3498db;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 4px;
        margin: 20px 0;
      }
      .warning {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
        padding: 10px;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        margin-top: 20px;
        color: #666;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Password Reset Request</h2>
    </div>
    <div class="content">
      <p>Hello ${firstName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="reset-button">Reset Password</a>
      </div>
      <div class="warning">
        <p><strong>Security Notice:</strong></p>
        <ul>
          <li>This link will expire in 1 hour</li>
          <li>If you didn't request this password reset, please ignore this email</li>
          <li>For security, this link can only be used once</li>
        </ul>
      </div>
      <p>If you're having trouble clicking the button, copy and paste this link into your browser:</p>
      <p style="word-break: break-all;">${resetLink}</p>
    </div>
    <div class="footer">
      <p>This is an automated message, please do not reply.</p>
      <p>© ${new Date().getFullYear()} Employee Portal. All rights reserved.</p>
    </div>
  </body>
</html>
`;

module.exports = {
  otpTemplate,
  otpExpiredTemplate,
  tooManyAttemptsTemplate,
  passwordResetTemplate
}; 