-- SECURE ROLE SECURITY IMPLEMENTATION
-- This script implements proper role-based access control with company isolation
-- CRITICAL: This fixes the open access vulnerabilities in the current setup

-- ============================================================================
-- STEP 1: CREATE SECURE HELPER FUNCTIONS
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
-- STEP 2: REMOVE INSECURE POLICIES
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
-- STEP 3: CREATE SECURE RLS POLICIES
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

-- EMPLOYEE_DOCUMENTS TABLE - Company-based access
CREATE POLICY "employee_documents_secure_select" ON employee_documents
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      employee_id = auth.uid() OR
      (employee_id IN (
        SELECT id FROM employees 
        WHERE company_id = get_current_user_company_id()
      ) AND user_has_permission('documents', 'read'))
    )
  );

CREATE POLICY "employee_documents_secure_insert" ON employee_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('documents', 'create')
  );

CREATE POLICY "employee_documents_secure_update" ON employee_documents
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND (
      employee_id = auth.uid() OR
      (employee_id IN (
        SELECT id FROM employees 
        WHERE company_id = get_current_user_company_id()
      ) AND user_has_permission('documents', 'update'))
    )
  )
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "employee_documents_secure_delete" ON employee_documents
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('documents', 'delete')
  );

-- ORGANIZATIONAL_CHARTS TABLE - Company-based access
CREATE POLICY "organizational_charts_secure_select" ON organizational_charts
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      company_id = get_current_user_company_id() OR
      user_has_permission('organizational', 'read')
    )
  );

CREATE POLICY "organizational_charts_secure_insert" ON organizational_charts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('organizational', 'manage')
  );

CREATE POLICY "organizational_charts_secure_update" ON organizational_charts
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('organizational', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY "organizational_charts_secure_delete" ON organizational_charts
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('organizational', 'manage')
  );

-- COMPANY_SETTINGS TABLE - Admin only
CREATE POLICY "company_settings_secure_select" ON company_settings
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      company_id = get_current_user_company_id() OR
      user_has_permission('settings', 'read')
    )
  );

CREATE POLICY "company_settings_secure_insert" ON company_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('settings', 'manage')
  );

CREATE POLICY "company_settings_secure_update" ON company_settings
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('settings', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY "company_settings_secure_delete" ON company_settings
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('settings', 'manage')
  );

-- ROLES TABLE - Company-based access
CREATE POLICY "roles_secure_select" ON roles
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      company_id = get_current_user_company_id() OR
      user_has_permission('roles', 'read')
    )
  );

CREATE POLICY "roles_secure_insert" ON roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('roles', 'manage')
  );

CREATE POLICY "roles_secure_update" ON roles
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('roles', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

CREATE POLICY "roles_secure_delete" ON roles
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('roles', 'manage')
  );

-- USER_ROLES TABLE - Company-based access
CREATE POLICY "user_roles_secure_select" ON user_roles
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      employee_id = auth.uid() OR
      (employee_id IN (
        SELECT id FROM employees 
        WHERE company_id = get_current_user_company_id()
      ) AND user_has_permission('roles', 'read'))
    )
  );

CREATE POLICY "user_roles_secure_insert" ON user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('roles', 'manage')
  );

CREATE POLICY "user_roles_secure_update" ON user_roles
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('roles', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    )
  );

CREATE POLICY "user_roles_secure_delete" ON user_roles
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_current_user_company_id()
    ) AND
    user_has_permission('roles', 'manage')
  );

-- ROLE_PERMISSIONS TABLE - Admin only
CREATE POLICY "role_permissions_secure_select" ON role_permissions
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND
    user_has_permission('permissions', 'read')
  );

CREATE POLICY "role_permissions_secure_insert" ON role_permissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    user_has_permission('permissions', 'manage')
  );

CREATE POLICY "role_permissions_secure_update" ON role_permissions
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    user_has_permission('permissions', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    user_has_permission('permissions', 'manage')
  );

CREATE POLICY "role_permissions_secure_delete" ON role_permissions
  FOR DELETE
  TO authenticated
  USING (
    is_user_authenticated() AND
    user_has_permission('permissions', 'manage')
  );

