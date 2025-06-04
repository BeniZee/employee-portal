-- Insert test employees with various roles
INSERT INTO employees (first_name, last_name, employee_id, email, password_hash, role)
VALUES 
  ('Admin', 'User', 'ADM001', 'admin@evangadi.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'admin'),
  ('John', 'Doe', 'EMP001', 'john@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'employee'),
  ('Jane', 'Smith', 'EMP002', 'jane@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'employee'),
  ('Sarah', 'Johnson', 'HR001', 'sarah@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'hr'),
  ('Michael', 'Brown', 'MGR001', 'michael@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'manager'),
  ('Edge', 'Case', 'EDG001', 'edgecase1@example.com', '$2a$10$X7UrH5YxX5YxX5YxX5YxX.5YxX5YxX5YxX5YxX5YxX5YxX5YxX5Yx', 'employee')
ON CONFLICT (email) DO NOTHING;

-- Insert test time entries with various scenarios
INSERT INTO time_entries (employee_id, date, clock_in, clock_out, break_start, break_end, notes)
SELECT 
  e.id,
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '9 hours',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '17 hours',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '12 hours',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '13 hours',
  'Regular workday'
FROM employees e
WHERE e.email IN ('john@example.com', 'jane@example.com', 'sarah@example.com', 'michael@example.com')
ON CONFLICT DO NOTHING;

-- Insert edge case: Clock-in without clock-out
INSERT INTO time_entries (employee_id, date, clock_in, notes)
SELECT 
  e.id,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '9 hours',
  'Forgot to clock out'
FROM employees e
WHERE e.email = 'edgecase1@example.com'
ON CONFLICT DO NOTHING;

-- Insert edge case: Timesheet across date boundary
INSERT INTO time_entries (employee_id, date, clock_in, clock_out, notes)
SELECT 
  e.id,
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE - INTERVAL '1 day' + INTERVAL '22 hours',
  CURRENT_DATE + INTERVAL '6 hours',
  'Overnight shift'
FROM employees e
WHERE e.email = 'john@example.com'
ON CONFLICT DO NOTHING;

-- Insert test remembered devices
INSERT INTO remembered_devices (employee_id, device_token, device_name, expires_at)
SELECT 
  e.id,
  'test-device-token-' || e.id,
  'Test Device',
  CURRENT_TIMESTAMP + INTERVAL '30 days'
FROM employees e
WHERE e.email IN ('admin@evangadi.com', 'john@example.com')
ON CONFLICT (device_token) DO NOTHING;

-- Insert test password resets
INSERT INTO password_resets (employee_id, token, expires_at)
SELECT 
  e.id,
  'test-reset-token-' || e.id,
  CURRENT_TIMESTAMP + INTERVAL '1 hour'
FROM employees e
WHERE e.email = 'edgecase1@example.com'
ON CONFLICT (token) DO NOTHING; 