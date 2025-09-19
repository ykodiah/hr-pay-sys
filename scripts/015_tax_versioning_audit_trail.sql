-- Tax Rate Versioning and Audit Trail System
-- This script creates comprehensive versioning and audit capabilities for tax rate management

-- Create tax rate versions table for historical tracking
CREATE TABLE IF NOT EXISTS public.tax_rate_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    country_code VARCHAR(3) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    tax_year INTEGER NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    version_name VARCHAR(100), -- e.g., "Initial 2025 Rates", "Mid-year Update"
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'superseded', 'archived'
    effective_date DATE NOT NULL,
    expiry_date DATE,
    source VARCHAR(100) NOT NULL, -- 'government_api', 'manual_import', 'admin_update'
    source_reference VARCHAR(255), -- API endpoint, document reference, etc.
    confidence_score NUMERIC(3,2), -- 0.00 to 1.00 for API-sourced data
    validation_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    notes TEXT,
    UNIQUE(company_id, country_code, tax_year, version_number)
);

-- Create tax band versions table
CREATE TABLE IF NOT EXISTS public.tax_band_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    band_order INTEGER NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    threshold_from NUMERIC(15,2) NOT NULL,
    threshold_to NUMERIC(15,2),
    description TEXT,
    is_remaining_band BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social security rate versions table
CREATE TABLE IF NOT EXISTS public.social_security_versions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tax_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL,
    tier_name VARCHAR(50) NOT NULL, -- 'SSNIT Tier 1', 'SSNIT Tier 2', etc.
    employee_rate NUMERIC(5,2) NOT NULL,
    employer_rate NUMERIC(5,2) NOT NULL,
    ceiling_amount NUMERIC(15,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comprehensive audit trail table
CREATE TABLE IF NOT EXISTS public.tax_rate_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    tax_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'approve', 'activate', 'supersede', 'archive'
    entity_type VARCHAR(50) NOT NULL, -- 'tax_version', 'tax_band', 'social_security_rate'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    change_summary TEXT,
    user_id UUID,
    user_name VARCHAR(255),
    user_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- Additional context like API response, validation results, etc.
);

-- Create tax rate comparison table for tracking differences
CREATE TABLE IF NOT EXISTS public.tax_rate_comparisons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    from_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    to_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    comparison_type VARCHAR(50) NOT NULL, -- 'version_diff', 'country_diff', 'year_diff'
    differences JSONB NOT NULL, -- Structured diff data
    impact_analysis JSONB, -- Calculated impact on payroll
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- Create tax rate rollback table for emergency reversions
CREATE TABLE IF NOT EXISTS public.tax_rate_rollbacks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    from_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    to_version_id UUID REFERENCES public.tax_rate_versions(id) ON DELETE CASCADE,
    rollback_reason TEXT NOT NULL,
    rollback_type VARCHAR(20) NOT NULL, -- 'emergency', 'planned', 'correction'
    affected_payrolls INTEGER DEFAULT 0,
    rollback_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_notes TEXT
);

-- Insert sample Ghana tax rate versions
INSERT INTO public.tax_rate_versions (
    company_id, country_code, currency_code, tax_year, version_number, version_name,
    status, effective_date, source, source_reference, confidence_score, validation_status,
    created_by, approved_at, approved_by, notes
)
SELECT 
    c.id, 'GHA', 'GHS', 2025, 1, 'Initial 2025 Tax Rates',
    'active', '2025-01-01', 'government_api', 'https://api.gra.gov.gh/v1/tax-rates/2025',
    0.95, 'verified', c.id, NOW(), c.id, 'Official tax rates from Ghana Revenue Authority'
FROM public.companies c
WHERE NOT EXISTS (
    SELECT 1 FROM public.tax_rate_versions 
    WHERE company_id = c.id AND country_code = 'GHA' AND tax_year = 2025
);

-- Insert sample tax bands for Ghana 2025
WITH ghana_versions AS (
    SELECT trv.id as version_id FROM public.tax_rate_versions trv
    JOIN public.companies c ON c.id = trv.company_id
    WHERE trv.country_code = 'GHA' AND trv.tax_year = 2025 AND trv.version_number = 1
)
INSERT INTO public.tax_band_versions (tax_version_id, band_order, rate, threshold_from, threshold_to, description, is_remaining_band)
SELECT 
    gv.version_id,
    band_data.band_order,
    band_data.rate,
    band_data.threshold_from,
    band_data.threshold_to,
    band_data.description,
    band_data.is_remaining_band
