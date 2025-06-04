const nodemailer = require('nodemailer');
const { otpTemplate, otpExpiredTemplate, tooManyAttemptsTemplate, passwordResetTemplate } = require('./emailTemplates');

// Create a mock transporter for development
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (email, name, otp) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return true;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your OTP Code',
    html: `
      <h1>Hello ${name},</h1>
      <p>Your OTP code is: <strong>${otp}</strong></p>
      <p>This code will expire in 5 minutes.</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPExpiredEmail = async (email, firstName) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'OTP Expired',
      html: otpExpiredTemplate(firstName)
    });
    return true;
  } catch (error) {
    console.error('Failed to send OTP expired email:', error);
    return false;
  }
};

const sendTooManyAttemptsEmail = async (email, firstName) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Security Alert: Too Many Attempts',
      html: tooManyAttemptsTemplate(firstName)
    });
    return true;
  } catch (error) {
    console.error('Failed to send too many attempts email:', error);
    return false;
  }
};

const sendPasswordResetEmail = async (email, firstName, resetLink) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset Request',
      html: passwordResetTemplate(firstName, resetLink)
    });
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
};

module.exports = {
  sendOTPEmail,
  sendOTPExpiredEmail,
  sendTooManyAttemptsEmail,
  sendPasswordResetEmail
}; 