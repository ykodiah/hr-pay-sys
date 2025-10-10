-- Update loan_settings table to match the new loan-specific fields
-- Adding loan-specific columns to replace generic table structure

-- Drop existing loan_settings table if it exists and recreate with proper structure
DROP TABLE IF EXISTS loan_settings CASCADE;

-- Create updated loan_settings table with loan-specific fields
CREATE TABLE loan_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    maximum_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    interest_rate DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage with 2 decimal places
    rate_method VARCHAR(50) NOT NULL DEFAULT 'Reducing Balance Method' CHECK (rate_method IN ('Reducing Balance Method', 'Straight Line Method')),
    admin_charges DECIMAL(15,2) NOT NULL DEFAULT 0,
    loan_tenure INTEGER NOT NULL DEFAULT 12, -- In months
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique code per company
    UNIQUE(company_id, code)
);

-- Create indexes for better performance
CREATE INDEX idx_loan_settings_company_id ON loan_settings(company_id);
CREATE INDEX idx_loan_settings_code ON loan_settings(code);
CREATE INDEX idx_loan_settings_active ON loan_settings(is_active);

-- Add RLS policies for loan_settings
ALTER TABLE loan_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to manage loan settings
CREATE POLICY "Users can manage loan settings" ON loan_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert some default loan types for demonstration
INSERT INTO loan_settings (company_id, code, description, maximum_amount, interest_rate, rate_method, admin_charges, loan_tenure) VALUES
('00000000-0000-0000-0000-000000000001', 'SAL001', 'Salary Advance', 50000.00, 0.00, 'Straight Line Method', 0.00, 3),
('00000000-0000-0000-0000-000000000001', 'PER001', 'Personal Loan', 200000.00, 15.00, 'Reducing Balance Method', 500.00, 24),
('00000000-0000-0000-0000-000000000001', 'EDU001', 'Education Loan', 100000.00, 10.00, 'Reducing Balance Method', 200.00, 36),
('00000000-0000-0000-0000-000000000001', 'EMG001', 'Emergency Loan', 30000.00, 5.00, 'Straight Line Method', 100.00, 6);

-- Update employee_loans table to reference loan_settings
ALTER TABLE employee_loans 
ADD COLUMN IF NOT EXISTS loan_setting_id UUID REFERENCES loan_settings(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_employee_loans_setting_id ON employee_loans(loan_setting_id);
