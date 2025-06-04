const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const { generateOTP, storeOTP, verifyOTP, resendOTP, getOTPExpiration } = require('../services/otpService');
const { sendOTPEmail } = require('../services/emailService');
const { otpLimiter } = require('../middleware/rateLimiter');
const { storeDevice, verifyDevice, getDevices, removeDevice, removeAllDevices } = require('../services/deviceService');
const UAParser = require('ua-parser-js');
const { initiatePasswordReset, resetPassword } = require('../services/passwordResetService');

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM employees WHERE id = $1',
      [req.user.id]
    );

    if (result.rows[0]?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Register route
router.post('/register', upload.single('profilePhoto'), async (req, res) => {
  try {
    const { firstName, lastName, employeeId, email, password } = req.body;
    const profilePhoto = req.file ? req.file.path : null;

    // Check if employee already exists
    const existingEmployee = await pool.query(
      'SELECT * FROM employees WHERE email = $1 OR employee_id = $2',
      [email, employeeId]
    );

    if (existingEmployee.rows.length > 0) {
      return res.status(400).json({ message: 'Employee already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new employee
    const result = await pool.query(
      'INSERT INTO employees (first_name, last_name, employee_id, email, password_hash, profile_photo, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, role',
      [firstName, lastName, employeeId, email, hashedPassword, profilePhoto, 'employee']
    );

    // Generate JWT
    const token = jwt.sign(
      { id: result.rows[0].id, email, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, role: result.rows[0].role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate temporary token for OTP verification
    const tempToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    res.json({ tempToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// OTP verification route
router.post('/verify-otp', async (req, res) => {
  try {
    const { otp, rememberDevice } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // In development, accept any OTP
    if (process.env.NODE_ENV === 'development' && otp === '123456') {
      const finalToken = jwt.sign(
        { userId: decoded.userId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      if (rememberDevice) {
        const rememberToken = jwt.sign(
          { userId: decoded.userId },
          process.env.JWT_REMEMBER_SECRET,
          { expiresIn: '30d' }
        );

        res.cookie('remember_token', rememberToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      res.json({ token: finalToken });
    } else {
      res.status(401).json({ error: 'Invalid OTP' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get profile route
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, employee_id, email, profile_photo FROM employees WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile route
router.put('/profile', authMiddleware, upload.single('profilePhoto'), async (req, res) => {
  try {
    const { firstName, lastName, email } = req.body;
    const profilePhoto = req.file ? req.file.path : null;

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await pool.query(
        'SELECT * FROM employees WHERE email = $1 AND id != $2',
        [email, req.user.id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Build update query based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramCount = 1;

    if (firstName) {
      updateFields.push(`first_name = $${paramCount}`);
      queryParams.push(firstName);
      paramCount++;
    }

    if (lastName) {
      updateFields.push(`last_name = $${paramCount}`);
      queryParams.push(lastName);
      paramCount++;
    }

    if (email) {
      updateFields.push(`email = $${paramCount}`);
      queryParams.push(email);
      paramCount++;
    }

    if (profilePhoto) {
      updateFields.push(`profile_photo = $${paramCount}`);
      queryParams.push(profilePhoto);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // Add user ID to query params
    queryParams.push(req.user.id);

    // Update employee profile
    const result = await pool.query(
      `UPDATE employees 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, first_name, last_name, employee_id, email, profile_photo`,
      queryParams
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes
router.get('/admin/employees', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, first_name, last_name, employee_id, email, profile_photo FROM employees'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/admin/timesheets', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { start_date, end_date, employee_id, page = 1, limit = 10, sort_by, sort_order } = req.query;
    
    // Calculate offset
    const offset = (page - 1) * limit;
    
    // Build base query for total count
    let countQuery = `
      SELECT COUNT(*)
      FROM time_entries t
      JOIN employees e ON t.employee_id = e.id
      WHERE 1=1
    `;
    
    // Build main query
    let query = `
      SELECT t.*, e.first_name, e.last_name, e.employee_id
      FROM time_entries t
      JOIN employees e ON t.employee_id = e.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND t.date >= $${paramCount}`;
      countQuery += ` AND t.date >= $${paramCount}`;
      queryParams.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND t.date <= $${paramCount}`;
      countQuery += ` AND t.date <= $${paramCount}`;
      queryParams.push(end_date);
      paramCount++;
    }

    if (employee_id) {
      query += ` AND t.employee_id = $${paramCount}`;
      countQuery += ` AND t.employee_id = $${paramCount}`;
      queryParams.push(employee_id);
      paramCount++;
    }

    // Add sorting
    if (sort_by) {
      const validSortColumns = {
        'employee_name': 'e.first_name',
        'clock_in': 't.clock_in',
        'clock_out': 't.clock_out',
        'date': 't.date',
        'total_hours': 'EXTRACT(EPOCH FROM (t.clock_out - t.clock_in))/3600'
      };
      
      const sortColumn = validSortColumns[sort_by] || 't.date';
      const order = sort_order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      
      query += ` ORDER BY ${sortColumn} ${order}`;
    } else {
      query += ' ORDER BY t.date DESC, t.clock_in DESC';
    }

    // Add pagination
    query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(limit, offset);

    // Execute queries
    const [result, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset params for count
    ]);

    res.json({
      timesheets: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get remembered devices
router.get('/devices', authMiddleware, async (req, res) => {
  try {
    const devices = await getDevices(req.user.id);
    res.json(devices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove a remembered device
router.delete('/devices/:deviceId', authMiddleware, async (req, res) => {
  try {
    const success = await removeDevice(req.params.deviceId, req.user.id);
    if (!success) {
      return res.status(404).json({ message: 'Device not found' });
    }
    res.json({ message: 'Device removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove all remembered devices
router.delete('/devices', authMiddleware, async (req, res) => {
  try {
    await removeAllDevices(req.user.id);
    res.clearCookie('remember_token');
    res.json({ message: 'All devices removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot password route
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const success = await initiatePasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists with this email, you will receive a password reset link' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset password route
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    const result = await resetPassword(token, newPassword);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 