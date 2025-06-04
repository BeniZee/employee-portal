const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const bcrypt = require('bcrypt');
const { sendOTPEmail } = require('../services/emailService');
const { isAdmin } = require('../middleware/auth');

// Only allow in development
const setupDevRoutes = () => {
  if (process.env.NODE_ENV === 'production') {
    return router;
  }

  // Middleware to check if user is admin
  router.use(isAdmin);

  // Get system status
  router.get('/status', async (req, res) => {
    try {
      const dbStatus = await pool.query('SELECT NOW()');
      res.json({
        environment: process.env.NODE_ENV,
        database: {
          connected: true,
          timestamp: dbStatus.rows[0].now
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Reset database (development only)
  router.post('/reset-db', async (req, res) => {
    try {
      await pool.query(`
        TRUNCATE TABLE 
        time_entries, 
        remembered_devices, 
        password_resets, 
        employees 
        CASCADE
      `);
      res.json({ message: 'Database reset complete' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // Wipe database
  router.post('/wipe-db', async (req, res) => {
    try {
      await pool.query(`
        TRUNCATE TABLE time_entries, remembered_devices, password_resets, employees CASCADE;
      `);
      res.json({ message: 'Database wiped successfully' });
    } catch (error) {
      console.error('Error wiping database:', error);
      res.status(500).json({ message: 'Failed to wipe database' });
    }
  });

  // Reset test data
  router.post('/reset-test-data', async (req, res) => {
    try {
      // Wipe existing data
      await pool.query(`
        TRUNCATE TABLE time_entries, remembered_devices, password_resets, employees CASCADE;
      `);

      // Run initialization script
      require('../scripts/init-db');
      res.json({ message: 'Test data reset successfully' });
    } catch (error) {
      console.error('Error resetting test data:', error);
      res.status(500).json({ message: 'Failed to reset test data' });
    }
  });

  // Reset test passwords
  router.post('/reset-passwords', async (req, res) => {
    try {
      const hashedPassword = await bcrypt.hash('test123', 10);
      await pool.query(`
        UPDATE employees 
        SET password_hash = $1 
        WHERE email IN ('admin@evangadi.com', 'john@example.com', 'jane@example.com')
      `, [hashedPassword]);
      res.json({ message: 'Test passwords reset successfully' });
    } catch (error) {
      console.error('Error resetting passwords:', error);
      res.status(500).json({ message: 'Failed to reset passwords' });
    }
  });

  // Clear remembered devices
  router.post('/clear-remembered-devices', async (req, res) => {
    try {
      await pool.query('TRUNCATE TABLE remembered_devices');
      res.json({ message: 'Remembered devices cleared successfully' });
    } catch (error) {
      console.error('Error clearing remembered devices:', error);
      res.status(500).json({ message: 'Failed to clear remembered devices' });
    }
  });

  // Send test email
  router.post('/test-email', async (req, res) => {
    try {
      const { email, type } = req.body;
      
      if (type === 'otp') {
        await sendOTPEmail(email, 'Test User', '123456');
        res.json({ message: 'Test OTP email sent successfully' });
      } else {
        res.status(400).json({ message: 'Invalid email type' });
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      res.status(500).json({ message: 'Failed to send test email' });
    }
  });

  return router;
};

module.exports = setupDevRoutes(); 