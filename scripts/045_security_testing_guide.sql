-- SECURITY TESTING GUIDE
-- Run these tests after implementing the security changes

-- ============================================================================
-- TEST 1: VERIFY RLS IS ENABLED
-- ============================================================================

SELECT 
  'RLS Status Check' as test_name,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled - SECURITY RISK!'
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'employees', 'subsidiaries', 'companies', 'employee_financial',
  'employee_documents', 'organizational_charts', 'company_settings',
  'roles', 'user_roles', 'role_permissions', 'permissions',
  'access_logs', 'security_analytics'
)
ORDER BY tablename;

-- ============================================================================
-- TEST 2: VERIFY NO ANONYMOUS ACCESS
-- ============================================================================

SELECT 
  'Anonymous Access Check' as test_name,
  COUNT(*) as anon_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No Anonymous Access'
    ELSE '❌ Anonymous Access Found - SECURITY RISK!'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND 'anon' = ANY(roles);

-- ============================================================================
-- TEST 3: VERIFY NO OPEN ACCESS POLICIES
-- ============================================================================

SELECT 
  'Open Access Check' as test_name,
  COUNT(*) as open_policies,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ No Open Access Policies'
    ELSE '❌ Open Access Policies Found - SECURITY RISK!'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND (qual = 'true' OR with_check = 'true');

-- ============================================================================
-- TEST 4: VERIFY HELPER FUNCTIONS
-- ============================================================================

SELECT 
  'Helper Functions Check' as test_name,
  proname as function_name,
  CASE 
    WHEN proname IS NOT NULL THEN '✅ Function Exists'
    ELSE '❌ Function Missing'
  END as status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'get_current_user_company_id', 
  'is_user_authenticated', 
  'user_has_permission',
  'user_is_company_admin'
)
ORDER BY proname;

-- ============================================================================
-- TEST 5: VERIFY SECURITY POLICIES
-- ============================================================================

SELECT 
  'Security Policies Check' as test_name,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ Sufficient Policies'
    ELSE '⚠️ Insufficient Policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'companies', 'subsidiaries', 'employee_financial')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- TEST 6: CHECK SAMPLE DATA
-- ============================================================================

SELECT 
  'Sample Data Check' as test_name,
  'employees' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data Present'
    ELSE '⚠️ No Data - Tests may fail'
  END as status
FROM employees

UNION ALL

SELECT 
  'Sample Data Check' as test_name,
  'companies' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data Present'
    ELSE '⚠️ No Data - Tests may fail'
  END as status
FROM companies

UNION ALL

SELECT 
  'Sample Data Check' as test_name,
  'roles' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data Present'
    ELSE '⚠️ No Data - Tests may fail'
  END as status
FROM roles

UNION ALL

SELECT 
  'Sample Data Check' as test_name,
  'permissions' as table_name,
  COUNT(*) as record_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Data Present'
    ELSE '⚠️ No Data - Tests may fail'
  END as status
FROM permissions;

-- ============================================================================
-- TEST 7: VERIFY PERMISSIONS GRANTS
-- ============================================================================

SELECT 
  'Permissions Check' as test_name,
  table_name,
  grantee,
  privilege_type,
  CASE 
    WHEN grantee = 'authenticated' THEN '✅ Authenticated Access'
    WHEN grantee = 'anon' THEN '❌ Anonymous Access - SECURITY RISK!'
    ELSE '⚠️ Other Access'
  END as status
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('employees', 'companies', 'subsidiaries', 'employee_financial')
AND grantee IN ('authenticated', 'anon')
ORDER BY table_name, grantee;

-- ============================================================================
-- TEST 8: SECURITY SUMMARY
-- ============================================================================

DO $$
DECLARE
    rls_count INTEGER;
    anon_count INTEGER;
    open_count INTEGER;
    func_count INTEGER;
    policy_count INTEGER;
    total_issues INTEGER := 0;
BEGIN
    -- Count RLS enabled tables
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN (
        'employees', 'subsidiaries', 'companies', 'employee_financial',
        'employee_documents', 'organizational_charts', 'company_settings',
        'roles', 'user_roles', 'role_permissions', 'permissions',
        'access_logs', 'security_analytics'
    )
    AND rowsecurity = true;
    
    -- Count anonymous policies
    SELECT COUNT(*) INTO anon_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND 'anon' = ANY(roles);
    
    -- Count open policies
    SELECT COUNT(*) INTO open_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true');
    
    -- Count helper functions
    SELECT COUNT(*) INTO func_count
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname IN (
        'get_current_user_company_id', 
        'is_user_authenticated', 
        'user_has_permission',
        'user_is_company_admin'
    );
    
    -- Count security policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename IN ('employees', 'companies', 'subsidiaries', 'employee_financial');
    
    -- Calculate total issues
    IF rls_count < 13 THEN total_issues := total_issues + 1; END IF;
    IF anon_count > 0 THEN total_issues := total_issues + 1; END IF;
    IF open_count > 0 THEN total_issues := total_issues + 1; END IF;
    IF func_count < 4 THEN total_issues := total_issues + 1; END IF;
    IF policy_count < 16 THEN total_issues := total_issues + 1; END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY IMPLEMENTATION SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS Enabled Tables: %/13', rls_count;
    RAISE NOTICE 'Anonymous Policies: %', anon_count;
    RAISE NOTICE 'Open Access Policies: %', open_count;
    RAISE NOTICE 'Helper Functions: %/4', func_count;
    RAISE NOTICE 'Security Policies: %', policy_count;
    RAISE NOTICE '';
    
    IF total_issues = 0 THEN
        RAISE NOTICE '✅ SECURITY IMPLEMENTATION SUCCESSFUL!';
        RAISE NOTICE 'All security measures are properly implemented.';
    ELSE
        RAISE NOTICE '⚠️ SECURITY ISSUES DETECTED: %', total_issues;
        RAISE NOTICE 'Please review the failed tests above.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Configure user metadata with company_id';
    RAISE NOTICE '2. Test with different user roles';
    RAISE NOTICE '3. Monitor security logs';
    RAISE NOTICE '========================================';
END $$;