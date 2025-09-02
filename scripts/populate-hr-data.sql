-- Populate Leave Types with comprehensive data
INSERT INTO leave_types (
  id, company_id, name, code, description, annual_entitlement, max_consecutive_days,
  pay_percentage, min_notice_days, requires_approval, requires_medical_certificate,
  allow_carry_over, is_active, accrual_method, accrual_rate, min_service_months,
  max_per_year, max_carry_over_days, carry_over_expiry_months, medical_cert_after_days,
  is_paid, is_system_default, created_by, created_at, updated_at
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Annual Leave', 'AL', 'Annual vacation leave for all employees', 21, 14, 100, 7, true, false, true, true, 'monthly', 1.75, 3, 21, 5, 12, 0, true, true, '00000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Sick Leave', 'SL', 'Medical leave for illness or injury', 10, 7, 100, 0, false, true, false, true, 'monthly', 0.83, 1, 10, 0, 0, 3, true, true, '00000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Maternity Leave', 'ML', 'Maternity leave for female employees', 84, 84, 100, 30, true, true, false, true, 'none', 0, 6, 84, 0, 0, 0, true, true, '00000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Paternity Leave', 'PL', 'Paternity leave for male employees', 7, 7, 100, 14, true, false, false, true, 'none', 0, 6, 7, 0, 0, 0, true, true, '00000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Compassionate Leave', 'CL', 'Leave for family emergencies or bereavement', 5, 5, 100, 1, true, false, false, true, 'none', 0, 1, 5, 0, 0, 0, true, true, '00000000-0000-0000-0000-000000000001', now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Study Leave', 'STL', 'Educational leave for professional development', 10, 10, 50, 30, true, false, false, true, 'none', 0, 12, 10, 0, 0, 0, true, false, '00000000-0000-0000-0000-000000000001', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Populate Leave Policies
INSERT INTO leave_policies (
  id, company_id, policy_name, policy_type, description, max_days, accrual_rate,
  carry_over_days, requires_approval, notice_period_days, medical_certificate_required,
  medical_certificate_after_days, max_consecutive_days, paid_percentage, is_active,
  created_at, updated_at
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Standard Annual Leave Policy', 'annual', 'Standard policy for annual leave entitlements', 21, 1.75, 5, true, 7, false, 0, 14, 100, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Medical Leave Policy', 'medical', 'Policy governing sick and medical leave', 10, 0.83, 0, false, 0, true, 3, 7, 100, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Maternity & Paternity Policy', 'parental', 'Policy for maternity and paternity leave', 84, 0, 0, true, 30, true, 0, 84, 100, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Emergency Leave Policy', 'emergency', 'Policy for compassionate and emergency leave', 5, 0, 0, true, 1, false, 0, 5, 100, true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Populate Leave Type Approvers (Line Manager -> Head of Department -> HR)
WITH leave_type_ids AS (
  SELECT id, name FROM leave_types WHERE company_id = '00000000-0000-0000-0000-000000000001'
)
INSERT INTO leave_type_approvers (
  id, leave_type_id, approver_role, approval_level, is_required, created_at
)
SELECT 
  gen_random_uuid(),
  lt.id,
  'Line Manager',
  1,
  true,
  now()
FROM leave_type_ids lt
UNION ALL
SELECT 
  gen_random_uuid(),
  lt.id,
  'Head of Department',
  2,
  true,
  now()
FROM leave_type_ids lt
UNION ALL
SELECT 
  gen_random_uuid(),
  lt.id,
  'HR Manager',
  3,
  true,
  now()
FROM leave_type_ids lt
ON CONFLICT (id) DO NOTHING;

-- Populate Leave Type Eligibility Rules
WITH leave_type_ids AS (
  SELECT id, name FROM leave_types WHERE company_id = '00000000-0000-0000-0000-000000000001'
)
INSERT INTO leave_type_eligibility (
  id, leave_type_id, employee_type, gender, min_age, max_age, created_at
)
SELECT 
  gen_random_uuid(),
  lt.id,
  CASE 
    WHEN lt.name = 'Maternity Leave' THEN 'permanent'
    WHEN lt.name = 'Paternity Leave' THEN 'permanent'
    ELSE 'all'
  END,
  CASE 
    WHEN lt.name = 'Maternity Leave' THEN 'female'
    WHEN lt.name = 'Paternity Leave' THEN 'male'
    ELSE 'all'
  END,
  CASE 
    WHEN lt.name IN ('Maternity Leave', 'Paternity Leave') THEN 18
    ELSE 16
  END,
  CASE 
    WHEN lt.name IN ('Maternity Leave', 'Paternity Leave') THEN 50
    ELSE 65
  END,
  now()
FROM leave_type_ids lt
ON CONFLICT (id) DO NOTHING;

-- Populate Salary Grades with Ghana Cedis amounts
INSERT INTO salary_grades (
  id, company_id, grade_name, grade_level, step_1, step_2, step_3, step_4, step_5,
  is_active, created_at, updated_at
) VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 1', 1, 1800, 1950, 2100, 2250, 2400, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 2', 2, 2200, 2380, 2560, 2740, 2920, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 3', 3, 2600, 2810, 3020, 3230, 3440, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 4', 4, 3000, 3240, 3480, 3720, 3960, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 5', 5, 3400, 3670, 3940, 4210, 4480, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 6', 6, 3800, 4100, 4400, 4700, 5000, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 7', 7, 4200, 4530, 4860, 5190, 5520, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 8', 8, 4600, 4960, 5320, 5680, 6040, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 9', 9, 5000, 5390, 5780, 6170, 6560, true, now(), now()),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Grade 10', 10, 5400, 5820, 6240, 6660, 7080, true, now(), now())
ON CONFLICT (id) DO NOTHING;
