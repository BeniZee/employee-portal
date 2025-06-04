const db = require('../db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('./emailService');

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const createPasswordReset = async (employeeId) => {
  const token = generateResetToken();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now

  await db.query(
    `INSERT INTO password_resets (employee_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [employeeId, token, expiresAt]
  );

  return token;
};

const getPasswordReset = async (token) => {
  const result = await db.query(
    `SELECT pr.*, e.email, e.first_name
     FROM password_resets pr
     JOIN employees e ON pr.employee_id = e.id
     WHERE pr.token = $1 AND pr.expires_at > CURRENT_TIMESTAMP AND pr.used_at IS NULL`,
    [token]
  );

  return result.rows[0] || null;
};

const markResetAsUsed = async (token) => {
  await db.query(
    'UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE token = $1',
    [token]
  );
};

const invalidateAllResets = async (employeeId) => {
  await db.query(
    'UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE employee_id = $1 AND used_at IS NULL',
    [employeeId]
  );
};

const initiatePasswordReset = async (email) => {
  // Get employee by email
  const result = await db.query(
    'SELECT id, first_name FROM employees WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return false;
  }

  const employee = result.rows[0];

  // Invalidate any existing reset tokens
  await invalidateAllResets(employee.id);

  // Create new reset token
  const token = await createPasswordReset(employee.id);

  // Generate reset link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  // Send email
  const emailSent = await sendPasswordResetEmail(email, employee.first_name, resetLink);

  return emailSent;
};

const resetPassword = async (token, newPassword) => {
  const reset = await getPasswordReset(token);
  if (!reset) {
    return { success: false, message: 'Invalid or expired reset token' };
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password and mark reset as used
  await Promise.all([
    db.query(
      'UPDATE employees SET password_hash = $1 WHERE id = $2',
      [hashedPassword, reset.employee_id]
    ),
    markResetAsUsed(token)
  ]);

  return { success: true };
};

module.exports = {
  initiatePasswordReset,
  resetPassword
}; 