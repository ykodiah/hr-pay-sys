-- Setup demo authentication users in Supabase
-- Note: This script should be run in Supabase SQL Editor with service role permissions

-- Insert demo users into auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@akwaabahrpay.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'employee@akwaabahrpay.com',
    crypt('demo123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );

-- Insert corresponding identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users u 
WHERE u.email IN ('admin@akwaabahrpay.com', 'employee@akwaabahrpay.com');

-- Create corresponding employee records
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
  company_id
) VALUES 
  (
    gen_random_uuid(),
    'EMP001',
    'Admin',
    'User',
    'admin@akwaabahrpay.com',
    '+233123456789',
    'Administration',
    'System Administrator',
    '2024-01-01',
    'active',
    8000.00,
    '00000000-0000-0000-0000-000000000001'
  ),
  (
    gen_random_uuid(),
    'EMP002',
    'Demo',
    'Employee',
    'employee@akwaabahrpay.com',
    '+233987654321',
    'Human Resources',
    'HR Assistant',
    '2024-01-15',
    'active',
    3500.00,
    '00000000-0000-0000-0000-000000000001'
  );
