CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(token)
);

CREATE INDEX idx_password_resets_employee_id ON password_resets(employee_id);
CREATE INDEX idx_password_resets_token ON password_resets(token); 