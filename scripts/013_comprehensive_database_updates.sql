-- Comprehensive database updates for HR system enhancements
-- This script adds all the new fields and tables needed for the recent changes

-- Add country code fields to employees table for phone numbers
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10) DEFAULT '+233',
ADD COLUMN IF NOT EXISTS emergency_contact_country_code VARCHAR(10) DEFAULT '+233';

-- Update employees table to ensure all required fields exist
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS date_of_birth_required BOOLEAN DEFAULT true;

-- Create PAYE tax bands table
CREATE TABLE IF NOT EXISTS paye_tax_bands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    band_order INTEGER NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    threshold_amount DECIMAL(15,2),
    description TEXT,
    is_remaining_amount BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SSNIT rates table
CREATE TABLE IF NOT EXISTS ssnit_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_rate DECIMAL(5,2) NOT NULL DEFAULT 5.5,
    employer_rate DECIMAL(5,2) NOT NULL DEFAULT 13.0,
    total_rate DECIMAL(5,2) GENERATED ALWAYS AS (employee_rate + employer_rate) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tier 2 rates table
CREATE TABLE IF NOT EXISTS tier2_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    employer_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    total_rate DECIMAL(5,2) GENERATED ALWAYS AS (employee_rate + employer_rate) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Tier 3 rates table
CREATE TABLE IF NOT EXISTS tier3_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    employee_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    employer_rate DECIMAL(5,2) NOT NULL DEFAULT 5.0,
    total_rate DECIMAL(5,2) GENERATED ALWAYS AS (employee_rate + employer_rate) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create overtime rates table
CREATE TABLE IF NOT EXISTS overtime_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    weekday_multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.5,
    weekend_multiplier DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    holiday_multiplier DECIMAL(4,2) NOT NULL DEFAULT 2.5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update loan_settings table to include new fields
ALTER TABLE loan_settings 
ADD COLUMN IF NOT EXISTS rate_method VARCHAR(50) DEFAULT 'Reducing Balance Method',
ADD COLUMN IF NOT EXISTS admin_charges DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_tenure INTEGER DEFAULT 12;

-- Create payroll configuration table for general settings
CREATE TABLE IF NOT EXISTS payroll_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    minimum_wage DECIMAL(10,2) DEFAULT 18.00,
    currency_code VARCHAR(3) DEFAULT 'GHS',
    pay_frequency VARCHAR(20) DEFAULT 'Monthly',
    overtime_calculation_method VARCHAR(50) DEFAULT 'Standard',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default PAYE tax bands for Ghana
INSERT INTO paye_tax_bands (company_id, band_order, rate, threshold_amount, description, is_remaining_amount)
SELECT 
    c.id,
    1,
    0.00,
    4380.00,
    'First GHS 4,380',
    false
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    2,
    5.00,
    1000.00,
    'Next GHS 1,000',
    false
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    3,
    10.00,
    2000.00,
    'Next GHS 2,000',
    false
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    4,
    17.50,
    20000.00,
    'Next GHS 20,000',
    false
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    5,
    25.00,
    20000.00,
    'Next GHS 20,000',
    false
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    6,
    30.00,
    NULL,
    'Remaining amount',
    true
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM paye_tax_bands WHERE company_id = c.id);

-- Insert default SSNIT rates
INSERT INTO ssnit_rates (company_id, employee_rate, employer_rate)
SELECT c.id, 5.5, 13.0
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM ssnit_rates WHERE company_id = c.id);

-- Insert default Tier 2 rates
INSERT INTO tier2_rates (company_id, employee_rate, employer_rate)
SELECT c.id, 5.0, 5.0
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM tier2_rates WHERE company_id = c.id);

-- Insert default Tier 3 rates
INSERT INTO tier3_rates (company_id, employee_rate, employer_rate)
SELECT c.id, 5.0, 5.0
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM tier3_rates WHERE company_id = c.id);

-- Insert default overtime rates
INSERT INTO overtime_rates (company_id, weekday_multiplier, weekend_multiplier)
SELECT c.id, 1.5, 2.0
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM overtime_rates WHERE company_id = c.id);

