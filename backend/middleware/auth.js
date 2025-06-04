const { pool } = require('../db');

const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM employees WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  isAdmin
}; 