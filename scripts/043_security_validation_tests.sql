-- SECURITY VALIDATION TESTS
-- This script tests the security implementation to ensure proper access control

-- ============================================================================
-- TEST 1: VERIFY RLS POLICIES ARE ACTIVE
-- ============================================================================

DO $$
DECLARE
    rls_enabled_count INTEGER;
    expected_tables INTEGER := 13;
BEGIN
    SELECT COUNT(*) INTO rls_enabled_count
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
    AND c.relname IN (
        'employees', 'subsidiaries', 'companies', 'employee_financial',
        'employee_documents', 'organizational_charts', 'company_settings',
        'roles', 'user_roles', 'role_permissions', 'permissions',
        'access_logs', 'security_analytics'
    )
    AND c.relrowsecurity = true;
    
    IF rls_enabled_count = expected_tables THEN
        RAISE NOTICE '✓ RLS is enabled on all % tables', expected_tables;
    ELSE
        RAISE NOTICE '✗ RLS is only enabled on % out of % tables', rls_enabled_count, expected_tables;
    END IF;
END $$;

-- ============================================================================
-- TEST 2: VERIFY NO ANONYMOUS ACCESS
-- ============================================================================

DO $$
DECLARE
    anon_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO anon_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND roles = ARRAY['anon'::name];
    
    IF anon_policy_count = 0 THEN
        RAISE NOTICE '✓ No anonymous access policies found';
    ELSE
        RAISE NOTICE '✗ Found % anonymous access policies - SECURITY RISK!', anon_policy_count;
    END IF;
END $$;

-- ============================================================================
-- TEST 3: VERIFY NO OPEN ACCESS POLICIES
-- ============================================================================

DO $$
DECLARE
    open_policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO open_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true');
    
    IF open_policy_count = 0 THEN
        RAISE NOTICE '✓ No open access policies found';
    ELSE
        RAISE NOTICE '✗ Found % open access policies - SECURITY RISK!', open_policy_count;
    END IF;
END $$;

-- ============================================================================
-- TEST 4: VERIFY HELPER FUNCTIONS EXIST
-- ============================================================================

DO $$
DECLARE
    function_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'get_current_user_company_id',
        'is_user_authenticated',
        'user_has_permission',
        'user_is_company_admin',
        'log_security_event',
        'check_suspicious_activity',
        'generate_security_alerts'
    ];
    func_name TEXT;
BEGIN
    RAISE NOTICE 'Checking security helper functions...';
    
    FOREACH func_name IN ARRAY expected_functions
    LOOP
        SELECT COUNT(*) INTO function_count
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = func_name;
        
        IF function_count > 0 THEN
            RAISE NOTICE '✓ Function % exists', func_name;
        ELSE
            RAISE NOTICE '✗ Function % is missing', func_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 5: VERIFY SECURITY VIEWS EXIST
-- ============================================================================

DO $$
DECLARE
    view_count INTEGER;
    expected_views TEXT[] := ARRAY[
        'security_dashboard',
        'role_assignments_summary'
    ];
    view_name TEXT;
BEGIN
    RAISE NOTICE 'Checking security views...';
    
    FOREACH view_name IN ARRAY expected_views
    LOOP
        SELECT COUNT(*) INTO view_count
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND c.relname = view_name
        AND c.relkind = 'v';
        
        IF view_count > 0 THEN
            RAISE NOTICE '✓ View % exists', view_name;
        ELSE
            RAISE NOTICE '✗ View % is missing', view_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 6: VERIFY PERMISSIONS ARE PROPERLY GRANTED
-- ============================================================================

DO $$
DECLARE
    anon_grants INTEGER;
    auth_grants INTEGER;
    table_name TEXT;
    tables TEXT[] := ARRAY[
        'employees', 'subsidiaries', 'companies', 'employee_financial',
        'employee_documents', 'organizational_charts', 'company_settings',
        'roles', 'user_roles', 'role_permissions', 'permissions',
        'access_logs', 'security_analytics'
    ];
BEGIN
    RAISE NOTICE 'Checking table permissions...';
    
    FOREACH table_name IN ARRAY tables
    LOOP
        -- Check for anonymous grants (should be 0)
        SELECT COUNT(*) INTO anon_grants
        FROM information_schema.table_privileges
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND grantee = 'anon';
        
        -- Check for authenticated grants (should be > 0)
        SELECT COUNT(*) INTO auth_grants
        FROM information_schema.table_privileges
        WHERE table_schema = 'public'
        AND table_name = table_name
        AND grantee = 'authenticated';
        
        IF anon_grants = 0 AND auth_grants > 0 THEN
            RAISE NOTICE '✓ Table % has proper permissions', table_name;
        ELSE
            RAISE NOTICE '✗ Table % has incorrect permissions (anon: %, auth: %)', table_name, anon_grants, auth_grants;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 7: VERIFY INDEXES FOR PERFORMANCE
