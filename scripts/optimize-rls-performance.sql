-- Optimize RLS Policies for Performance
-- This script addresses the "Auth RLS Initialization Plan" warnings in Supabase Performance Advisor

-- First, let's create a function to get the current user's company_id efficiently
-- This reduces repeated calls to auth functions
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT company_id 
  FROM employees 
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Create an optimized function to check if user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL;
$$;

-- Drop existing RLS policies that are causing performance issues
DROP POLICY IF EXISTS "company_settings_policy" ON company_settings;
DROP POLICY IF EXISTS "employees_policy" ON employees;
DROP POLICY IF EXISTS "employee_financial_policy" ON employee_financial;
DROP POLICY IF EXISTS "employee_documents_policy" ON employee_documents;
DROP POLICY IF EXISTS "organizational_charts_policy" ON organizational_charts;

-- Create optimized RLS policies for company_settings
CREATE POLICY "company_settings_select_policy" ON company_settings
  FOR SELECT
  USING (is_authenticated());

CREATE POLICY "company_settings_insert_policy" ON company_settings
  FOR INSERT
  WITH CHECK (is_authenticated());

CREATE POLICY "company_settings_update_policy" ON company_settings
  FOR UPDATE
  USING (is_authenticated())
  WITH CHECK (is_authenticated());

CREATE POLICY "company_settings_delete_policy" ON company_settings
  FOR DELETE
  USING (is_authenticated());

-- Create optimized RLS policies for employees
CREATE POLICY "employees_select_policy" ON employees
  FOR SELECT
  USING (
    is_authenticated() AND (
      id = auth.uid() OR 
      company_id = get_user_company_id()
    )
  );

CREATE POLICY "employees_insert_policy" ON employees
  FOR INSERT
  WITH CHECK (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "employees_update_policy" ON employees
  FOR UPDATE
  USING (
    is_authenticated() AND (
      id = auth.uid() OR 
      company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "employees_delete_policy" ON employees
  FOR DELETE
  USING (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

-- Create optimized RLS policies for employee_financial
CREATE POLICY "employee_financial_select_policy" ON employee_financial
  FOR SELECT
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE id = auth.uid() OR company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_financial_insert_policy" ON employee_financial
  FOR INSERT
  WITH CHECK (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_financial_update_policy" ON employee_financial
  FOR UPDATE
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE id = auth.uid() OR company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_financial_delete_policy" ON employee_financial
  FOR DELETE
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

-- Create optimized RLS policies for employee_documents
CREATE POLICY "employee_documents_select_policy" ON employee_documents
  FOR SELECT
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE id = auth.uid() OR company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_documents_insert_policy" ON employee_documents
  FOR INSERT
  WITH CHECK (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_documents_update_policy" ON employee_documents
  FOR UPDATE
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE id = auth.uid() OR company_id = get_user_company_id()
    )
  )
  WITH CHECK (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

CREATE POLICY "employee_documents_delete_policy" ON employee_documents
  FOR DELETE
  USING (
    is_authenticated() AND 
    employee_id IN (
      SELECT id FROM employees 
      WHERE company_id = get_user_company_id()
    )
  );

-- Create optimized RLS policies for organizational_charts
CREATE POLICY "organizational_charts_select_policy" ON organizational_charts
  FOR SELECT
  USING (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "organizational_charts_insert_policy" ON organizational_charts
  FOR INSERT
  WITH CHECK (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "organizational_charts_update_policy" ON organizational_charts
  FOR UPDATE
  USING (
    is_authenticated() AND 
    company_id = get_user_company_id()
  )
  WITH CHECK (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

CREATE POLICY "organizational_charts_delete_policy" ON organizational_charts
  FOR DELETE
  USING (
    is_authenticated() AND 
    company_id = get_user_company_id()
  );

-- Create indexes to support the optimized RLS policies
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_uid ON employees(id) WHERE id = auth.uid();
CREATE INDEX IF NOT EXISTS idx_employee_financial_employee_id ON employee_financial(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_documents_employee_id ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_organizational_charts_company_id ON organizational_charts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_settings_id ON company_settings(id);

-- Create a materialized view for frequently accessed employee-company relationships
-- This can help reduce the overhead of repeated company_id lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS employee_company_cache AS
SELECT 
  e.id as employee_id,
  e.company_id,
  c.name as company_name
FROM employees e
JOIN companies c ON e.company_id = c.id;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_company_cache_employee_id 
ON employee_company_cache(employee_id);

-- Create a function to refresh the cache
CREATE OR REPLACE FUNCTION refresh_employee_company_cache()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY employee_company_cache;
$$;

-- Set up automatic cache refresh (optional - can be called manually or via cron)
-- This helps maintain performance by keeping the cache up to date
COMMENT ON FUNCTION refresh_employee_company_cache() IS 
'Refreshes the employee-company cache to maintain RLS performance. Call this periodically or after bulk employee updates.';

-- Grant necessary permissions
GRANT SELECT ON employee_company_cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_authenticated() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_employee_company_cache() TO service_role;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_company_id() IS 
'Efficiently retrieves the company_id for the current authenticated user. Used in RLS policies to reduce auth function calls.';

COMMENT ON FUNCTION is_authenticated() IS 
'Efficiently checks if a user is authenticated. Used in RLS policies to reduce repeated auth.uid() calls.';

-- Performance optimization: Analyze tables after index creation
ANALYZE employees;
ANALYZE employee_financial;
ANALYZE employee_documents;
ANALYZE organizational_charts;
ANALYZE company_settings;

-- Log completion
SELECT 'RLS Performance optimization completed successfully' as status;
