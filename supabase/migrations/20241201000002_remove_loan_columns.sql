-- Remove Loan Columns Migration
-- This migration removes loan-related columns from employee_financial table

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

-- Drop loan-related columns from employee_financial table
ALTER TABLE employee_financial 
DROP COLUMN IF EXISTS loan_amount,
DROP COLUMN IF EXISTS loan_balance,
DROP COLUMN IF EXISTS loan_installment,
DROP COLUMN IF EXISTS loan_start_date,
DROP COLUMN IF EXISTS loan_end_date;

-- Update table comment to reflect the removal of loan details
COMMENT ON TABLE employee_financial IS 'Employee financial information including annual salary, monthly salary (auto-calculated), allowances, deductions, and bank details. Loan details have been removed.';