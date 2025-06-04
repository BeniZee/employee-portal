const { pool } = require('../db');

const generateOTP = () => {
  if (process.env.NODE_ENV === 'development') {
    return '123456';
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = async (userId, otp) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // OTP expires in 5 minutes

  await pool.query(
    'INSERT INTO password_resets (employee_id, reset_token, expires_at) VALUES ($1, $2, $3)',
    [userId, otp, expiresAt]
  );
};

const verifyOTP = async (userId, otp) => {
  const result = await pool.query(
    'SELECT * FROM password_resets WHERE employee_id = $1 AND reset_token = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [userId, otp]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Delete used OTP
  await pool.query(
    'DELETE FROM password_resets WHERE employee_id = $1',
    [userId]
  );

  return true;
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
}; 