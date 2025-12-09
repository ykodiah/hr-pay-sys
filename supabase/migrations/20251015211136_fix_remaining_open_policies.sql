-- Fix remaining open access policies
-- This script removes any remaining open access policies

-- Check for remaining open policies
DO $$
DECLARE
    policy_record RECORD;
    open_policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Checking for remaining open access policies...';
    
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, qual, with_check
        FROM pg_policies
        WHERE schemaname = 'public'
        AND (qual = 'true' OR with_check = 'true')
    LOOP
        RAISE NOTICE 'Found open policy: %.% - %', policy_record.schemaname, policy_record.tablename, policy_record.policyname;
        open_policy_count := open_policy_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Total open policies found: %', open_policy_count;
END $$;

-- Drop any remaining open access policies
DO $$ 
DECLARE
    r RECORD;
    dropped_count INTEGER := 0;
BEGIN
    -- Drop all policies that use 'true' as condition
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND (qual = 'true' OR with_check = 'true')
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
        dropped_count := dropped_count + 1;
        RAISE NOTICE 'Dropped open policy: %.% - %', r.schemaname, r.tablename, r.policyname;
    END LOOP;
    
    RAISE NOTICE 'Total open policies dropped: %', dropped_count;
END $$;

-- Verify no open policies remain
DO $$
DECLARE
    remaining_open_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_open_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND (qual = 'true' OR with_check = 'true');
    
    IF remaining_open_count = 0 THEN
        RAISE NOTICE '✅ All open access policies have been removed';
    ELSE
        RAISE NOTICE '⚠️ % open access policies still remain', remaining_open_count;
    END IF;
END $$;
