-- Create tax rate management tables for different countries
CREATE TABLE IF NOT EXISTS tax_rate_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  tax_year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id, country_code, tax_year)
);

-- Create PAYE tax bands table
CREATE TABLE IF NOT EXISTS paye_tax_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_config_id UUID REFERENCES tax_rate_configurations(id) ON DELETE CASCADE,
  band_order INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  threshold_amount NUMERIC(15,2) NOT NULL,
  band_type VARCHAR(20) DEFAULT 'standard', -- 'standard', 'remaining'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create SSNIT rates table
CREATE TABLE IF NOT EXISTS ssnit_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_config_id UUID REFERENCES tax_rate_configurations(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL,
  employee_rate NUMERIC(5,2) NOT NULL,
  employer_rate NUMERIC(5,2) NOT NULL,
  ceiling_amount NUMERIC(15,2),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Ghana tax configuration for 2024
INSERT INTO tax_rate_configurations (company_id, country_code, currency_code, tax_year, is_active)
SELECT id, 'GHA', 'GHS', 2024, true FROM companies
ON CONFLICT (company_id, country_code, tax_year) DO NOTHING;

-- Insert Ghana PAYE tax bands for 2024 (monthly)
WITH ghana_config AS (
  SELECT trc.id as config_id FROM tax_rate_configurations trc
  JOIN companies c ON c.id = trc.company_id
  WHERE trc.country_code = 'GHA' AND trc.tax_year = 2024
)
INSERT INTO paye_tax_bands (tax_config_id, band_order, percentage, threshold_amount, band_type, description)
SELECT 
  gc.config_id,
  band_data.band_order,
  band_data.percentage,
  band_data.threshold_amount,
  band_data.band_type,
  band_data.description
FROM ghana_config gc
CROSS JOIN (
  VALUES 
    (1, 0, 490, 'standard', 'First GHS 490'),
    (2, 5, 110, 'standard', 'Next GHS 110'),
    (3, 10, 130, 'standard', 'Next GHS 130'),
    (4, 17.5, 3167, 'standard', 'Next GHS 3,167'),
    (5, 25, 16000, 'standard', 'Next GHS 16,000'),
    (6, 30, 30520, 'standard', 'Next GHS 30,520'),
    (7, 35, 50000, 'standard', 'Next GHS 50,000'),
    (8, 0, 0, 'remaining', 'Remaining amount')
) AS band_data(band_order, percentage, threshold_amount, band_type, description)
ON CONFLICT DO NOTHING;

-- Insert Ghana SSNIT rates for 2024
WITH ghana_config AS (
  SELECT trc.id as config_id FROM tax_rate_configurations trc
  JOIN companies c ON c.id = trc.company_id
  WHERE trc.country_code = 'GHA' AND trc.tax_year = 2024
)
INSERT INTO ssnit_rates (tax_config_id, tier_number, employee_rate, employer_rate, ceiling_amount, description)
SELECT 
  gc.config_id,
  ssnit_data.tier_number,
  ssnit_data.employee_rate,
  ssnit_data.employer_rate,
  ssnit_data.ceiling_amount,
  ssnit_data.description
FROM ghana_config gc
CROSS JOIN (
  VALUES 
    (1, 5.5, 13.0, NULL, 'SSNIT Tier 1'),
    (2, 5.0, 0.0, NULL, 'SSNIT Tier 2'),
    (3, 5.0, 0.0, NULL, 'SSNIT Tier 3 (Provident Fund)')
) AS ssnit_data(tier_number, employee_rate, employer_rate, ceiling_amount, description)
ON CONFLICT DO NOTHING;

-- Insert Nigeria tax configuration for 2024
INSERT INTO tax_rate_configurations (company_id, country_code, currency_code, tax_year, is_active)
SELECT id, 'NGA', 'NGN', 2024, true FROM companies
ON CONFLICT (company_id, country_code, tax_year) DO NOTHING;

-- Insert Nigeria PAYE tax bands for 2024 (monthly)
WITH nigeria_config AS (
  SELECT trc.id as config_id FROM tax_rate_configurations trc
  JOIN companies c ON c.id = trc.company_id
  WHERE trc.country_code = 'NGA' AND trc.tax_year = 2024
)
INSERT INTO paye_tax_bands (tax_config_id, band_order, percentage, threshold_amount, band_type, description)
SELECT 
  nc.config_id,
  band_data.band_order,
  band_data.percentage,
  band_data.threshold_amount,
  band_data.band_type,
  band_data.description
FROM nigeria_config nc
CROSS JOIN (
  VALUES 
    (1, 7, 25000, 'standard', 'First NGN 25,000'),
    (2, 11, 25000, 'standard', 'Next NGN 25,000'),
    (3, 15, 41667, 'standard', 'Next NGN 41,667'),
    (4, 19, 41667, 'standard', 'Next NGN 41,667'),
    (5, 21, 133333, 'standard', 'Next NGN 133,333'),
    (6, 24, 0, 'remaining', 'Remaining amount')
) AS band_data(band_order, percentage, threshold_amount, band_type, description)
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE tax_rate_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paye_tax_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssnit_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's tax configurations" ON tax_rate_configurations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's tax configurations" ON tax_rate_configurations
  FOR ALL USING (true);

CREATE POLICY "Users can view PAYE tax bands" ON paye_tax_bands
  FOR SELECT USING (true);

CREATE POLICY "Users can manage PAYE tax bands" ON paye_tax_bands
  FOR ALL USING (true);

CREATE POLICY "Users can view SSNIT rates" ON ssnit_rates
  FOR SELECT USING (true);

CREATE POLICY "Users can manage SSNIT rates" ON ssnit_rates
  FOR ALL USING (true);