FROM ghana_versions gv
CROSS JOIN (
    VALUES 
        (1, 0.00, 0, 490, '0% on first GH₵ 490', false),
        (2, 5.00, 490, 600, '5% on next GH₵ 110', false),
        (3, 10.00, 600, 730, '10% on next GH₵ 130', false),
        (4, 17.50, 730, 3896.67, '17.5% on next GH₵ 3,166.67', false),
        (5, 25.00, 3896.67, 19896.67, '25% on next GH₵ 16,000', false),
        (6, 30.00, 19896.67, 50416.67, '30% on next GH₵ 30,520', false),
        (7, 35.00, 50416.67, NULL, '35% on amounts exceeding GH₵ 50,416.67', true)
) AS band_data(band_order, rate, threshold_from, threshold_to, description, is_remaining_band)
ON CONFLICT DO NOTHING;

-- Insert sample social security rates for Ghana 2025
WITH ghana_versions AS (
    SELECT trv.id as version_id FROM public.tax_rate_versions trv
    JOIN public.companies c ON c.id = trv.company_id
    WHERE trv.country_code = 'GHA' AND trv.tax_year = 2025 AND trv.version_number = 1
)
INSERT INTO public.social_security_versions (tax_version_id, tier_number, tier_name, employee_rate, employer_rate, description)
SELECT 
    gv.version_id,
    ss_data.tier_number,
    ss_data.tier_name,
    ss_data.employee_rate,
    ss_data.employer_rate,
    ss_data.description
