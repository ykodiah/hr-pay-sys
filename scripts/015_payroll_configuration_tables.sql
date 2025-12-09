-- Create comprehensive payroll configuration tables with currency support
CREATE TABLE IF NOT EXISTS payroll_configuration (
  id SERIAL PRIMARY KEY,
  company_id INTEGER DEFAULT 1,
  currency_code VARCHAR(3) DEFAULT 'GHS',
  currency_symbol VARCHAR(5) DEFAULT 'GH¢',
  minimum_wage DECIMAL(10,2) DEFAULT 18.00,
  overtime_weekday_multiplier DECIMAL(3,2) DEFAULT 1.5,
  overtime_weekend_multiplier DECIMAL(3,2) DEFAULT 2.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default payroll configuration
INSERT INTO payroll_configuration (company_id, currency_code, currency_symbol, minimum_wage, overtime_weekday_multiplier, overtime_weekend_multiplier)
VALUES (1, 'GHS', 'GH¢', 18.00, 1.5, 2.0)
ON CONFLICT (id) DO NOTHING;

-- Create currency exchange rates table for multi-currency support
CREATE TABLE IF NOT EXISTS currency_rates (
  id SERIAL PRIMARY KEY,
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  exchange_rate DECIMAL(10,6) NOT NULL,
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_currency, to_currency, effective_date)
);

-- Insert default currency rates
INSERT INTO currency_rates (from_currency, to_currency, exchange_rate) VALUES
('GHS', 'USD', 0.082),
('USD', 'GHS', 12.20),
('GHS', 'EUR', 0.076),
('EUR', 'GHS', 13.15),
('GHS', 'GBP', 0.065),
('GBP', 'GHS', 15.38)
ON CONFLICT (from_currency, to_currency, effective_date) DO NOTHING;

-- Create function to update currency throughout system
CREATE OR REPLACE FUNCTION update_system_currency(new_currency_code VARCHAR(3), new_currency_symbol VARCHAR(5))
RETURNS VOID AS $$
BEGIN
  -- Update payroll configuration
  UPDATE payroll_configuration 
  SET currency_code = new_currency_code, 
      currency_symbol = new_currency_symbol,
      updated_at = NOW()
  WHERE company_id = 1;
  
  -- Update salary grades
  UPDATE salary_grades 
  SET currency_code = new_currency_code,
      updated_at = NOW();
      
  -- Update employee salaries display (this would be handled in application layer)
  -- The application will use the currency_code and currency_symbol for display
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE payroll_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE currency_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON payroll_configuration FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON currency_rates FOR ALL USING (true);
