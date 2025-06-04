const request = require('supertest');
const app = require('../app');
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

describe('Timesheet Endpoints', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('test123', 10);
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      ['Test', 'User', 'TEST001', 'test@example.com', hashedPassword, 'employee']
    );
    testUser = result.rows[0];

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email, role: testUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await pool.query('DELETE FROM time_entries WHERE employee_id = $1', [testUser.id]);
    await pool.query('DELETE FROM employees WHERE email = $1', ['test@example.com']);
    await pool.end();
  });

  describe('POST /api/timesheet/clock-in', () => {
    it('should create a new time entry', async () => {
      const res = await request(app)
        .post('/api/timesheet/clock-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test clock in'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.clock_out).toBeNull();
    });

    it('should prevent multiple active entries', async () => {
      const res = await request(app)
        .post('/api/timesheet/clock-in')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Second clock in attempt'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/timesheet/clock-out', () => {
    it('should update the active time entry', async () => {
      const res = await request(app)
        .post('/api/timesheet/clock-out')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'Test clock out'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clock_out');
    });

    it('should reject clock out without active entry', async () => {
      const res = await request(app)
        .post('/api/timesheet/clock-out')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          notes: 'No active entry'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/timesheet/entries', () => {
    it('should return time entries for the user', async () => {
      const res = await request(app)
        .get('/api/timesheet/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should handle date range queries', async () => {
      const res = await request(app)
        .get('/api/timesheet/entries')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          start_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Admin Timesheet Endpoints', () => {
    let adminToken;

    beforeAll(async () => {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const result = await pool.query(
        'INSERT INTO employees (first_name, last_name, employee_id, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        ['Admin', 'User', 'ADM001', 'admin@example.com', hashedPassword, 'admin']
      );

      // Generate admin token
      adminToken = jwt.sign(
        { id: result.rows[0].id, email: result.rows[0].email, role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterAll(async () => {
      await pool.query('DELETE FROM employees WHERE email = $1', ['admin@example.com']);
    });

    it('should allow admin to view all timesheets', async () => {
      const res = await request(app)
        .get('/api/admin/timesheets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 10,
          sort_by: 'date',
          sort_order: 'desc'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('timesheets');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.timesheets)).toBe(true);
    });

    it('should allow admin to filter timesheets', async () => {
      const res = await request(app)
        .get('/api/admin/timesheets')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          employee_id: testUser.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0]
        });

      expect(res.status).toBe(200);
      expect(res.body.timesheets.every(entry => entry.employee_id === testUser.id)).toBe(true);
    });
  });
}); 