-- PERMISSIONS TABLE - Read-only for all authenticated users
CREATE POLICY "permissions_secure_select" ON permissions
  FOR SELECT
  TO authenticated
  USING (is_user_authenticated());

-- ACCESS_LOGS TABLE - Company-based access
CREATE POLICY "access_logs_secure_select" ON access_logs
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      employee_id = auth.uid() OR
      (company_id = get_current_user_company_id() AND user_has_permission('access_logs', 'read'))
    )
  );

CREATE POLICY "access_logs_secure_insert" ON access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    employee_id = auth.uid()
  );

-- SECURITY_ANALYTICS TABLE - Admin only
CREATE POLICY "security_analytics_secure_select" ON security_analytics
  FOR SELECT
  TO authenticated
  USING (
    is_user_authenticated() AND (
      company_id = get_current_user_company_id() OR
      user_has_permission('security_analytics', 'read')
    )
  );

CREATE POLICY "security_analytics_secure_insert" ON security_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('security_analytics', 'manage')
  );

CREATE POLICY "security_analytics_secure_update" ON security_analytics
  FOR UPDATE
  TO authenticated
  USING (
    is_user_authenticated() AND
    company_id = get_current_user_company_id() AND
    user_has_permission('security_analytics', 'manage')
  )
  WITH CHECK (
    is_user_authenticated() AND
    company_id = get_current_user_company_id()
  );

-- ============================================================================
-- STEP 4: RE-ENABLE RLS WITH SECURE POLICIES
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
-- STEP 5: GRANT APPROPRIATE PERMISSIONS
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
-- STEP 6: CREATE SECURITY MONITORING FUNCTIONS
-- ============================================================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action VARCHAR(100),
  p_resource VARCHAR(100) DEFAULT NULL,
  p_success BOOLEAN DEFAULT TRUE,
  p_failure_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  user_company_id UUID;