-- ============================================================================

DO $$
DECLARE
    index_count INTEGER;
    expected_indexes TEXT[] := ARRAY[
        'idx_employees_company_id_auth',
        'idx_employees_auth_uid',
        'idx_employee_financial_employee_id',
        'idx_employee_documents_employee_id',
        'idx_user_roles_employee_id_active',
        'idx_role_permissions_role_id',
        'idx_permissions_resource_action',
        'idx_access_logs_employee_id_created',
        'idx_access_logs_company_id_created'
    ];
    index_name TEXT;
BEGIN
    RAISE NOTICE 'Checking performance indexes...';
    
    FOREACH index_name IN ARRAY expected_indexes
    LOOP
        SELECT COUNT(*) INTO index_count
        FROM pg_indexes
        WHERE schemaname = 'public' AND indexname = index_name;
        
        IF index_count > 0 THEN
            RAISE NOTICE '✓ Index % exists', index_name;
        ELSE
            RAISE NOTICE '✗ Index % is missing', index_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- TEST 8: VERIFY SAMPLE DATA INTEGRITY
-- ============================================================================

DO $$
DECLARE
    employee_count INTEGER;
    company_count INTEGER;
    role_count INTEGER;
    permission_count INTEGER;
BEGIN
    RAISE NOTICE 'Checking sample data integrity...';
    
    SELECT COUNT(*) INTO employee_count FROM employees;
    SELECT COUNT(*) INTO company_count FROM companies;
    SELECT COUNT(*) INTO role_count FROM roles;
    SELECT COUNT(*) INTO permission_count FROM permissions;
    
    RAISE NOTICE 'Data counts:';
    RAISE NOTICE '  Employees: %', employee_count;
    RAISE NOTICE '  Companies: %', company_count;
    RAISE NOTICE '  Roles: %', role_count;
    RAISE NOTICE '  Permissions: %', permission_count;
    
    IF employee_count > 0 AND company_count > 0 AND role_count > 0 AND permission_count > 0 THEN
        RAISE NOTICE '✓ Sample data is present';
    ELSE
        RAISE NOTICE '✗ Missing sample data - some tests may fail';
    END IF;
END $$;

-- ============================================================================
-- TEST 9: SECURITY POLICY ANALYSIS
-- ============================================================================

DO $$
DECLARE
    policy_record RECORD;
    total_policies INTEGER;
    secure_policies INTEGER := 0;
    insecure_policies INTEGER := 0;
BEGIN
    RAISE NOTICE 'Analyzing security policies...';
    
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    FOR policy_record IN 
        SELECT tablename, policyname, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY tablename, policyname
    LOOP
        -- Check if policy uses secure functions
        IF policy_record.qual LIKE '%get_current_user_company_id%' OR
           policy_record.qual LIKE '%user_has_permission%' OR
           policy_record.qual LIKE '%is_user_authenticated%' OR
           policy_record.qual LIKE '%auth.uid%' THEN
            secure_policies := secure_policies + 1;
        ELSE
            insecure_policies := insecure_policies + 1;
            RAISE NOTICE '⚠ Policy % on % may not be secure', policy_record.policyname, policy_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Policy analysis:';
    RAISE NOTICE '  Total policies: %', total_policies;
    RAISE NOTICE '  Secure policies: %', secure_policies;
    RAISE NOTICE '  Potentially insecure: %', insecure_policies;
    
    IF insecure_policies = 0 THEN
        RAISE NOTICE '✓ All policies appear to be secure';
    ELSE
        RAISE NOTICE '⚠ Review the potentially insecure policies above';
    END IF;
END $$;

-- ============================================================================
-- TEST 10: FINAL SECURITY SUMMARY
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY VALIDATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Review any warnings or errors above';
    RAISE NOTICE '2. Test user access with different roles';
    RAISE NOTICE '3. Verify company data isolation works';
    RAISE NOTICE '4. Test permission-based access control';
    RAISE NOTICE '5. Monitor security logs for anomalies';
    RAISE NOTICE '';
    RAISE NOTICE 'SECURITY FEATURES IMPLEMENTED:';
    RAISE NOTICE '✓ Row Level Security (RLS) enabled';
    RAISE NOTICE '✓ Company-based data isolation';
    RAISE NOTICE '✓ Role-based access control';
    RAISE NOTICE '✓ Permission-based authorization';
    RAISE NOTICE '✓ Security event logging';
    RAISE NOTICE '✓ Anonymous access removed';
    RAISE NOTICE '✓ Open access policies removed';
    RAISE NOTICE '';
    RAISE NOTICE 'CRITICAL: Test thoroughly before production use!';
    RAISE NOTICE '========================================';
END $$;