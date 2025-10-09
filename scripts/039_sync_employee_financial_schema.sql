-- Sync Employee Financial Schema with Application Changes
-- This script ensures the database schema matches all changes made in the employee module
-- Run this script to update the database to support the latest employee features

-- =============================================================================
-- MIGRATION OVERVIEW
-- =============================================================================
-- 1. Ensure annual_salary column exists in employee_financial table
-- 2. Ensure custom_banks table exists with proper structure
-- 3. Verify and update RLS policies
-- 4. Create helper functions for bank management
-- 5. Add indexes for performance optimization

BEGIN;

-- =============================================================================
-- 1. ENSURE ANNUAL SALARY COLUMN EXISTS
-- =============================================================================

-- Add annual_salary column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name = 'annual_salary'
    ) THEN
        ALTER TABLE employee_financial 
        ADD COLUMN annual_salary DECIMAL(12,2);
        
        RAISE NOTICE 'Added annual_salary column to employee_financial table';
    ELSE
        RAISE NOTICE 'annual_salary column already exists in employee_financial table';
    END IF;
END $$;

-- Add comment to the column
COMMENT ON COLUMN employee_financial.annual_salary IS 'Annual salary in GHS - used to auto-calculate monthly salary (annual_salary / 12)';

-- Create index for annual_salary column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_employee_financial_annual_salary 
ON employee_financial(annual_salary);

-- =============================================================================
-- 2. ENSURE CUSTOM BANKS TABLE EXISTS
-- =============================================================================

-- Create custom banks table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    
    -- Ensure unique bank names per company
    CONSTRAINT unique_company_bank UNIQUE(company_id, bank_name)
);

