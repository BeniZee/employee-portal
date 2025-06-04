-- Add role column to employees table
ALTER TABLE employees ADD COLUMN role VARCHAR(20) DEFAULT 'employee';

-- Create an admin user (password: admin123)
INSERT INTO employees (
  first_name,
  last_name,
  employee_id,
  email,
  password_hash,
  role
) VALUES (
  'Admin',
  'User',
  'ADMIN001',
  'admin@evangadi.com',
  '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5YxX',
  'admin'
); 