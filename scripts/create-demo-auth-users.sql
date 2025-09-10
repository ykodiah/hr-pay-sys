-- Create demo authentication users in Supabase
-- This script creates both auth users and corresponding employee records

-- First, create the employee records in the employees table
INSERT INTO public.employees (
  id,
  employee_id,
  first_name,
  last_name,
  full_name,
  display_name,
  corporate_email,
  personal_email,
  position,
  department,
  division,
  location,
  status,
  date_of_joining,
  contract_type,
  company_id
) VALUES 
-- Admin Demo User
(
  gen_random_uuid(),
  'EMP001',
  'Admin',
  'User',
  'Admin User',
  'Admin User',
  'admin@akwaabahrpay.com',
  'admin@akwaabahrpay.com',
  'System Administrator',
  'IT',
  'Technology',
  'Head Office',
  'active',
  '2024-01-01',
  'permanent',
  (SELECT id FROM companies LIMIT 1)
),
-- Employee Demo User
(
  gen_random_uuid(),
  'EMP002',
  'John',
  'Doe',
  'John Doe',
  'John Doe',
  'employee@akwaabahrpay.com',
  'employee@akwaabahrpay.com',
  'HR Officer',
  'Human Resources',
  'Operations',
  'Head Office',
  'active',
  '2024-01-15',
  'permanent',
  (SELECT id FROM companies LIMIT 1)
);

-- Create financial records for demo users
INSERT INTO public.employee_financial (
  id,
  employee_id,
  monthly_salary,
  bank_name,
  bank_account_number,
  ssnit_number
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com'),
  8000.00,
  'GCB Bank',
  '1234567890',
  'C123456789'
),
(
  gen_random_uuid(),
  (SELECT id FROM employees WHERE corporate_email = 'employee@akwaabahrpay.com'),
  3500.00,
  'Ecobank Ghana',
  '0987654321',
  'C987654321'
);

-- Create roles for demo users
INSERT INTO public.roles (
  id,
  name,
  code,
  description,
  level,
  is_system_role,
  is_active,
  company_id,
  created_by
) VALUES 
(
  gen_random_uuid(),
  'System Administrator',
  'ADMIN',
  'Full system access and administration privileges',
  1,
  true,
  true,
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com')
),
(
  gen_random_uuid(),
  'HR Officer',
  'HR_OFFICER',
  'Human resources management and employee operations',
  3,
  true,
  true,
  (SELECT id FROM companies LIMIT 1),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com')
);

-- Assign roles to demo users
INSERT INTO public.user_roles (
  id,
  employee_id,
  role_id,
  assigned_by,
  assigned_at,
  is_active
) VALUES 
(
  gen_random_uuid(),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com'),
  (SELECT id FROM roles WHERE code = 'ADMIN'),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com'),
  now(),
  true
),
(
  gen_random_uuid(),
  (SELECT id FROM employees WHERE corporate_email = 'employee@akwaabahrpay.com'),
  (SELECT id FROM roles WHERE code = 'HR_OFFICER'),
  (SELECT id FROM employees WHERE corporate_email = 'admin@akwaabahrpay.com'),
  now(),
  true
);

-- Note: The actual Supabase Auth users need to be created through the Supabase dashboard or API
-- You can create them manually in the Supabase dashboard with these credentials:
-- 
-- Admin User:
-- Email: admin@akwaabahrpay.com
-- Password: demo123
-- 
-- Employee User:
-- Email: employee@akwaabahrpay.com  
-- Password: demo123
--
-- Alternatively, you can use the Supabase Admin API to create users programmatically