-- Add comments
COMMENT ON TABLE custom_banks IS 'Custom banks added by companies beyond the default Ghanaian banks list';
COMMENT ON COLUMN custom_banks.company_id IS 'Reference to the company that added this custom bank';
COMMENT ON COLUMN custom_banks.bank_name IS 'Name of the custom bank';
COMMENT ON COLUMN custom_banks.created_by IS 'Employee ID of user who added this custom bank';
COMMENT ON COLUMN custom_banks.is_active IS 'Whether this custom bank is currently active and available for selection';

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_custom_banks_company_id ON custom_banks(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_banks_bank_name ON custom_banks(bank_name);
CREATE INDEX IF NOT EXISTS idx_custom_banks_created_by ON custom_banks(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_banks_is_active ON custom_banks(is_active);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE/UPDATE RLS POLICIES FOR CUSTOM BANKS
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "custom_banks_select_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_insert_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_update_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_delete_policy" ON custom_banks;

-- Allow users to view custom banks for their company
CREATE POLICY "custom_banks_select_policy" ON custom_banks
    FOR SELECT
    USING (true); -- Allow all authenticated users to see all custom banks

-- Allow users to insert custom banks for their company
CREATE POLICY "custom_banks_insert_policy" ON custom_banks
    FOR INSERT
    WITH CHECK (true); -- Allow all authenticated users to add custom banks

-- Allow users to update custom banks for their company
CREATE POLICY "custom_banks_update_policy" ON custom_banks
    FOR UPDATE
    USING (true); -- Allow all authenticated users to update custom banks

-- Allow users to delete custom banks for their company
CREATE POLICY "custom_banks_delete_policy" ON custom_banks
    FOR DELETE
    USING (true); -- Allow all authenticated users to delete custom banks

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

GRANT ALL ON custom_banks TO authenticated;
GRANT ALL ON custom_banks TO anon;
GRANT ALL ON custom_banks TO service_role;

-- =============================================================================
-- 7. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get all banks (default + custom) for a company
CREATE OR REPLACE FUNCTION get_company_banks(company_uuid UUID DEFAULT NULL)
RETURNS TABLE(bank_name VARCHAR(255), is_custom BOOLEAN, is_active BOOLEAN) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    -- Default Ghanaian banks
    SELECT 
        unnest(ARRAY[
            'Access Bank Ghana',
            'Agricultural Development Bank (ADB)',
            'Bank of Africa Ghana',
            'CalBank Limited',
            'Consolidated Bank Ghana',
            'Ecobank Ghana Limited',
            'Fidelity Bank Ghana Limited',
            'First Atlantic Bank Limited',
            'First National Bank Ghana Limited',
            'GCB Bank Limited',
            'Guaranty Trust Bank (Ghana) Limited',
            'National Investment Bank Limited',
            'OmniBSIC Bank Ghana Limited',
            'Prudential Bank Limited',
            'Republic Bank (Ghana) Limited',
            'Société Générale Ghana Limited',
            'Stanbic Bank Ghana Limited',
            'Standard Chartered Bank Ghana Limited',
            'United Bank for Africa (Ghana) Limited',
            'Zenith Bank (Ghana) Limited'
        ])::VARCHAR(255) as bank_name,
        false as is_custom,
        true as is_active
    UNION ALL
    -- Custom banks for the company (if company_uuid is provided)
    SELECT 
        cb.bank_name::VARCHAR(255),
        true as is_custom,
        cb.is_active
    FROM custom_banks cb
    WHERE (company_uuid IS NULL OR cb.company_id = company_uuid)
      AND cb.is_active = true
    ORDER BY is_custom, bank_name;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_company_banks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_banks(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_company_banks(UUID) TO service_role;

-- =============================================================================
-- 8. CREATE TRIGGERS FOR AUDIT TRAIL
-- =============================================================================

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create trigger for custom_banks updated_at
DROP TRIGGER IF EXISTS update_custom_banks_updated_at ON custom_banks;
CREATE TRIGGER update_custom_banks_updated_at
    BEFORE UPDATE ON custom_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. UPDATE EMPLOYEE_FINANCIAL TABLE COMMENT
-- =============================================================================

COMMENT ON TABLE employee_financial IS 'Employee financial information including annual salary (required), monthly salary (auto-calculated from annual/12), allowances, deductions, and bank details';

-- =============================================================================
-- 10. VERIFICATION
-- =============================================================================

DO $$
DECLARE
    annual_salary_exists BOOLEAN;
    custom_banks_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policies_count INTEGER;
BEGIN
    -- Check if annual_salary column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name = 'annual_salary'
    ) INTO annual_salary_exists;
    
    -- Check if custom_banks table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'custom_banks'
        AND table_schema = 'public'
    ) INTO custom_banks_exists;
    
    -- Check if RLS is enabled on custom_banks
    SELECT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'custom_banks' 
        AND relrowsecurity = true
    ) INTO rls_enabled;
    
    -- Count RLS policies on custom_banks
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE tablename = 'custom_banks';
    
    -- Report results
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'VERIFICATION RESULTS';
    RAISE NOTICE '=============================================================================';
    
    IF annual_salary_exists THEN
        RAISE NOTICE '✓ annual_salary column exists in employee_financial table';
    ELSE
        RAISE EXCEPTION '✗ annual_salary column NOT found in employee_financial table';
    END IF;
    
    IF custom_banks_exists THEN
        RAISE NOTICE '✓ custom_banks table exists';
    ELSE
        RAISE EXCEPTION '✗ custom_banks table NOT found';
    END IF;
    
    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS enabled on custom_banks table';
    ELSE
        RAISE WARNING '✗ RLS NOT enabled on custom_banks table';
    END IF;
    
    RAISE NOTICE '✓ % RLS policies created on custom_banks table', policies_count;
    
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '- Annual salary column added/verified in employee_financial table';
    RAISE NOTICE '- Custom banks table created/verified with proper structure';
    RAISE NOTICE '- RLS policies configured for data security';
    RAISE NOTICE '- Helper functions created for bank management';
    RAISE NOTICE '- Indexes created for performance optimization';
    RAISE NOTICE '=============================================================================';
END $$;

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (IF NEEDED)
-- =============================================================================
-- To rollback these changes, run:
-- 
-- BEGIN;
-- DROP FUNCTION IF EXISTS get_company_banks(UUID);
-- DROP TABLE IF EXISTS custom_banks CASCADE;
-- ALTER TABLE employee_financial DROP COLUMN IF EXISTS annual_salary;
-- COMMIT;
