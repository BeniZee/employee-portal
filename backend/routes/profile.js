const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get profile
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, email, role, profile_photo FROM employees WHERE id = $1',
      [req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update profile
router.put('/', async (req, res) => {
  try {
    const { first_name, last_name, email } = req.body;
    const result = await pool.query(
      `UPDATE employees 
      SET first_name = $1, last_name = $2, email = $3 
      WHERE id = $4 
      RETURNING id, first_name, last_name, email, role, profile_photo`,
      [first_name, last_name, email, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 