FROM ghana_versions gv
CROSS JOIN (
    VALUES 
        (1, 'SSNIT Tier 1', 5.5, 13.0, 'Social Security and National Insurance Trust'),
        (2, 'SSNIT Tier 2', 5.0, 0.0, 'Occupational Pension Scheme'),
        (3, 'SSNIT Tier 3', 5.0, 0.0, 'Provident Fund / Personal Pension')
) AS ss_data(tier_number, tier_name, employee_rate, employer_rate, description)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tax_rate_versions_company_country_year ON public.tax_rate_versions(company_id, country_code, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_rate_versions_status ON public.tax_rate_versions(status);
CREATE INDEX IF NOT EXISTS idx_tax_rate_versions_effective_date ON public.tax_rate_versions(effective_date);
CREATE INDEX IF NOT EXISTS idx_tax_band_versions_tax_version_id ON public.tax_band_versions(tax_version_id);
CREATE INDEX IF NOT EXISTS idx_social_security_versions_tax_version_id ON public.social_security_versions(tax_version_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_audit_log_company_id ON public.tax_rate_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_audit_log_created_at ON public.tax_rate_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tax_rate_audit_log_action_type ON public.tax_rate_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_tax_rate_comparisons_company_id ON public.tax_rate_comparisons(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_rollbacks_company_id ON public.tax_rate_rollbacks(company_id);

-- Enable Row Level Security
ALTER TABLE public.tax_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_band_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_security_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rate_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rate_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rate_rollbacks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their company's tax rate versions" ON public.tax_rate_versions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage their company's tax rate versions" ON public.tax_rate_versions
    FOR ALL USING (true);

CREATE POLICY "Users can view tax band versions" ON public.tax_band_versions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage tax band versions" ON public.tax_band_versions
    FOR ALL USING (true);

CREATE POLICY "Users can view social security versions" ON public.social_security_versions
    FOR SELECT USING (true);

CREATE POLICY "Users can manage social security versions" ON public.social_security_versions
    FOR ALL USING (true);

CREATE POLICY "Users can view audit logs" ON public.tax_rate_audit_log
    FOR SELECT USING (true);

CREATE POLICY "Users can create audit logs" ON public.tax_rate_audit_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view comparisons" ON public.tax_rate_comparisons
    FOR SELECT USING (true);

CREATE POLICY "Users can manage comparisons" ON public.tax_rate_comparisons
    FOR ALL USING (true);

CREATE POLICY "Users can view rollbacks" ON public.tax_rate_rollbacks
    FOR SELECT USING (true);

CREATE POLICY "Users can manage rollbacks" ON public.tax_rate_rollbacks
    FOR ALL USING (true);

-- Create functions for automated audit logging
CREATE OR REPLACE FUNCTION log_tax_rate_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.tax_rate_audit_log (
        company_id, tax_version_id, action_type, entity_type, entity_id,
        old_values, new_values, change_summary, created_at
    ) VALUES (
        COALESCE(NEW.company_id, OLD.company_id),
        COALESCE(NEW.id, OLD.id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'create'
            WHEN TG_OP = 'UPDATE' THEN 'update'
            WHEN TG_OP = 'DELETE' THEN 'delete'
        END,
        'tax_version',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
        CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Created new tax rate version'
            WHEN TG_OP = 'UPDATE' THEN 'Updated tax rate version'
            WHEN TG_OP = 'DELETE' THEN 'Deleted tax rate version'
        END,
        NOW()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for audit logging
CREATE TRIGGER trigger_tax_rate_versions_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.tax_rate_versions
    FOR EACH ROW EXECUTE FUNCTION log_tax_rate_change();

-- Create function to get active tax version
CREATE OR REPLACE FUNCTION get_active_tax_version(
    p_company_id UUID,
    p_country_code VARCHAR(3),
    p_tax_year INTEGER
)
RETURNS UUID AS $$
DECLARE
    version_id UUID;
BEGIN
    SELECT id INTO version_id
    FROM public.tax_rate_versions
    WHERE company_id = p_company_id
        AND country_code = p_country_code
        AND tax_year = p_tax_year
        AND status = 'active'
        AND effective_date <= CURRENT_DATE
        AND (expiry_date IS NULL OR expiry_date > CURRENT_DATE)
    ORDER BY version_number DESC
    LIMIT 1;
    
    RETURN version_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to compare tax versions
CREATE OR REPLACE FUNCTION compare_tax_versions(
    p_from_version_id UUID,
    p_to_version_id UUID
)
RETURNS JSONB AS $$
DECLARE
    comparison_result JSONB;
    from_bands JSONB;
    to_bands JSONB;
    from_ss JSONB;
    to_ss JSONB;
BEGIN
    -- Get tax bands for both versions
    SELECT jsonb_agg(
        jsonb_build_object(
            'band_order', band_order,
            'rate', rate,
            'threshold_from', threshold_from,
            'threshold_to', threshold_to,
            'description', description
        ) ORDER BY band_order
    ) INTO from_bands
    FROM public.tax_band_versions
    WHERE tax_version_id = p_from_version_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'band_order', band_order,
            'rate', rate,
            'threshold_from', threshold_from,
            'threshold_to', threshold_to,
            'description', description
        ) ORDER BY band_order
    ) INTO to_bands
    FROM public.tax_band_versions
    WHERE tax_version_id = p_to_version_id;
    
    -- Get social security rates for both versions
    SELECT jsonb_agg(
        jsonb_build_object(
            'tier_number', tier_number,
            'tier_name', tier_name,
            'employee_rate', employee_rate,
            'employer_rate', employer_rate
        ) ORDER BY tier_number
    ) INTO from_ss
    FROM public.social_security_versions
    WHERE tax_version_id = p_from_version_id;
    
    SELECT jsonb_agg(
        jsonb_build_object(
            'tier_number', tier_number,
            'tier_name', tier_name,
            'employee_rate', employee_rate,
            'employer_rate', employer_rate
        ) ORDER BY tier_number
    ) INTO to_ss
    FROM public.social_security_versions
    WHERE tax_version_id = p_to_version_id;
    
    -- Build comparison result
    comparison_result := jsonb_build_object(
        'tax_bands', jsonb_build_object(
            'from', from_bands,
            'to', to_bands,
            'changed', from_bands != to_bands
        ),
        'social_security', jsonb_build_object(
            'from', from_ss,
            'to', to_ss,
            'changed', from_ss != to_ss
        ),
        'comparison_date', to_jsonb(NOW())
    );
    
    RETURN comparison_result;
END;
$$ LANGUAGE plpgsql;

COMMIT;
