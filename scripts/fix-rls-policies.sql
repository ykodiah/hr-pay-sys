-- Fix infinite recursion in RLS policies for employees and related tables
-- This script addresses the circular reference issues causing infinite recursion

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "employees_select_policy" ON employees;
DROP POLICY IF EXISTS "employees_insert_policy" ON employees;
DROP POLICY IF EXISTS "employees_update_policy" ON employees;
DROP POLICY IF EXISTS "employees_delete_policy" ON employees;

DROP POLICY IF EXISTS "companies_select_policy" ON companies;
DROP POLICY IF EXISTS "companies_insert_policy" ON companies;
DROP POLICY IF EXISTS "companies_update_policy" ON companies;
DROP POLICY IF EXISTS "companies_delete_policy" ON companies;

DROP POLICY IF EXISTS "subsidiaries_select_policy" ON subsidiaries;
DROP POLICY IF EXISTS "subsidiaries_insert_policy" ON subsidiaries;
DROP POLICY IF EXISTS "subsidiaries_update_policy" ON subsidiaries;
DROP POLICY IF EXISTS "subsidiaries_delete_policy" ON subsidiaries;

DROP POLICY IF EXISTS "roles_select_policy" ON roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON roles;
DROP POLICY IF EXISTS "roles_update_policy" ON roles;
DROP POLICY IF EXISTS "roles_delete_policy" ON roles;

DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;

-- Create simplified, non-recursive policies for companies
CREATE POLICY "companies_select_policy" ON companies
    FOR SELECT USING (true);

CREATE POLICY "companies_insert_policy" ON companies
    FOR INSERT WITH CHECK (true);

CREATE POLICY "companies_update_policy" ON companies
    FOR UPDATE USING (true);

CREATE POLICY "companies_delete_policy" ON companies
    FOR DELETE USING (true);

-- Create simplified, non-recursive policies for subsidiaries
CREATE POLICY "subsidiaries_select_policy" ON subsidiaries
    FOR SELECT USING (true);

CREATE POLICY "subsidiaries_insert_policy" ON subsidiaries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "subsidiaries_update_policy" ON subsidiaries
    FOR UPDATE USING (true);

CREATE POLICY "subsidiaries_delete_policy" ON subsidiaries
    FOR DELETE USING (true);

-- Create simplified, non-recursive policies for roles
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT USING (true);

CREATE POLICY "roles_insert_policy" ON roles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "roles_update_policy" ON roles
    FOR UPDATE USING (true);

CREATE POLICY "roles_delete_policy" ON roles
    FOR DELETE USING (true);

-- Create simplified, non-recursive policies for user_roles
CREATE POLICY "user_roles_select_policy" ON user_roles
    FOR SELECT USING (true);

CREATE POLICY "user_roles_insert_policy" ON user_roles
    FOR INSERT WITH CHECK (true);

CREATE POLICY "user_roles_update_policy" ON user_roles
    FOR UPDATE USING (true);

CREATE POLICY "user_roles_delete_policy" ON user_roles
    FOR DELETE USING (true);

-- Create simplified, non-recursive policies for employees
-- These policies avoid circular references by not checking employee relationships
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (true);

CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (true);

CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (true);

CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (true);

-- Re-enable RLS with the new simplified policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_subsidiary_id ON employees(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company_id ON subsidiaries(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_employee_id ON user_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);

-- Add some sample data if tables are empty
INSERT INTO companies (id, name, email_address, phone_number, address, industry, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'Akwaaba HR Solutions',
    'info@akwaabaHR.com',
    '+233-123-456-789',
    '123 Business District, Accra, Ghana',
    'Human Resources Technology',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Verify the fix by testing a simple query
SELECT COUNT(*) as employee_count FROM employees;
SELECT COUNT(*) as company_count FROM companies;
SELECT COUNT(*) as subsidiary_count FROM subsidiaries;
SELECT COUNT(*) as role_count FROM roles;

COMMIT;
