const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    // Read and execute init-db.sql
    const initSql = await fs.readFile(
      path.join(__dirname, 'init-db.sql'),
      'utf8'
    );
    await client.query(initSql);
    console.log('Database schema initialized successfully');

    // Read and execute seed-dev-data.sql if in development
    if (process.env.NODE_ENV === 'development') {
      const seedSql = await fs.readFile(
        path.join(__dirname, 'seed-dev-data.sql'),
        'utf8'
      );
      await client.query(seedSql);
      console.log('Test data seeded successfully');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase; 