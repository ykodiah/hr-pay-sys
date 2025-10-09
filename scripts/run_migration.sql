-- Quick Migration Script for Employee Financial Updates
-- Copy and paste this into your Supabase SQL Editor

-- 1. Add annual_salary column
ALTER TABLE employee_financial 
ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12,2);

-- 2. Create custom_banks table
CREATE TABLE IF NOT EXISTS custom_banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    bank_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE(company_id, bank_name)
);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_banks_company_id ON custom_banks(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_financial_annual_salary ON employee_financial(annual_salary);

-- 4. Enable RLS
ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
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

-- 6. Grant permissions
GRANT ALL ON custom_banks TO authenticated;
GRANT ALL ON custom_banks TO anon;

-- 7. Remove loan columns (optional - uncomment if you want to remove them)
-- ALTER TABLE employee_financial 
-- DROP COLUMN IF EXISTS loan_amount,
-- DROP COLUMN IF EXISTS loan_balance,
-- DROP COLUMN IF EXISTS loan_installment,
-- DROP COLUMN IF EXISTS loan_start_date,
-- DROP COLUMN IF EXISTS loan_end_date;

-- Success message
SELECT 'Migration completed successfully!' as status;
