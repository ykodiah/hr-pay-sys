-- STEP-BY-STEP SECURITY IMPLEMENTATION
-- Run these steps one by one in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: CREATE SECURE HELPER FUNCTIONS (Run this first)
-- ============================================================================

-- Function to safely get current user's company ID without recursion
CREATE OR REPLACE FUNCTION get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Get company_id from user metadata or a dedicated user_profiles table
  -- This avoids querying the employees table which can cause RLS recursion
  SELECT COALESCE(
    (auth.jwt() ->> 'user_metadata' ->> 'company_id')::uuid,
    (auth.jwt() ->> 'app_metadata' ->> 'company_id')::uuid,
    NULL
  );
$$;

-- Function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_user_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_resource VARCHAR(100),
  p_action VARCHAR(50)
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.employee_id = auth.uid()
    AND ur.is_active = TRUE
    AND p.resource = p_resource
    AND p.action = p_action
  );
$$;

-- Function to check if user is admin in their company
CREATE OR REPLACE FUNCTION user_is_company_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.employee_id = auth.uid()
    AND ur.is_active = TRUE
    AND r.code IN ('SUPER_ADMIN', 'HR_MANAGER', 'ADMIN')
  );
$$;

-- ============================================================================
-- STEP 2: REMOVE INSECURE POLICIES (Run this second)
-- ============================================================================

-- Disable RLS temporarily to remove insecure policies
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_financial DISABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_charts DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE permissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_analytics DISABLE ROW LEVEL SECURITY;

-- Drop all existing insecure policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN (
            'employees', 'subsidiaries', 'companies', 'employee_financial',
            'employee_documents', 'organizational_charts', 'company_settings',
            'roles', 'user_roles', 'role_permissions', 'permissions',
            'access_logs', 'security_analytics'
        )
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: CREATE SECURE RLS POLICIES (Run this third)
-- ============================================================================

-- EMPLOYEES TABLE - Secure company-based access
CREATE POLICY "employees_secure_select" ON employees
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      -- Users can view their own record
      id = auth.uid() OR
      -- Users can view employees in their company if they have permission
      (company_id = get_current_user_company_id() AND user_has_permission('employees', 'read'))
    )
  );

CREATE POLICY "employees_secure_insert" ON employees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('employees', 'create')
  );

CREATE POLICY "employees_secure_update" ON employees
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND (
      -- Users can update their own record
      id = auth.uid() OR
      -- Users can update employees in their company if they have permission
      (company_id = get_current_user_company_id() AND user_has_permission('employees', 'update'))
    )
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY "employees_secure_delete" ON employees
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('employees', 'delete')
  );

-- COMPANIES TABLE - Only admins can manage companies
CREATE POLICY "companies_secure_select" ON companies
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      id = get_current_user_company_id() OR
      user_has_permission('company', 'read')
    )
  );

CREATE POLICY "companies_secure_insert" ON companies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    user_has_permission('company', 'manage')
  );

CREATE POLICY "companies_secure_update" ON companies
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND (
      id = get_current_user_company_id() OR
      user_has_permission('company', 'manage')
    )
  )
  WITH CHECK (
    is_user_authenticated() AND
    user_has_permission('company', 'manage')
  );

CREATE POLICY "companies_secure_delete" ON companies
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    user_has_permission('company', 'manage')
  );

-- SUBSIDIARIES TABLE - Company-based access
CREATE POLICY "subsidiaries_secure_select" ON subsidiaries
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      company_id = get_current_user_company_id() OR
      user_has_permission('subsidiaries', 'read')
    )
  );

CREATE POLICY "subsidiaries_secure_insert" ON subsidiaries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('subsidiaries', 'manage')
  );

CREATE POLICY "subsidiaries_secure_update" ON subsidiaries
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('subsidiaries', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY "subsidiaries_secure_delete" ON subsidiaries
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('subsidiaries', 'manage')
  );

-- EMPLOYEE_FINANCIAL TABLE - Highly restricted access
CREATE POLICY "employee_financial_secure_select" ON employee_financial
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      -- Users can view their own financial data
      employee_id = auth.uid() OR
      -- HR/Payroll can view financial data in their company
      (employee_id IN (
        SELECT id FROM employees 
        WHERE company_id = get_current_user_company_id()
      ) AND user_has_permission('financial', 'read'))
    )
  );

CREATE POLICY "employee_financial_secure_insert" ON employee_financial
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('financial', 'create')
  );

CREATE POLICY "employee_financial_secure_update" ON employee_financial
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND (
      employee_id = auth.uid() OR
      (employee_id IN (
        SELECT id FROM employees 
        WHERE company_id = get_current_user_company_id()
      ) AND user_has_permission('financial', 'update'))
    )
  )
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "employee_financial_secure_delete" ON employee_financial
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('financial', 'delete')
  );

-- ============================================================================
-- STEP 4: RE-ENABLE RLS WITH SECURE POLICIES (Run this fourth)
-- ============================================================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_analytics ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: GRANT APPROPRIATE PERMISSIONS (Run this fifth)
-- ============================================================================

-- Grant permissions only to authenticated users (NO anonymous access)
GRANT ALL ON employees TO authenticated;
GRANT ALL ON subsidiaries TO authenticated;
GRANT ALL ON companies TO authenticated;
GRANT ALL ON employee_financial TO authenticated;
GRANT ALL ON employee_documents TO authenticated;
GRANT ALL ON organizational_charts TO authenticated;
GRANT ALL ON company_settings TO authenticated;
GRANT ALL ON roles TO authenticated;
GRANT ALL ON user_roles TO authenticated;
GRANT ALL ON role_permissions TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON access_logs TO authenticated;
GRANT ALL ON security_analytics TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- STEP 6: VERIFY IMPLEMENTATION (Run this last)
-- ============================================================================

-- Check that RLS is enabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'companies', 'subsidiaries', 'employee_financial')
ORDER BY tablename;

-- Check that policies are created
SELECT 
  schemaname, 
  tablename, 
  policyname,
  roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'companies', 'subsidiaries', 'employee_financial')
ORDER BY tablename, policyname;

-- Check that helper functions exist
SELECT 
  proname as function_name,
  proargnames as arguments
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN ('get_current_user_company_id', 'is_user_authenticated', 'user_has_permission')
ORDER BY proname;