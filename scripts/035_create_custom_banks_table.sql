-- Create custom banks table for company-specific bank additions
-- This table allows companies to add their own banks that are not in the default list

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_banks_company_id ON custom_banks(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_banks_bank_name ON custom_banks(bank_name);

-- Enable RLS
ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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

-- Grant permissions
GRANT ALL ON custom_banks TO authenticated;

-- Add annual_salary column to employee_financial table
ALTER TABLE employee_financial 
ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12,2);

-- Update the monthly_salary to be calculated from annual_salary
-- We'll handle this in the application logic
