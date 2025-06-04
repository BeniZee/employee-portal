const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Clock in route
router.post('/timesheet/clock-in', authMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const currentDate = new Date().toISOString().split('T')[0];

    // Check if there's already a clock-in entry for today
    const existingEntry = await pool.query(
      'SELECT * FROM time_entries WHERE employee_id = $1 AND date = $2',
      [employee_id, currentDate]
    );

    if (existingEntry.rows.length > 0) {
      return res.status(400).json({ message: 'Already clocked in for today' });
    }

    // Create new clock-in entry
    const result = await pool.query(
      'INSERT INTO time_entries (employee_id, clock_in, date) VALUES ($1, CURRENT_TIMESTAMP, $2) RETURNING *',
      [employee_id, currentDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clock out route
router.post('/timesheet/clock-out', authMiddleware, async (req, res) => {
  try {
    const { employee_id } = req.user;
    const currentDate = new Date().toISOString().split('T')[0];

    // Check if there's a clock-in entry for today
    const existingEntry = await pool.query(
      'SELECT * FROM time_entries WHERE employee_id = $1 AND date = $2',
      [employee_id, currentDate]
    );

    if (existingEntry.rows.length === 0) {
      return res.status(400).json({ message: 'No clock-in entry found for today' });
    }

    if (existingEntry.rows[0].clock_out) {
      return res.status(400).json({ message: 'Already clocked out for today' });
    }

    // Update clock-out time
    const result = await pool.query(
      'UPDATE time_entries SET clock_out = CURRENT_TIMESTAMP WHERE employee_id = $1 AND date = $2 RETURNING *',
      [employee_id, currentDate]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get timesheet entries
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM time_entries WHERE employee_id = $1 ORDER BY date DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create timesheet entry
router.post('/', async (req, res) => {
  try {
    const { date, clockIn, clockOut, breakStart, breakEnd, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO time_entries 
      (employee_id, date, clock_in, clock_out, break_start, break_end, notes) 
      VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING *`,
      [req.user.userId, date, clockIn, clockOut, breakStart, breakEnd, notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get work summary
router.get('/work-summary', authMiddleware, async (req, res) => {
  try {
    const { period } = req.query;
    const { employee_id } = req.user;

    let query;
    if (period === 'week') {
      query = `
        WITH weekly_hours AS (
          SELECT 
            date_trunc('week', date) as week_start,
            SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600) as total_hours,
            COUNT(DISTINCT date) as days_worked
          FROM time_entries
          WHERE employee_id = $1
            AND clock_out IS NOT NULL
          GROUP BY date_trunc('week', date)
          ORDER BY week_start DESC
          LIMIT 12
        )
        SELECT 
          week_start as period,
          total_hours,
          total_hours / NULLIF(days_worked, 0) as average_hours_per_day
        FROM weekly_hours
      `;
    } else {
      query = `
        WITH monthly_hours AS (
          SELECT 
            date_trunc('month', date) as month_start,
            SUM(EXTRACT(EPOCH FROM (clock_out - clock_in))/3600) as total_hours,
            COUNT(DISTINCT date) as days_worked
          FROM time_entries
          WHERE employee_id = $1
            AND clock_out IS NOT NULL
          GROUP BY date_trunc('month', date)
          ORDER BY month_start DESC
          LIMIT 12
        )
        SELECT 
          month_start as period,
          total_hours,
          total_hours / NULLIF(days_worked, 0) as average_hours_per_day
        FROM monthly_hours
      `;
    }

    const result = await pool.query(query, [employee_id]);

    res.json({
      [period]: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 