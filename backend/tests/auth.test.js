const request = require('supertest');
const app = require('../app');
const { pool } = require('../db');
const bcrypt = require('bcrypt');

// Sanity check
test('sanity check', () => {
  expect(1 + 1).toBe(2);
});

describe('Authentication Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['Test', 'User', 'TEST001', 'test@example.com', hashedPassword, 'employee']
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Clean up test user
    await pool.query('DELETE FROM employees WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/auth/login', () => {
    it('should return OTP required for valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'OTP sent to email');
      expect(res.body).toHaveProperty('tempToken');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/verify-otp', () => {
    let tempToken;

    beforeEach(async () => {
      // Get temp token
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });
      tempToken = loginRes.body.tempToken;
    });

    it('should verify OTP and return JWT', async () => {
      // Mock OTP verification (in real test, you'd need to get the actual OTP)
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          otp: '123456', // Mock OTP
          rememberDevice: true
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/verify-otp')
        .set('Authorization', `Bearer ${tempToken}`)
        .send({
          otp: '000000',
          rememberDevice: false
        });

      expect(res.status).toBe(401);
    });
  });

  describe('Remember Device Feature', () => {
    it('should skip OTP with valid remember token', async () => {
      // First login and verify OTP with remember device
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      const verifyRes = await request(app)
        .post('/api/auth/verify-otp')
        .set('Authorization', `Bearer ${loginRes.body.tempToken}`)
        .send({
          otp: '123456',
          rememberDevice: true
        });

      // Get remember token from cookies
      const rememberToken = verifyRes.headers['set-cookie']
        .find(cookie => cookie.startsWith('remember_token='))
        ?.split(';')[0]
        .split('=')[1];

      // Try login again with remember token
      const res = await request(app)
        .post('/api/auth/login')
        .set('Cookie', [`remember_token=${rememberToken}`])
        .send({
          email: 'test@example.com',
          password: 'test123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
    });
  });
}); 