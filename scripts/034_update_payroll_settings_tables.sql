-- Payroll Settings Configuration Tables
-- This script updates payroll tables to support all settings page features

-- Update payroll_configuration table to add missing columns
ALTER TABLE payroll_configuration 
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pay_frequency VARCHAR(20) DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS payroll_cutoff_day INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS auto_calculate_paye BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_calculate_ssnit BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_calculate_tier3 BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Tax Configuration table for managing tax rates and bands
CREATE TABLE IF NOT EXISTS tax_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  country_code VARCHAR(10) DEFAULT 'GH',
  currency_code VARCHAR(10) DEFAULT 'GHS',
  
  -- SSNIT Rates
  ssnit_employee_rate NUMERIC(5, 2) DEFAULT 5.5,
  ssnit_employer_rate NUMERIC(5, 2) DEFAULT 13.0,
  
  -- Tier 2 Rates
  tier2_employee_rate NUMERIC(5, 2) DEFAULT 0.0,
  tier2_employer_rate NUMERIC(5, 2) DEFAULT 0.0,
  
  -- Tier 3 Rates
  tier3_employee_rate NUMERIC(5, 2) DEFAULT 0.0,
  tier3_employer_rate NUMERIC(5, 2) DEFAULT 0.0,
  
  -- API Integration
  api_connected BOOLEAN DEFAULT false,
  last_api_sync TIMESTAMPTZ,
  api_version VARCHAR(50),
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Update payroll_allowances to add subsidiary support
ALTER TABLE payroll_allowances
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT false;

-- Update payroll_deductions to add subsidiary support
ALTER TABLE payroll_deductions
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT true;

-- Loan Settings table (if not exists, otherwise update)
ALTER TABLE loan_settings
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tax_config_company ON tax_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_config_subsidiary ON tax_configuration(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_payroll_config_subsidiary ON payroll_configuration(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_allowances_subsidiary ON payroll_allowances(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_deductions_subsidiary ON payroll_deductions(subsidiary_id);

-- Enable RLS
ALTER TABLE tax_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to tax_configuration" ON tax_configuration FOR ALL USING (true) WITH CHECK (true);

-- Update trigger
CREATE TRIGGER update_tax_configuration_updated_at BEFORE UPDATE ON tax_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_configuration_updated_at BEFORE UPDATE ON payroll_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
