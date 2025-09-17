-- Seed sample data for development and testing

-- Insert sample tenant
INSERT INTO "Tenant" (id, name, mode, currency, "createdAt", "updatedAt")
VALUES 
  ('tenant_sample_001', 'Akwaaba Tech Solutions', 'SINGLE', 'GHS', NOW(), NOW());

-- Insert sample company
INSERT INTO "Company" (id, "tenantId", name, country, currency, "createdAt", "updatedAt")
VALUES 
  ('company_sample_001', 'tenant_sample_001', 'Akwaaba Tech Solutions Ltd', 'Ghana', 'GHS', NOW(), NOW());

-- Insert sample locations
INSERT INTO "Location" (id, "companyId", name, address, timezone, "createdAt", "updatedAt")
VALUES 
  ('location_001', 'company_sample_001', 'Head Office', 'East Legon, Accra', 'Africa/Accra', NOW(), NOW()),
  ('location_002', 'company_sample_001', 'Kumasi Branch', 'Adum, Kumasi', 'Africa/Accra', NOW(), NOW());

-- Insert sample departments
INSERT INTO "Department" (id, "companyId", name, "createdAt", "updatedAt")
VALUES 
  ('dept_001', 'company_sample_001', 'Human Resources', NOW(), NOW()),
  ('dept_002', 'company_sample_001', 'Information Technology', NOW(), NOW()),
  ('dept_003', 'company_sample_001', 'Finance', NOW(), NOW()),
  ('dept_004', 'company_sample_001', 'Operations', NOW(), NOW());

-- Insert sample employees
INSERT INTO "Employee" (
  id, "tenantId", "companyId", "locationId", "departmentId", 
  "firstName", "lastName", email, phone, "hireDate", 
  status, position, "baseSalary", "paySchedule", "ssnitNumber", tin,
  "createdAt", "updatedAt"
)
VALUES 
  (
    'emp_001', 'tenant_sample_001', 'company_sample_001', 'location_001', 'dept_001',
    'Akosua', 'Mensah', 'akosua.mensah@akwaabatech.com', '+233244123456', '2023-01-15',
    'ACTIVE', 'HR Manager', 4500.00, 'MONTHLY', 'C123456789012', 'P0012345678',
    NOW(), NOW()
  ),
  (
    'emp_002', 'tenant_sample_001', 'company_sample_001', 'location_001', 'dept_002',
    'Kwame', 'Asante', 'kwame.asante@akwaabatech.com', '+233244234567', '2023-03-01',
    'ACTIVE', 'Software Developer', 3800.00, 'MONTHLY', 'C123456789013', 'P0012345679',
    NOW(), NOW()
  ),
  (
    'emp_003', 'tenant_sample_001', 'company_sample_001', 'location_002', 'dept_003',
    'Ama', 'Osei', 'ama.osei@akwaabatech.com', '+233244345678', '2023-02-10',
    'ACTIVE', 'Accountant', 3200.00, 'MONTHLY', 'C123456789014', 'P0012345680',
    NOW(), NOW()
  ),
  (
    'emp_004', 'tenant_sample_001', 'company_sample_001', 'location_001', 'dept_004',
    'Kofi', 'Boateng', 'kofi.boateng@akwaabatech.com', '+233244456789', '2023-04-20',
    'ACTIVE', 'Operations Coordinator', 2800.00, 'MONTHLY', 'C123456789015', 'P0012345681',
    NOW(), NOW()
  );

-- Insert sample bank accounts
INSERT INTO "BankAccount" (id, "employeeId", "bankName", "accountNo", "isPrimary", "createdAt", "updatedAt")
VALUES 
  ('bank_001', 'emp_001', 'GCB Bank', '1234567890123456', true, NOW(), NOW()),
  ('bank_002', 'emp_002', 'Ecobank Ghana', '2345678901234567', true, NOW(), NOW()),
  ('bank_003', 'emp_003', 'Standard Chartered', '3456789012345678', true, NOW(), NOW()),
  ('bank_004', 'emp_004', 'Absa Bank Ghana', '4567890123456789', true, NOW(), NOW());

-- Insert sample leave balances
INSERT INTO "LeaveBalance" (id, "employeeId", annual, sick, maternity, paternity, study, year, "createdAt", "updatedAt")
VALUES 
  ('leave_bal_001', 'emp_001', 21, 10, 84, 7, 5, 2025, NOW(), NOW()),
  ('leave_bal_002', 'emp_002', 21, 10, 0, 7, 5, 2025, NOW(), NOW()),
  ('leave_bal_003', 'emp_003', 21, 10, 84, 0, 5, 2025, NOW(), NOW()),
  ('leave_bal_004', 'emp_004', 21, 10, 0, 7, 5, 2025, NOW(), NOW());

-- Insert sample user tenant roles
INSERT INTO "UserTenantRole" (id, "userId", "tenantId", role, "createdAt", "updatedAt")
VALUES 
  ('role_001', 'user_admin_001', 'tenant_sample_001', 'ADMIN', NOW(), NOW()),
  ('role_002', 'user_hr_001', 'tenant_sample_001', 'HR', NOW(), NOW()),
  ('role_003', 'user_payroll_001', 'tenant_sample_001', 'PAYROLL', NOW(), NOW());