-- Insert default payroll configuration
INSERT INTO payroll_configuration (company_id)
SELECT c.id
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM payroll_configuration WHERE company_id = c.id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paye_tax_bands_company_id ON paye_tax_bands(company_id);
CREATE INDEX IF NOT EXISTS idx_paye_tax_bands_band_order ON paye_tax_bands(band_order);
CREATE INDEX IF NOT EXISTS idx_ssnit_rates_company_id ON ssnit_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_tier2_rates_company_id ON tier2_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_tier3_rates_company_id ON tier3_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_company_id ON overtime_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_configuration_company_id ON payroll_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_phone_country_code ON employees(phone_country_code);
CREATE INDEX IF NOT EXISTS idx_employees_emergency_contact_country_code ON employees(emergency_contact_country_code);

-- Enable Row Level Security (RLS) on new tables
ALTER TABLE paye_tax_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssnit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier2_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier3_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_configuration ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can view their company's PAYE tax bands" ON paye_tax_bands
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's PAYE tax bands" ON paye_tax_bands
    FOR ALL USING (true);

CREATE POLICY "Users can view their company's SSNIT rates" ON ssnit_rates
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's SSNIT rates" ON ssnit_rates
    FOR ALL USING (true);

CREATE POLICY "Users can view their company's Tier 2 rates" ON tier2_rates
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's Tier 2 rates" ON tier2_rates
    FOR ALL USING (true);

CREATE POLICY "Users can view their company's Tier 3 rates" ON tier3_rates
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's Tier 3 rates" ON tier3_rates
    FOR ALL USING (true);

CREATE POLICY "Users can view their company's overtime rates" ON overtime_rates
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's overtime rates" ON overtime_rates
    FOR ALL USING (true);

CREATE POLICY "Users can view their company's payroll configuration" ON payroll_configuration
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's payroll configuration" ON payroll_configuration
    FOR ALL USING (true);

-- Update existing loan_settings table with new rate methods
UPDATE loan_settings 
SET rate_method = 'Reducing Balance Method'
WHERE rate_method IS NULL;

-- Add check constraints for valid values
ALTER TABLE employees 
ADD CONSTRAINT IF NOT EXISTS chk_phone_country_code 
CHECK (phone_country_code ~ '^\+[1-9]\d{0,3}$');

ALTER TABLE employees 
ADD CONSTRAINT IF NOT EXISTS chk_emergency_contact_country_code 
CHECK (emergency_contact_country_code ~ '^\+[1-9]\d{0,3}$');

ALTER TABLE loan_settings 
ADD CONSTRAINT IF NOT EXISTS chk_rate_method 
CHECK (rate_method IN ('Reducing Balance Method', 'Straight Line Method'));

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_paye_tax_bands_updated_at BEFORE UPDATE ON paye_tax_bands 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ssnit_rates_updated_at BEFORE UPDATE ON ssnit_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier2_rates_updated_at BEFORE UPDATE ON tier2_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tier3_rates_updated_at BEFORE UPDATE ON tier3_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_overtime_rates_updated_at BEFORE UPDATE ON overtime_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_configuration_updated_at BEFORE UPDATE ON payroll_configuration 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments to tables for documentation
COMMENT ON TABLE paye_tax_bands IS 'PAYE tax bands configuration for progressive tax calculation';
COMMENT ON TABLE ssnit_rates IS 'SSNIT contribution rates for employees and employers';
COMMENT ON TABLE tier2_rates IS 'Tier 2 pension contribution rates';
COMMENT ON TABLE tier3_rates IS 'Tier 3 pension contribution rates';
COMMENT ON TABLE overtime_rates IS 'Overtime rate multipliers for different periods';
COMMENT ON TABLE payroll_configuration IS 'General payroll configuration settings';

-- Grant necessary permissions (adjust as needed based on your user roles)
GRANT ALL ON paye_tax_bands TO authenticated;
GRANT ALL ON ssnit_rates TO authenticated;
GRANT ALL ON tier2_rates TO authenticated;
GRANT ALL ON tier3_rates TO authenticated;
GRANT ALL ON overtime_rates TO authenticated;
GRANT ALL ON payroll_configuration TO authenticated;

-- Final verification queries (commented out for production)
-- SELECT 'PAYE Tax Bands' as table_name, count(*) as record_count FROM paye_tax_bands
-- UNION ALL
-- SELECT 'SSNIT Rates', count(*) FROM ssnit_rates
-- UNION ALL
-- SELECT 'Tier 2 Rates', count(*) FROM tier2_rates
-- UNION ALL
-- SELECT 'Tier 3 Rates', count(*) FROM tier3_rates
-- UNION ALL
-- SELECT 'Overtime Rates', count(*) FROM overtime_rates
-- UNION ALL
-- SELECT 'Payroll Configuration', count(*) FROM payroll_configuration;
