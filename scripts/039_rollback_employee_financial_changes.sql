-- Rollback Employee Financial Changes
-- This script reverts all changes made to the employee financial form
-- Use this script if you need to rollback the employee financial updates

-- =============================================================================
-- ROLLBACK OVERVIEW
-- =============================================================================
-- 1. Restore loan-related columns to employee_financial table
-- 2. Drop custom_banks table
-- 3. Remove annual_salary column from employee_financial table
-- 4. Clean up helper functions and triggers

-- =============================================================================
-- 1. RESTORE LOAN-RELATED COLUMNS
-- =============================================================================

-- Add back loan-related columns to employee_financial table
ALTER TABLE employee_financial 
ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_balance DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_installment DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_start_date DATE,
ADD COLUMN IF NOT EXISTS loan_end_date DATE;

-- Restore data from backup table if it exists
UPDATE employee_financial 
SET 
    loan_amount = backup.loan_amount,
    loan_balance = backup.loan_balance,
    loan_installment = backup.loan_installment,
    loan_start_date = backup.loan_start_date,
    loan_end_date = backup.loan_end_date
FROM employee_financial_loan_backup backup
WHERE employee_financial.id = backup.id;

-- =============================================================================
-- 2. DROP CUSTOM BANKS TABLE
-- =============================================================================

-- Drop RLS policies first
DROP POLICY IF EXISTS "custom_banks_select_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_insert_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_update_policy" ON custom_banks;
DROP POLICY IF EXISTS "custom_banks_delete_policy" ON custom_banks;

-- Drop triggers
DROP TRIGGER IF EXISTS update_custom_banks_updated_at ON custom_banks;

-- Drop the custom_banks table
DROP TABLE IF EXISTS custom_banks CASCADE;

-- =============================================================================
-- 3. REMOVE ANNUAL SALARY COLUMN
-- =============================================================================

-- Drop the annual_salary column
ALTER TABLE employee_financial 
DROP COLUMN IF EXISTS annual_salary;

-- Drop the index
DROP INDEX IF EXISTS idx_employee_financial_annual_salary;

-- =============================================================================
-- 4. DROP HELPER FUNCTIONS
-- =============================================================================

-- Drop the helper function
DROP FUNCTION IF EXISTS get_company_banks(UUID);

-- Drop the trigger function (only if not used elsewhere)
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- =============================================================================
-- 5. DROP INDEXES
-- =============================================================================

-- Drop custom_banks indexes
DROP INDEX IF EXISTS idx_custom_banks_company_id;
DROP INDEX IF EXISTS idx_custom_banks_bank_name;
DROP INDEX IF EXISTS idx_custom_banks_created_by;

-- =============================================================================
-- 6. RESTORE ORIGINAL TABLE COMMENTS
-- =============================================================================

-- Restore original table comment
COMMENT ON TABLE employee_financial IS 'Employee financial information including salary, allowances, deductions, loan details, and bank details.';

-- =============================================================================
-- 7. VERIFICATION
-- =============================================================================

-- Verify rollback
DO $$
DECLARE
    annual_salary_exists BOOLEAN;
    custom_banks_exists BOOLEAN;
    loan_columns_exist BOOLEAN;
BEGIN
    -- Check if annual_salary column still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name = 'annual_salary'
    ) INTO annual_salary_exists;
    
    -- Check if custom_banks table still exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'custom_banks'
    ) INTO custom_banks_exists;
    
    -- Check if loan columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name IN ('loan_amount', 'loan_balance', 'loan_installment', 'loan_start_date', 'loan_end_date')
    ) INTO loan_columns_exist;
    
    -- Report results
    IF annual_salary_exists THEN
        RAISE EXCEPTION 'annual_salary column still exists in employee_financial table';
    END IF;
    
    IF custom_banks_exists THEN
        RAISE EXCEPTION 'custom_banks table still exists';
    END IF;
    
    IF NOT loan_columns_exist THEN
        RAISE EXCEPTION 'Loan columns not restored in employee_financial table';
    END IF;
    
    RAISE NOTICE 'Employee financial rollback completed successfully!';
    RAISE NOTICE 'Changes reverted:';
    RAISE NOTICE '- Removed annual_salary column from employee_financial table';
    RAISE NOTICE '- Dropped custom_banks table';
    RAISE NOTICE '- Restored loan-related columns to employee_financial table';
    RAISE NOTICE '- Cleaned up helper functions and triggers';
END $$;

-- =============================================================================
-- 8. CLEANUP BACKUP TABLE (OPTIONAL)
-- =============================================================================

-- Drop the backup table (uncomment if you want to remove it)
-- DROP TABLE IF EXISTS employee_financial_loan_backup;

-- =============================================================================
-- ROLLBACK COMPLETE
-- =============================================================================

-- Log rollback
INSERT INTO public.migration_log (migration_name, executed_at, description)
VALUES (
    '039_rollback_employee_financial_changes',
    NOW(),
    'Rollback: Reverted all employee financial changes including annual_salary, custom_banks, and loan columns'
) ON CONFLICT DO NOTHING;

-- Final success message
SELECT 'Employee Financial Rollback Completed Successfully!' as status;