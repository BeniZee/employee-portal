const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');

const createTestUser = async (role = 'employee') => {
  const hashedPassword = await bcrypt.hash('test123', 10);
  const result = await pool.query(
    `INSERT INTO employees 
    (first_name, last_name, employee_id, email, password_hash, role) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING *`,
    [
      'Test',
      'User',
      `TEST${Math.floor(Math.random() * 1000)}`,
      `test${Math.random()}@example.com`,
      hashedPassword,
      role
    ]
  );
  return result.rows[0];
};

const loginAndGetToken = async (email, password = 'test123') => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  if (response.status !== 200) {
    throw new Error('Login failed');
  }

  const { tempToken } = response.body;

  const verifyResponse = await request(app)
    .post('/api/auth/verify-otp')
    .set('Authorization', `Bearer ${tempToken}`)
    .send({
      otp: '123456', // Mock OTP
      rememberDevice: false
    });

  if (verifyResponse.status !== 200) {
    throw new Error('OTP verification failed');
  }

  return verifyResponse.body.token;
};

const clearTestDB = async () => {
  await pool.query(`
    TRUNCATE TABLE 
    time_entries, 
    remembered_devices, 
    password_resets, 
    employees 
    CASCADE
  `);
};

const createTimesheetEntry = async (userId, options = {}) => {
  const {
    date = new Date(),
    clockIn = new Date(date.getTime() + 9 * 60 * 60 * 1000), // 9 AM
    clockOut = new Date(date.getTime() + 17 * 60 * 60 * 1000), // 5 PM
    breakStart = new Date(date.getTime() + 12 * 60 * 60 * 1000), // 12 PM
    breakEnd = new Date(date.getTime() + 13 * 60 * 60 * 1000), // 1 PM
    notes = 'Test entry'
  } = options;

  const result = await pool.query(
    `INSERT INTO time_entries 
    (employee_id, date, clock_in, clock_out, break_start, break_end, notes) 
    VALUES ($1, $2, $3, $4, $5, $6, $7) 
    RETURNING *`,
    [userId, date, clockIn, clockOut, breakStart, breakEnd, notes]
  );

  return result.rows[0];
};

const createRememberedDevice = async (userId) => {
  const result = await pool.query(
    `INSERT INTO remembered_devices 
    (employee_id, device_token, device_name, expires_at) 
    VALUES ($1, $2, $3, $4) 
    RETURNING *`,
    [
      userId,
      `test-device-${Math.random()}`,
      'Test Device',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ]
  );
  return result.rows[0];
};

const createPasswordReset = async (userId) => {
  const result = await pool.query(
    `INSERT INTO password_resets 
    (employee_id, token, expires_at) 
    VALUES ($1, $2, $3) 
    RETURNING *`,
    [
      userId,
      `test-reset-${Math.random()}`,
      new Date(Date.now() + 1 * 60 * 60 * 1000)
    ]
  );
  return result.rows[0];
};

module.exports = {
  createTestUser,
  loginAndGetToken,
  clearTestDB,
  createTimesheetEntry,
  createRememberedDevice,
  createPasswordReset
}; 