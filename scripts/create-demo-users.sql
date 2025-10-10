-- Create demo users for testing the HR system
-- These users will be created in Supabase Auth and linked to employee records

-- First, we need to create the demo users in Supabase Auth
-- This should be done through the Supabase dashboard or using the service role key

-- Create employee records for demo users
INSERT INTO employees (
  id,
  employee_id,
  first_name,
  last_name,
  email,
  phone,
  department,
  position,
  hire_date,
  employment_status,
  salary,
  company_id,
  created_at,
  updated_at
) VALUES 
-- Admin user
(
  '00000000-0000-0000-0000-000000000001',
  'EMP001',
  'Admin',
  'User',
  'admin@akwaabahrpay.com',
  '+233123456789',
  'IT',
  'System Administrator',
  '2024-01-01',
  'active',
  8000.00,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
),
-- Employee user
(
  '00000000-0000-0000-0000-000000000002',
  'EMP002',
  'John',
  'Doe',
  'employee@akwaabahrpay.com',
  '+233987654321',
  'HR',
  'HR Officer',
  '2024-01-15',
  'active',
  5000.00,
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Create user profiles linking auth users to employees
INSERT INTO user_profiles (
  id,
  employee_id,
  role,
  permissions,
  created_at,
  updated_at
) VALUES 
-- Admin profile
(
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  '["all"]'::jsonb,
  NOW(),
  NOW()
),
-- Employee profile
(
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'employee',
  '["view_own_data", "request_leave", "view_payslips"]'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Create some sample leave balances for the demo users
INSERT INTO leave_balances (
  employee_id,
  leave_type,
  total_days,
  used_days,
  remaining_days,
  year,
  created_at,
  updated_at
) VALUES 
-- Admin leave balances
('00000000-0000-0000-0000-000000000001', 'annual', 21, 5, 16, 2025, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'sick', 10, 2, 8, 2025, NOW(), NOW()),
('00000000-0000-0000-0000-000000000001', 'personal', 5, 0, 5, 2025, NOW(), NOW()),
-- Employee leave balances
('00000000-0000-0000-0000-000000000002', 'annual', 21, 3, 18, 2025, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'sick', 10, 1, 9, 2025, NOW(), NOW()),
('00000000-0000-0000-0000-000000000002', 'personal', 5, 1, 4, 2025, NOW(), NOW())
ON CONFLICT (employee_id, leave_type, year) DO UPDATE SET
  total_days = EXCLUDED.total_days,
  used_days = EXCLUDED.used_days,
  remaining_days = EXCLUDED.remaining_days,
  updated_at = NOW();

-- Note: The actual Supabase Auth users need to be created separately
-- You can create them using the Supabase dashboard or by running this in the SQL editor:
/*
-- Create admin user (run this in Supabase SQL editor with service role)
SELECT auth.create_user(
  'admin@akwaabahrpay.com',
  'demo123',
  '{"id": "00000000-0000-0000-0000-000000000001"}'::jsonb
);

-- Create employee user
SELECT auth.create_user(
  'employee@akwaabahrpay.com', 
  'demo123',
  '{"id": "00000000-0000-0000-0000-000000000002"}'::jsonb
);
*/
