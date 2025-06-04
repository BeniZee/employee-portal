CREATE TABLE remembered_devices (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  device_token VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  UNIQUE(employee_id, device_token)
);

CREATE INDEX idx_remembered_devices_employee_id ON remembered_devices(employee_id);
CREATE INDEX idx_remembered_devices_token ON remembered_devices(device_token); 