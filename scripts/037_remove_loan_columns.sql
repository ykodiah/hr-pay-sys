-- Remove Loan Columns from Employee Financial Table
-- This script removes the loan-related columns that are no longer needed
-- since we removed the loan details section from the financial form

-- =============================================================================
-- 1. BACKUP EXISTING DATA (OPTIONAL)
-- =============================================================================

-- Create a backup table with loan data before removing columns
CREATE TABLE IF NOT EXISTS employee_financial_loan_backup AS
SELECT 
    id,
    employee_id,
    loan_amount,
    loan_balance,
    loan_installment,
    loan_start_date,
    loan_end_date,
    created_at
FROM employee_financial
WHERE loan_amount IS NOT NULL 
   OR loan_balance IS NOT NULL 
   OR loan_installment IS NOT NULL 
   OR loan_start_date IS NOT NULL 
   OR loan_end_date IS NOT NULL;

-- Add comment to backup table
COMMENT ON TABLE employee_financial_loan_backup IS 'Backup of loan data before removing loan columns from employee_financial';

-- =============================================================================
-- 2. REMOVE LOAN-RELATED COLUMNS
-- =============================================================================

-- Drop loan-related columns from employee_financial table
ALTER TABLE employee_financial 
DROP COLUMN IF EXISTS loan_amount,
DROP COLUMN IF EXISTS loan_balance,
DROP COLUMN IF EXISTS loan_installment,
DROP COLUMN IF EXISTS loan_start_date,
DROP COLUMN IF EXISTS loan_end_date;

-- =============================================================================
-- 3. UPDATE TABLE COMMENTS
-- =============================================================================

-- Update table comment to reflect the removal of loan details
COMMENT ON TABLE employee_financial IS 'Employee financial information including salary, allowances, deductions, and bank details. Loan details have been removed.';

-- =============================================================================
-- 4. VERIFICATION
-- =============================================================================

-- Verify that loan columns have been removed
DO $$
DECLARE
    loan_columns_exist BOOLEAN;
BEGIN
    -- Check if any loan columns still exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employee_financial' 
        AND column_name IN ('loan_amount', 'loan_balance', 'loan_installment', 'loan_start_date', 'loan_end_date')
    ) INTO loan_columns_exist;
    
    IF loan_columns_exist THEN
        RAISE EXCEPTION 'Some loan columns still exist in employee_financial table';
    ELSE
        RAISE NOTICE 'All loan columns successfully removed from employee_financial table';
    END IF;
END $$;

-- =============================================================================
-- 5. CLEANUP (OPTIONAL)
-- =============================================================================

-- If you want to keep the backup table, comment out the following line
-- DROP TABLE IF EXISTS employee_financial_loan_backup;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log completion
INSERT INTO public.migration_log (migration_name, executed_at, description)
VALUES (
    '037_remove_loan_columns',
    NOW(),
    'Removed loan-related columns from employee_financial table as loan details section was removed from the form'
) ON CONFLICT DO NOTHING;
