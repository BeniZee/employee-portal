const { pool } = require('../db');
const { execSync } = require('child_process');
const path = require('path');

describe('Database Migrations', () => {
  const expectedTables = [
    'employees',
    'time_entries',
    'remembered_devices',
    'password_resets'
  ];

  const expectedColumns = {
    employees: [
      'id',
      'first_name',
      'last_name',
      'employee_id',
      'email',
      'password_hash',
      'profile_photo',
      'role',
      'created_at',
      'updated_at'
    ],
    time_entries: [
      'id',
      'employee_id',
      'date',
      'clock_in',
      'clock_out',
      'break_start',
      'break_end',
      'notes',
      'created_at',
      'updated_at'
    ]
  };

  beforeAll(async () => {
    // Run migrations
    execSync('node scripts/init-db.js', { stdio: 'inherit' });
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Table Structure', () => {
    it('should create all required tables', async () => {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const tables = result.rows.map(row => row.table_name);
      expectedTables.forEach(table => {
        expect(tables).toContain(table);
      });
    });

    it('should have correct columns in employees table', async () => {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'employees'
      `);

      const columns = result.rows.map(row => row.column_name);
      expectedColumns.employees.forEach(column => {
        expect(columns).toContain(column);
      });
    });

    it('should have correct columns in time_entries table', async () => {
      const result = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'time_entries'
      `);

      const columns = result.rows.map(row => row.column_name);
      expectedColumns.time_entries.forEach(column => {
        expect(columns).toContain(column);
      });
    });
  });

  describe('Migration Idempotency', () => {
    it('should handle multiple migrations without errors', async () => {
      // Run migrations again
      execSync('node scripts/init-db.js', { stdio: 'inherit' });

      // Verify tables still exist
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);

      const tables = result.rows.map(row => row.table_name);
      expectedTables.forEach(table => {
        expect(tables).toContain(table);
      });
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have correct foreign key relationships', async () => {
      const result = await pool.query(`
        SELECT
          tc.table_name, 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      `);

      const foreignKeys = result.rows;
      
      // Check time_entries -> employees relationship
      expect(foreignKeys).toContainEqual(
        expect.objectContaining({
          table_name: 'time_entries',
          column_name: 'employee_id',
          foreign_table_name: 'employees',
          foreign_column_name: 'id'
        })
      );

      // Check remembered_devices -> employees relationship
      expect(foreignKeys).toContainEqual(
        expect.objectContaining({
          table_name: 'remembered_devices',
          column_name: 'employee_id',
          foreign_table_name: 'employees',
          foreign_column_name: 'id'
        })
      );

      // Check password_resets -> employees relationship
      expect(foreignKeys).toContainEqual(
        expect.objectContaining({
          table_name: 'password_resets',
          column_name: 'employee_id',
          foreign_table_name: 'employees',
          foreign_column_name: 'id'
        })
      );
    });
  });
}); 