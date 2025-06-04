const express = require('express');
const router = express.Router();
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

// Get all timesheet entries for the authenticated user
router.get('/timesheets', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM time_entries WHERE employee_id = $1 ORDER BY date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching timesheet entries:', error);
    res.status(500).json({ message: 'Error fetching timesheet entries' });
  }
});

// Create a new timesheet entry
router.post('/timesheets', authMiddleware, async (req, res) => {
  const { date, hours, description } = req.body;
  
  try {
    const result = await pool.query(
      'INSERT INTO time_entries (employee_id, date, hours, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, date, hours, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating timesheet entry:', error);
    res.status(500).json({ message: 'Error creating timesheet entry' });
  }
});

module.exports = router; 