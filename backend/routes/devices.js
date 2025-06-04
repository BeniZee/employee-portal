const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get remembered devices
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM remembered_devices WHERE employee_id = $1',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove remembered device
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM remembered_devices WHERE id = $1 AND employee_id = $2',
      [req.params.id, req.user.userId]
    );
    res.json({ message: 'Device removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router; 