// Load environment variables
require('dotenv').config();

// Set test environment variables if not set
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/employee_portal_test';
process.env.PORT = process.env.PORT || 5001;

// Increase timeout for tests
jest.setTimeout(30000);

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  console.log('Setting up test environment...');
  try {
    // Add any global setup here
    const { pool } = require('../db');
    await pool.query('SELECT NOW()');
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
});

afterAll(async () => {
  console.log('Cleaning up test environment...');
  try {
    const { pool } = require('../db');
    await pool.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
}); 