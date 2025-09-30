-- HR Settings Configuration Tables
-- This script creates/updates tables for HR configuration settings

-- HR Configuration table for general HR settings
CREATE TABLE IF NOT EXISTS hr_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  -- Leave Configuration
  leave_year_start VARCHAR(20) DEFAULT 'January',
  working_hours_per_day INTEGER DEFAULT 8,
  working_days_per_week INTEGER DEFAULT 5,
  probation_period_months INTEGER DEFAULT 3,
  
  -- Automation Settings
  auto_approve_leave BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  ai_recommendations BOOLEAN DEFAULT false,
  smart_scheduling BOOLEAN DEFAULT false,
  performance_tracking BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(company_id, subsidiary_id)
);

-- HR Documents table for managing HR policy documents
CREATE TABLE IF NOT EXISTS hr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100),
  file_path TEXT,
  file_size INTEGER,
  file_url TEXT,
  
  -- Visibility settings
  visible_to_all BOOLEAN DEFAULT false,
  visible_to_roles JSONB DEFAULT '[]'::jsonb,
  visible_to_departments JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  is_active BOOLEAN DEFAULT true
);

-- Unstructured Salary Grades table
CREATE TABLE IF NOT EXISTS unstructured_salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  grade_name VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- General Increment
  general_increment_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage' or 'fixed'
  general_increment_value NUMERIC(10, 2) DEFAULT 0,
  
  -- Performance Increment
  performance_increment_type VARCHAR(20) DEFAULT 'percentage',
  performance_increment_value NUMERIC(10, 2) DEFAULT 0,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Settings Sync Log table to track synchronization across subsidiaries
CREATE TABLE IF NOT EXISTS settings_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  sync_type VARCHAR(50) NOT NULL, -- 'hr', 'payroll', 'roles', 'notifications'
  source_subsidiary_id UUID REFERENCES subsidiaries(id),
  target_subsidiary_id UUID REFERENCES subsidiaries(id),
  
  settings_data JSONB,
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_by UUID
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_hr_config_company ON hr_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_config_subsidiary ON hr_configuration(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_company ON hr_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_unstructured_grades_company ON unstructured_salary_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_sync_company ON settings_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_sync_type ON settings_sync_log(sync_type);

-- Enable RLS
ALTER TABLE hr_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE unstructured_salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for demo mode)
CREATE POLICY "Allow all access to hr_configuration" ON hr_configuration FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to hr_documents" ON hr_documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to unstructured_salary_grades" ON unstructured_salary_grades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settings_sync_log" ON settings_sync_log FOR ALL USING (true) WITH CHECK (true);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hr_configuration_updated_at BEFORE UPDATE ON hr_configuration
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_documents_updated_at BEFORE UPDATE ON hr_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unstructured_salary_grades_updated_at BEFORE UPDATE ON unstructured_salary_grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
