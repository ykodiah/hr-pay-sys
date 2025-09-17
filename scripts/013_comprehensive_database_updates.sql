-- Comprehensive database updates for HR system enhancements
-- This script adds all the necessary tables and fields for the enhanced HR system

-- Enable RLS and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tax configuration tables
CREATE TABLE IF NOT EXISTS public.tax_configuration (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    config_type VARCHAR(50) NOT NULL, -- 'paye', 'ssnit', 'tier2', 'tier3'
    config_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- 2. Create PAYE tax bands table
CREATE TABLE IF NOT EXISTS public.paye_tax_bands (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    band_order INTEGER NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    threshold_amount NUMERIC(15,2),
    description VARCHAR(255),
    is_remaining_amount BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create tax rates table (SSNIT, Tier 2, Tier 3)
CREATE TABLE IF NOT EXISTS public.tax_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    rate_type VARCHAR(20) NOT NULL, -- 'ssnit', 'tier2', 'tier3'
    employee_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    employer_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    total_rate NUMERIC(5,2) GENERATED ALWAYS AS (employee_rate + employer_rate) STORED,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create overtime rates table
CREATE TABLE IF NOT EXISTS public.overtime_rates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    rate_type VARCHAR(20) NOT NULL, -- 'weekday', 'weekend'
    multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.5,
    description VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add missing columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT '+233',
ADD COLUMN IF NOT EXISTS emergency_country_code VARCHAR(10) DEFAULT '+233',
ADD COLUMN IF NOT EXISTS is_date_of_birth_mandatory BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS inactive_reason VARCHAR(50), -- 'on_leave', 'resigned', 'terminated', 'suspended'
ADD COLUMN IF NOT EXISTS ghana_card_number VARCHAR(50);

-- 6. Update employee_financial table for enhanced allowances and deductions
ALTER TABLE public.employee_financial
ADD COLUMN IF NOT EXISTS weekend_overtime_rate NUMERIC(3,2) DEFAULT 2.0,
ADD COLUMN IF NOT EXISTS weekday_overtime_rate NUMERIC(3,2) DEFAULT 1.5,
ADD COLUMN IF NOT EXISTS tier2_employee_contribution NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tier2_employer_contribution NUMERIC(15,2) DEFAULT 0;

-- 7. Create AI chat interactions table for learning system
CREATE TABLE IF NOT EXISTS public.ai_chat_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID,
    user_type VARCHAR(20) DEFAULT 'employee', -- 'employee', 'admin', 'hr'
    question TEXT NOT NULL,
    response TEXT NOT NULL,
    context_type VARCHAR(50), -- 'hr', 'payroll', 'employee', 'general'
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback TEXT,
    session_id UUID,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Create system settings table for general configuration
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    setting_category VARCHAR(50) NOT NULL, -- 'payroll', 'hr', 'general', 'security'
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, setting_category, setting_key)
);

-- 9. Insert default tax configuration data
INSERT INTO public.paye_tax_bands (company_id, band_order, rate, threshold_amount, description, is_remaining_amount)
SELECT 
    c.id,
    1, 0.00, 4380.00, '0% on first GHS 4,380', false
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    2, 5.00, 1000.00, '5% on next GHS 1,000', false
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    3, 10.00, 2000.00, '10% on next GHS 2,000', false
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    4, 17.50, 20000.00, '17.5% on next GHS 20,000', false
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    5, 25.00, 20000.00, '25% on next GHS 20,000', false
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id)
UNION ALL
SELECT 
    c.id,
    6, 30.00, NULL, '30% on remaining amount', true
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.paye_tax_bands WHERE company_id = c.id);

-- 10. Insert default tax rates
INSERT INTO public.tax_rates (company_id, rate_type, employee_rate, employer_rate)
SELECT c.id, 'ssnit', 5.5, 13.0
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.tax_rates WHERE company_id = c.id AND rate_type = 'ssnit')
UNION ALL
SELECT c.id, 'tier2', 5.0, 5.0
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.tax_rates WHERE company_id = c.id AND rate_type = 'tier2')
UNION ALL
SELECT c.id, 'tier3', 5.0, 5.0
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.tax_rates WHERE company_id = c.id AND rate_type = 'tier3');

-- 11. Insert default overtime rates
INSERT INTO public.overtime_rates (company_id, rate_type, multiplier, description)
SELECT c.id, 'weekday', 1.5, 'Weekday Overtime Rate Multiplier'
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.overtime_rates WHERE company_id = c.id AND rate_type = 'weekday')
UNION ALL
SELECT c.id, 'weekend', 2.0, 'Weekend Overtime Rate Multiplier'
FROM public.companies c
WHERE NOT EXISTS (SELECT 1 FROM public.overtime_rates WHERE company_id = c.id AND rate_type = 'weekend');

-- 12. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_paye_tax_bands_company_id ON public.paye_tax_bands(company_id);
CREATE INDEX IF NOT EXISTS idx_paye_tax_bands_band_order ON public.paye_tax_bands(band_order);
CREATE INDEX IF NOT EXISTS idx_tax_rates_company_id ON public.tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_type ON public.tax_rates(rate_type);
CREATE INDEX IF NOT EXISTS idx_overtime_rates_company_id ON public.overtime_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_user_id ON public.ai_chat_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_interactions_created_at ON public.ai_chat_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_system_settings_company_id ON public.system_settings(company_id);

-- 13. Enable Row Level Security (RLS)
ALTER TABLE public.tax_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paye_tax_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 14. Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on tax_configuration" ON public.tax_configuration FOR ALL USING (true);
CREATE POLICY "Allow all operations on paye_tax_bands" ON public.paye_tax_bands FOR ALL USING (true);
CREATE POLICY "Allow all operations on tax_rates" ON public.tax_rates FOR ALL USING (true);
CREATE POLICY "Allow all operations on overtime_rates" ON public.overtime_rates FOR ALL USING (true);
CREATE POLICY "Allow all operations on ai_chat_interactions" ON public.ai_chat_interactions FOR ALL USING (true);
CREATE POLICY "Allow all operations on system_settings" ON public.system_settings FOR ALL USING (true);

-- 15. Create functions for automated calculations
CREATE OR REPLACE FUNCTION update_tax_rate_total()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_rate = NEW.employee_rate + NEW.employer_rate;
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create triggers
CREATE TRIGGER trigger_update_tax_rate_total
    BEFORE UPDATE ON public.tax_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_tax_rate_total();

-- 17. Update existing employee records with default values
UPDATE public.employees 
SET 
    country_code = COALESCE(country_code, '+233'),
    emergency_country_code = COALESCE(emergency_country_code, '+233'),
    is_date_of_birth_mandatory = COALESCE(is_date_of_birth_mandatory, true)
WHERE country_code IS NULL OR emergency_country_code IS NULL OR is_date_of_birth_mandatory IS NULL;

-- 18. Add constraints
ALTER TABLE public.paye_tax_bands ADD CONSTRAINT check_rate_range CHECK (rate >= 0 AND rate <= 100);
ALTER TABLE public.tax_rates ADD CONSTRAINT check_employee_rate_range CHECK (employee_rate >= 0 AND employee_rate <= 100);
ALTER TABLE public.tax_rates ADD CONSTRAINT check_employer_rate_range CHECK (employer_rate >= 0 AND employer_rate <= 100);
ALTER TABLE public.overtime_rates ADD CONSTRAINT check_multiplier_range CHECK (multiplier >= 1.0 AND multiplier <= 5.0);

COMMIT;