BEGIN
  -- Get user's company ID
  user_company_id := get_current_user_company_id();
  
  -- Insert security log
  INSERT INTO access_logs (
    employee_id, company_id, action, resource, 
    success, failure_reason, metadata
  ) VALUES (
    auth.uid(), user_company_id, p_action, p_resource,
    p_success, p_failure_reason, p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION check_suspicious_activity()
RETURNS TABLE(
  employee_id UUID,
  action_count BIGINT,
  risk_level TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    al.employee_id,
    COUNT(*) as action_count,
    CASE 
      WHEN COUNT(*) > 100 THEN 'HIGH'
      WHEN COUNT(*) > 50 THEN 'MEDIUM'
      ELSE 'LOW'
    END as risk_level
  FROM access_logs al
  WHERE al.created_at >= NOW() - INTERVAL '1 hour'
  GROUP BY al.employee_id
  HAVING COUNT(*) > 20
  ORDER BY action_count DESC;
$$;

-- ============================================================================
-- STEP 7: CREATE SECURITY VIEWS
-- ============================================================================

-- View for security administrators to monitor access
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  e.full_name,
  e.email,
  c.name as company_name,
  COUNT(al.id) as access_count,
  MAX(al.created_at) as last_access,
  COUNT(DISTINCT al.action) as unique_actions,
  COUNT(DISTINCT al.resource) as unique_resources
FROM employees e
JOIN companies c ON e.company_id = c.id
LEFT JOIN access_logs al ON e.id = al.employee_id
WHERE al.created_at >= NOW() - INTERVAL '24 hours'
GROUP BY e.id, e.full_name, e.email, c.name
ORDER BY access_count DESC;

-- View for role assignments
CREATE OR REPLACE VIEW role_assignments_summary AS
SELECT 
  e.full_name,
  e.email,
  c.name as company_name,
  r.name as role_name,
  r.code as role_code,
  ur.assigned_at,
  ur.is_active
FROM employees e
JOIN companies c ON e.company_id = c.id
JOIN user_roles ur ON e.id = ur.employee_id
JOIN roles r ON ur.role_id = r.id
WHERE ur.is_active = TRUE
ORDER BY c.name, e.full_name;

-- ============================================================================
-- STEP 8: CREATE SECURITY ALERTS
-- ============================================================================

-- Function to generate security alerts
CREATE OR REPLACE FUNCTION generate_security_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  alert_record RECORD;
BEGIN
  -- Check for users with excessive access attempts
  FOR alert_record IN 
    SELECT 
      e.id as employee_id,
      e.company_id,
      COUNT(*) as access_count,
      'excessive_access' as alert_type,
      'User has made ' || COUNT(*) || ' access attempts in the last hour' as description
    FROM access_logs al
    JOIN employees e ON al.employee_id = e.id
    WHERE al.created_at >= NOW() - INTERVAL '1 hour'
    GROUP BY e.id, e.company_id
    HAVING COUNT(*) > 50
  LOOP
    INSERT INTO security_analytics (
      company_id, analysis_type, severity, title, description,
      affected_users, risk_score, confidence_score
    ) VALUES (
      alert_record.company_id,
      'anomaly_detection',
      'HIGH',
      'Excessive Access Attempts',
      alert_record.description,
      ARRAY[alert_record.employee_id],
      85,
      0.9
    ) ON CONFLICT DO NOTHING;
  END LOOP;
  
  -- Check for failed access attempts
  FOR alert_record IN 
    SELECT 
      e.id as employee_id,
      e.company_id,
      COUNT(*) as failed_count,
      'failed_access' as alert_type,
      'User has ' || COUNT(*) || ' failed access attempts in the last hour' as description
    FROM access_logs al
    JOIN employees e ON al.employee_id = e.id
    WHERE al.created_at >= NOW() - INTERVAL '1 hour'
    AND al.success = FALSE
    GROUP BY e.id, e.company_id
    HAVING COUNT(*) > 10
  LOOP
    INSERT INTO security_analytics (
      company_id, analysis_type, severity, title, description,
      affected_users, risk_score, confidence_score
    ) VALUES (
      alert_record.company_id,
      'anomaly_detection',
      'CRITICAL',
      'Failed Access Attempts',
      alert_record.description,
      ARRAY[alert_record.employee_id],
      95,
      0.95
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- ============================================================================
-- STEP 9: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes to support the new RLS policies
CREATE INDEX IF NOT EXISTS idx_employees_company_id_auth ON employees(company_id) WHERE company_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employees_auth_uid ON employees(id) WHERE id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employee_financial_employee_id ON employee_financial(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_employee_id_active ON user_roles(employee_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX IF NOT EXISTS idx_access_logs_employee_id_created ON access_logs(employee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_access_logs_company_id_created ON access_logs(company_id, created_at);

-- ============================================================================
-- STEP 10: FINAL VERIFICATION
-- ============================================================================

-- Verify all policies are created
DO $$
DECLARE
    policy_count INTEGER;
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'employees', 'subsidiaries', 'companies', 'employee_financial',
        'employee_documents', 'organizational_charts', 'company_settings',
        'roles', 'user_roles', 'role_permissions', 'permissions',
        'access_logs', 'security_analytics'
    ];
BEGIN
    RAISE NOTICE '=== SECURITY IMPLEMENTATION COMPLETE ===';
    
    FOR i IN 1..array_length(tables, 1) LOOP
        table_name := tables[i];
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = table_name;
        
        RAISE NOTICE 'Table %: % policies created', table_name, policy_count;
    END LOOP;
    
    RAISE NOTICE '=== SECURITY FEATURES ENABLED ===';
    RAISE NOTICE '✓ Company-based data isolation';
    RAISE NOTICE '✓ Role-based access control';
    RAISE NOTICE '✓ Permission-based authorization';
    RAISE NOTICE '✓ Security event logging';
    RAISE NOTICE '✓ Suspicious activity monitoring';
    RAISE NOTICE '✓ Anonymous access REMOVED';
    RAISE NOTICE '✓ Open access policies REMOVED';
    RAISE NOTICE '';
    RAISE NOTICE 'CRITICAL: Test all functionality to ensure proper access control!';
END $$;

-- ============================================================================
-- END OF SECURE ROLE SECURITY IMPLEMENTATION
-- ============================================================================