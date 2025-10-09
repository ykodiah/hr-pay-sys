-- Employee Financial Updates Migration
-- This script updates the employee_financial table and adds custom banks functionality
-- Run this script to apply all the changes made to the employee financial form

-- =============================================================================
-- 1. ADD ANNUAL SALARY COLUMN TO EMPLOYEE_FINANCIAL TABLE
-- =============================================================================

-- Add annual_salary column to employee_financial table
ALTER TABLE employee_financial 
ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12,2);

-- Add comment to the column
COMMENT ON COLUMN employee_financial.annual_salary IS 'Annual salary in GHS - used to calculate monthly salary';

-- =============================================================================
-- 2. CREATE CUSTOM BANKS TABLE
-- =============================================================================

-- Create custom banks table for company-specific bank additions
CREATE TABLE IF NOT EXISTS custom_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique bank names per company
    UNIQUE(company_id, bank_name)
);

-- Add comments to the table and columns
COMMENT ON TABLE custom_banks IS 'Custom banks added by companies that are not in the default bank list';
COMMENT ON COLUMN custom_banks.company_id IS 'Reference to the company that added this bank';
COMMENT ON COLUMN custom_banks.bank_name IS 'Name of the custom bank';
COMMENT ON COLUMN custom_banks.created_by IS 'User who added this custom bank';

-- =============================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Create indexes for custom_banks table
CREATE INDEX IF NOT EXISTS idx_custom_banks_company_id ON custom_banks(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_banks_bank_name ON custom_banks(bank_name);
CREATE INDEX IF NOT EXISTS idx_custom_banks_created_by ON custom_banks(created_by);

-- Create index for annual_salary column
CREATE INDEX IF NOT EXISTS idx_employee_financial_annual_salary ON employee_financial(annual_salary);

-- =============================================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on custom_banks table
ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 5. CREATE RLS POLICIES FOR CUSTOM BANKS
-- =============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "custom_banks_select_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_insert_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_update_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_delete_policy" ON custom_banks;

-- Create RLS policies for custom_banks
CREATE POLICY "custom_banks_select_policy" ON custom_banks
    FOR SELECT
    USING (
        is_authenticated() AND 
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "custom_banks_insert_policy" ON custom_banks
    FOR INSERT
    WITH CHECK (
        is_authenticated() AND 
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "custom_banks_update_policy" ON custom_banks
    FOR UPDATE
    USING (
        is_authenticated() AND 
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "custom_banks_delete_policy" ON custom_banks
    FOR DELETE
    USING (
        is_authenticated() AND 
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM employees 
                WHERE id = auth.uid()
            )
        )
    );

-- =============================================================================
-- 6. GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions on custom_banks table
GRANT ALL ON custom_banks TO authenticated;
GRANT ALL ON custom_banks TO anon;

-- =============================================================================
-- 7. UPDATE EXISTING DATA (OPTIONAL)
-- =============================================================================

-- If you want to populate annual_salary from existing monthly_salary data
-- Uncomment the following lines:
-- UPDATE employee_financial 
-- SET annual_salary = monthly_salary * 12 
-- WHERE annual_salary IS NULL AND monthly_salary IS NOT NULL;

-- =============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- =============================================================================

-- Function to get all banks (default + custom) for a company
CREATE OR REPLACE FUNCTION get_company_banks(company_uuid UUID)
RETURNS TABLE(bank_name VARCHAR(255), is_custom BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    -- Default Ghanaian banks
    SELECT 
        unnest(ARRAY[
            'Access Bank',
            'Agricultural Development Bank',
            'Bank of Africa',
            'CalBank',
            'Consolidated Bank Ghana',
            'Ecobank Ghana',
            'Fidelity Bank Ghana',
            'First Atlantic Bank',
            'First National Bank Ghana Limited',
            'GCB Bank Limited',
            'Guaranty Trust Bank Ghana',
            'National Investment Bank',
            'OmniBSIC Bank',
            'Prudential Bank Ghana',
            'Republic Bank Ghana',
            'Societe Generale Ghana',
            'Stanbic Bank Ghana',
            'Standard Chartered Bank Ghana',
            'United Bank for Africa Ghana',
            'Zenith Bank Ghana'
        ])::VARCHAR(255) as bank_name,
        false as is_custom
    UNION ALL
    -- Custom banks for the company
    SELECT 
        cb.bank_name,
        true as is_custom
    FROM custom_banks cb
    WHERE cb.company_id = company_uuid
    ORDER BY is_custom, bank_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_company_banks(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_banks(UUID) TO anon;

-- =============================================================================
-- 9. CREATE TRIGGERS FOR AUDIT TRAIL
-- =============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom_banks updated_at
DROP TRIGGER IF EXISTS update_custom_banks_updated_at ON custom_banks;
CREATE TRIGGER update_custom_banks_updated_at
    BEFORE UPDATE ON custom_banks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 10. VERIFICATION QUERIES
-- =============================================================================

-- Verify the changes
DO $$
BEGIN
    -- Check if annual_salary column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name = 'annual_salary'
    ) THEN
        RAISE EXCEPTION 'annual_salary column not found in employee_financial table';
    END IF;
    
    -- Check if custom_banks table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'custom_banks'
    ) THEN
        RAISE EXCEPTION 'custom_banks table not found';
    END IF;
    
    -- Check if RLS is enabled on custom_banks
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'custom_banks' 
        AND relrowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on custom_banks table';
    END IF;
    
    RAISE NOTICE 'Employee financial updates migration completed successfully!';
END $$;

-- =============================================================================
-- 11. SAMPLE DATA FOR TESTING (OPTIONAL)
-- =============================================================================

-- Insert sample custom banks for testing (uncomment if needed)
-- INSERT INTO custom_banks (company_id, bank_name, created_by)
-- SELECT 
--     c.id as company_id,
--     'Sample Custom Bank ' || c.name as bank_name,
--     (SELECT id FROM auth.users LIMIT 1) as created_by
-- FROM companies c
-- LIMIT 1;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log completion
INSERT INTO public.migration_log (migration_name, executed_at, description)
VALUES (
    '036_employee_financial_updates',
    NOW(),
    'Added annual_salary column to employee_financial, created custom_banks table, and updated bank management functionality'
) ON CONFLICT DO NOTHING;