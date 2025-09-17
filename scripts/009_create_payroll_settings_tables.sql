-- Create payroll allowances table
CREATE TABLE IF NOT EXISTS payroll_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    taxable BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT true,
    amount DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'FIXED' CHECK (type IN ('FIXED', 'VARIABLE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- Create payroll deductions table
CREATE TABLE IF NOT EXISTS payroll_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    taxable BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT true,
    amount DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'FIXED' CHECK (type IN ('FIXED', 'VARIABLE')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- Create loan settings table
CREATE TABLE IF NOT EXISTS loan_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    taxable BOOLEAN DEFAULT false,
    recurring BOOLEAN DEFAULT true,
    max_amount DECIMAL(12,2) DEFAULT 0,
    interest_rate DECIMAL(5,2) DEFAULT 0,
    type VARCHAR(20) DEFAULT 'FIXED' CHECK (type IN ('FIXED', 'VARIABLE')),
    max_repayment_months INTEGER DEFAULT 12,
    auto_deduct BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_company_id ON payroll_allowances(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_active ON payroll_allowances(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_company_id ON payroll_deductions(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_active ON payroll_deductions(is_active);
CREATE INDEX IF NOT EXISTS idx_loan_settings_company_id ON loan_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_loan_settings_active ON loan_settings(is_active);

-- Insert default allowances
INSERT INTO payroll_allowances (company_id, code, description, taxable, recurring, amount, percentage, type) VALUES
('00000000-0000-0000-0000-000000000001', 'TRANS', 'Transport Allowance', true, true, 0, 0, 'FIXED'),
('00000000-0000-0000-0000-000000000001', 'HOUSE', 'Housing Allowance', true, true, 0, 0, 'FIXED'),
('00000000-0000-0000-0000-000000000001', 'MED', 'Medical Allowance', false, true, 0, 0, 'FIXED')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert default deductions
INSERT INTO payroll_deductions (company_id, code, description, taxable, recurring, amount, percentage, type) VALUES
('00000000-0000-0000-0000-000000000001', 'TAX', 'Tax Deduction', false, true, 0, 0, 'VARIABLE'),
('00000000-0000-0000-0000-000000000001', 'SSNIT', 'SSNIT Deduction', false, true, 0, 5.5, 'VARIABLE'),
('00000000-0000-0000-0000-000000000001', 'LOAN', 'Loan Deduction', false, true, 0, 0, 'FIXED')
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert default loan settings
INSERT INTO loan_settings (company_id, code, description, taxable, recurring, max_amount, interest_rate, type) VALUES
('00000000-0000-0000-0000-000000000001', 'PERSONAL', 'Personal Loan', false, true, 50000, 10, 'FIXED'),
('00000000-0000-0000-0000-000000000001', 'EMERGENCY', 'Emergency Loan', false, false, 10000, 5, 'FIXED')
ON CONFLICT (company_id, code) DO NOTHING;
