-- Final comprehensive fix for infinite recursion in RLS policies
-- This script completely removes all recursive policies and creates simple, non-recursive ones

-- Step 1: Temporarily disable RLS on all affected tables
ALTER TABLE IF EXISTS employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subsidiaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_financial DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS organizational_charts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_settings DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies that might cause recursion
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on employees table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employees' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.employees';
    END LOOP;
    
    -- Drop all policies on subsidiaries table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'subsidiaries' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.subsidiaries';
    END LOOP;
    
    -- Drop all policies on companies table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.companies';
    END LOOP;
    
    -- Drop all policies on employee_financial table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employee_financial' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.employee_financial';
    END LOOP;
    
    -- Drop all policies on employee_documents table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employee_documents' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.employee_documents';
    END LOOP;
    
    -- Drop all policies on organizational_charts table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizational_charts' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.organizational_charts';
    END LOOP;
    
    -- Drop all policies on company_settings table
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'company_settings' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.company_settings';
    END LOOP;
END $$;

-- Step 3: Drop all problematic functions
DROP FUNCTION IF EXISTS get_user_company_id() CASCADE;
DROP FUNCTION IF EXISTS get_user_company_id_safe() CASCADE;
DROP FUNCTION IF EXISTS get_current_user_company() CASCADE;
DROP FUNCTION IF EXISTS is_authenticated() CASCADE;

-- Step 4: Create simple, non-recursive policies
-- These policies allow all authenticated users to access all data (suitable for demo mode)

-- Employees table - simple policy without any subqueries
CREATE POLICY "employees_full_access" ON employees
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also allow anonymous access for demo mode
CREATE POLICY "employees_anon_access" ON employees
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Subsidiaries table - simple policy
CREATE POLICY "subsidiaries_full_access" ON subsidiaries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "subsidiaries_anon_access" ON subsidiaries
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Companies table - simple policy
CREATE POLICY "companies_full_access" ON companies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "companies_anon_access" ON companies
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Employee financial table - simple policy
CREATE POLICY "employee_financial_full_access" ON employee_financial
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "employee_financial_anon_access" ON employee_financial
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Employee documents table - simple policy
CREATE POLICY "employee_documents_full_access" ON employee_documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "employee_documents_anon_access" ON employee_documents
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Organizational charts table - simple policy
CREATE POLICY "organizational_charts_full_access" ON organizational_charts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "organizational_charts_anon_access" ON organizational_charts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Company settings table - simple policy
CREATE POLICY "company_settings_full_access" ON company_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "company_settings_anon_access" ON company_settings
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Step 5: Re-enable RLS with the new simple policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizational_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Step 6: Grant necessary permissions
GRANT ALL ON employees TO authenticated, anon;
GRANT ALL ON subsidiaries TO authenticated, anon;
GRANT ALL ON companies TO authenticated, anon;
GRANT ALL ON employee_financial TO authenticated, anon;
GRANT ALL ON employee_documents TO authenticated, anon;
GRANT ALL ON organizational_charts TO authenticated, anon;
GRANT ALL ON company_settings TO authenticated, anon;

-- Step 7: Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Step 8: Verify policies are created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('employees', 'subsidiaries', 'companies', 'employee_financial', 'employee_documents', 'organizational_charts', 'company_settings');
    
    RAISE NOTICE 'Total RLS policies created: %', policy_count;
    RAISE NOTICE 'RLS infinite recursion fix completed successfully';
    RAISE NOTICE 'All tables now use simple, non-recursive policies suitable for demo mode';
END $$;
