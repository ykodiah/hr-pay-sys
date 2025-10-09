-- Employee Financial Updates Migration
-- This migration adds annual salary support and custom banks functionality

-- Add annual_salary column to employee_financial table
ALTER TABLE employee_financial 
ADD COLUMN IF NOT EXISTS annual_salary DECIMAL(12,2);

-- Add comment to the column
COMMENT ON COLUMN employee_financial.annual_salary IS 'Annual salary in GHS - used to calculate monthly salary';

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_banks_company_id ON custom_banks(company_id);
CREATE INDEX IF NOT EXISTS idx_custom_banks_bank_name ON custom_banks(bank_name);
CREATE INDEX IF NOT EXISTS idx_custom_banks_created_by ON custom_banks(created_by);
CREATE INDEX IF NOT EXISTS idx_employee_financial_annual_salary ON employee_financial(annual_salary);

-- Enable RLS on custom_banks table
ALTER TABLE custom_banks ENABLE ROW LEVEL SECURITY;

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

-- Grant permissions on custom_banks table
GRANT ALL ON custom_banks TO authenticated;
GRANT ALL ON custom_banks TO anon;

-- Create helper function to get all banks (default + custom) for a company
CREATE OR REPLACE FUNCTION get_company_banks(company_uuid UUID)
RETURNS TABLE(bank_name VARCHAR(255), is_custom BOOLEAN) AS $$
BEGIN
    RETURN QUERY
    -- Default Ghanaian banks (updated list with First National Bank Ghana Limited)
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