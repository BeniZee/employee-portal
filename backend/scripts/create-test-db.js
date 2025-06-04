const { Client } = require('pg');
require('dotenv').config();

async function createTestDatabase() {
  // Connect to default postgres database
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.DB_PASSWORD // You'll need to set this in your environment
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'employee_portal_test'"
    );

    if (result.rows.length === 0) {
      // Create database if it doesn't exist
      await client.query('CREATE DATABASE employee_portal_test');
      console.log('Created test database: employee_portal_test');
    } else {
      console.log('Test database already exists');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestDatabase(); 