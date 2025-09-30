-- Multi-Company Synchronization Tables
-- This script creates tables to support settings synchronization across subsidiaries

-- Subsidiary Settings Inheritance table
CREATE TABLE IF NOT EXISTS subsidiary_settings_inheritance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  -- Inheritance flags for each settings category
  inherit_hr_settings BOOLEAN DEFAULT true,
  inherit_payroll_settings BOOLEAN DEFAULT true,
  inherit_leave_policies BOOLEAN DEFAULT true,
  inherit_roles_permissions BOOLEAN DEFAULT false,
  inherit_notification_settings BOOLEAN DEFAULT true,
  inherit_security_settings BOOLEAN DEFAULT true,
  
  -- Override settings (JSONB for flexibility)
  hr_overrides JSONB DEFAULT '{}'::jsonb,
  payroll_overrides JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(company_id, subsidiary_id)
);

-- Settings Template table for exporting/importing settings
CREATE TABLE IF NOT EXISTS settings_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'hr', 'payroll', 'complete', 'custom'
  description TEXT,
  
  -- Template data
  settings_data JSONB NOT NULL,
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

-- Settings Import/Export Log
CREATE TABLE IF NOT EXISTS settings_import_export_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id),
  
  operation_type VARCHAR(20) NOT NULL, -- 'import', 'export'
  settings_type VARCHAR(50) NOT NULL,
  
  file_name VARCHAR(255),
  file_path TEXT,
  
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  performed_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subsidiary_inheritance_company ON subsidiary_settings_inheritance(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_inheritance_subsidiary ON subsidiary_settings_inheritance(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_settings_templates_company ON settings_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_settings_templates_type ON settings_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_import_export_log_company ON settings_import_export_log(company_id);

-- Enable RLS
ALTER TABLE subsidiary_settings_inheritance ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_import_export_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to subsidiary_settings_inheritance" ON subsidiary_settings_inheritance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settings_templates" ON settings_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to settings_import_export_log" ON settings_import_export_log FOR ALL USING (true) WITH CHECK (true);

-- Update triggers
CREATE TRIGGER update_subsidiary_inheritance_updated_at BEFORE UPDATE ON subsidiary_settings_inheritance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_templates_updated_at BEFORE UPDATE ON settings_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
