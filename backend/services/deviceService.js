const { pool } = require('../db');
const UAParser = require('ua-parser-js');

const storeDevice = async (userId, userAgent) => {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  const os = parser.getOS();
  const device = parser.getDevice();

  const result = await pool.query(
    'INSERT INTO remembered_devices (employee_id, device_info, browser, os, last_used) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
    [userId, JSON.stringify(device), browser.name, os.name]
  );

  return result.rows[0];
};

const getDevices = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM remembered_devices WHERE employee_id = $1 ORDER BY last_used DESC',
    [userId]
  );
  return result.rows;
};

const removeDevice = async (deviceId, userId) => {
  const result = await pool.query(
    'DELETE FROM remembered_devices WHERE id = $1 AND employee_id = $2 RETURNING *',
    [deviceId, userId]
  );
  return result.rows.length > 0;
};

const removeAllDevices = async (userId) => {
  await pool.query(
    'DELETE FROM remembered_devices WHERE employee_id = $1',
    [userId]
  );
};

module.exports = {
  storeDevice,
  getDevices,
  removeDevice,
  removeAllDevices
}; 