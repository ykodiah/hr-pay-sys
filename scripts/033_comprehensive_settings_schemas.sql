-- Comprehensive Settings Database Schemas
-- This script creates/updates all tables needed for the settings page sections:
-- Company, Multi-Company, HR, Payroll, Notifications, Roles, Access, Security

-- ============================================================================
-- 1. COMPANY SETTINGS TABLES
-- ============================================================================

-- Update companies table with additional fields
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS logo_file_id UUID,
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create company_settings table for additional configuration
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  fiscal_year_start VARCHAR(20) DEFAULT 'January',
  default_currency VARCHAR(3) DEFAULT 'GHS',
  timezone VARCHAR(50) DEFAULT 'Africa/Accra',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(20) DEFAULT '24h',
  language VARCHAR(10) DEFAULT 'en',
  settings_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. MULTI-COMPANY (SUBSIDIARIES) TABLES
-- ============================================================================

-- Update subsidiaries table with additional fields
ALTER TABLE subsidiaries
ADD COLUMN IF NOT EXISTS logo_file_id UUID,
ADD COLUMN IF NOT EXISTS industry VARCHAR(100);

-- Create subsidiary_sync_log table to track settings synchronization
CREATE TABLE IF NOT EXISTS subsidiary_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'hr_policies', 'payroll_config', 'leave_types', 'roles'
  sync_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  sync_data JSONB,
  synced_by UUID REFERENCES employees(id),
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT
);

-- ============================================================================
-- 3. HR CONFIGURATION TABLES
-- ============================================================================

-- Create hr_configuration table
CREATE TABLE IF NOT EXISTS hr_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  leave_year_start VARCHAR(20) DEFAULT 'January',
  probation_period INTEGER DEFAULT 3, -- months
  working_hours_per_day INTEGER DEFAULT 8,
  working_days_per_week INTEGER DEFAULT 5,
  auto_approve_leave BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  ai_recommendations BOOLEAN DEFAULT true,
  smart_scheduling BOOLEAN DEFAULT false,
  performance_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hr_documents table for company-wide HR documents
CREATE TABLE IF NOT EXISTS hr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL, -- 'policy', 'handbook', 'form', 'template'
  file_path TEXT,
  file_size INTEGER,
  file_type VARCHAR(50),
  visible_to_all BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update salary_grades table if needed
ALTER TABLE salary_grades
ADD COLUMN IF NOT EXISTS grade_level INTEGER,
ADD COLUMN IF NOT EXISTS grade_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS step_1 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS step_2 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS step_3 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS step_4 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS step_5 DECIMAL(15,2);

-- Create unstructured_salary_grades table
CREATE TABLE IF NOT EXISTS unstructured_salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  grade_name VARCHAR(100) NOT NULL,
  description TEXT,
  general_increment_type VARCHAR(20) DEFAULT 'percentage', -- 'percentage', 'fixed'
  general_increment_value DECIMAL(10,2) DEFAULT 0,
  performance_increment_type VARCHAR(20) DEFAULT 'percentage',
  performance_increment_value DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. PAYROLL CONFIGURATION TABLES
-- ============================================================================

-- Update payroll_configuration table
ALTER TABLE payroll_configuration
ADD COLUMN IF NOT EXISTS pay_frequency VARCHAR(20) DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS payroll_cutoff_day INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS auto_calculate_paye BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_calculate_ssnit BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_calculate_provident_fund BOOLEAN DEFAULT true;

-- Create tax_rate_versions table for version control
CREATE TABLE IF NOT EXISTS tax_rate_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  country_code VARCHAR(3) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  tax_year INTEGER NOT NULL,
  version_number INTEGER DEFAULT 1,
  version_name VARCHAR(100),
  effective_date DATE NOT NULL,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'active', 'archived'
  source VARCHAR(50) DEFAULT 'manual', -- 'manual', 'api', 'import'
  source_reference VARCHAR(255),
  confidence_score DECIMAL(5,2),
  validation_status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tax_band_versions table
CREATE TABLE IF NOT EXISTS tax_band_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_version_id UUID REFERENCES tax_rate_versions(id) ON DELETE CASCADE,
  band_order INTEGER NOT NULL,
  rate DECIMAL(5,2) NOT NULL,
  threshold_from DECIMAL(15,2) NOT NULL,
  threshold_to DECIMAL(15,2),
  is_remaining_band BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create social_security_versions table
CREATE TABLE IF NOT EXISTS social_security_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_version_id UUID REFERENCES tax_rate_versions(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL,
  tier_name VARCHAR(50),
  employee_rate DECIMAL(5,2) NOT NULL,
  employer_rate DECIMAL(5,2) NOT NULL,
  ceiling_amount DECIMAL(15,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tax_rate_audit_log table
CREATE TABLE IF NOT EXISTS tax_rate_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tax_version_id UUID REFERENCES tax_rate_versions(id),
  action_type VARCHAR(50) NOT NULL, -- 'created', 'updated', 'approved', 'archived'
  entity_type VARCHAR(50) NOT NULL, -- 'tax_version', 'tax_band', 'social_security'
  entity_id UUID,
  user_id UUID REFERENCES employees(id),
  user_name VARCHAR(255),
  user_role VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  change_summary TEXT,
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tax_rate_comparisons table
CREATE TABLE IF NOT EXISTS tax_rate_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  from_version_id UUID REFERENCES tax_rate_versions(id),
  to_version_id UUID REFERENCES tax_rate_versions(id),
  comparison_type VARCHAR(50) NOT NULL, -- 'version_compare', 'country_compare'
  differences JSONB,
  impact_analysis JSONB,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tax_rate_rollbacks table
CREATE TABLE IF NOT EXISTS tax_rate_rollbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  from_version_id UUID REFERENCES tax_rate_versions(id),
  to_version_id UUID REFERENCES tax_rate_versions(id),
  rollback_type VARCHAR(50) NOT NULL, -- 'full', 'partial'
  rollback_reason TEXT,
  rollback_status VARCHAR(20) DEFAULT 'pending',
  affected_payrolls INTEGER DEFAULT 0,
  completion_notes TEXT,
  created_by UUID REFERENCES employees(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. NOTIFICATIONS TABLES (already exist, but ensure completeness)
-- ============================================================================

-- Ensure notification_templates has all needed fields
ALTER TABLE notification_templates
ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES employees(id);

-- Ensure notification_settings has all needed fields
ALTER TABLE notification_settings
ADD COLUMN IF NOT EXISTS frequency VARCHAR(20) DEFAULT 'immediate';

-- Ensure email_configurations has all needed fields
ALTER TABLE email_configurations
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- ============================================================================
-- 6. ROLES & PERMISSIONS TABLES (already exist, but ensure completeness)
-- ============================================================================

-- Ensure roles table has all needed fields
ALTER TABLE roles
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Ensure permissions table exists and has needed fields
ALTER TABLE permissions
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS is_system_permission BOOLEAN DEFAULT false;

-- Create role_statistics view
CREATE OR REPLACE VIEW role_statistics AS
SELECT 
  r.company_id,
  COUNT(DISTINCT r.id) as total_roles,
  COUNT(DISTINCT CASE WHEN r.is_active THEN r.id END) as active_roles,
  COUNT(DISTINCT ur.employee_id) as users_with_roles,
  COUNT(DISTINCT rp.permission_id) as total_permissions
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.company_id;

-- Create user_access_summary view
CREATE OR REPLACE VIEW user_access_summary AS
SELECT 
  e.id as employee_id,
  e.full_name,
  e.company_id,
  COUNT(DISTINCT ur.role_id) as role_count,
  COUNT(DISTINCT rp.permission_id) as permission_count,
  MAX(r.level) as highest_role_level,
  COUNT(DISTINCT al.id) FILTER (WHERE al.created_at > NOW() - INTERVAL '30 days') as recent_access_count
FROM employees e
LEFT JOIN user_roles ur ON e.id = ur.employee_id
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN access_logs al ON e.id = al.employee_id
GROUP BY e.id, e.full_name, e.company_id;

-- ============================================================================
-- 7. ACCESS CONTROL TABLES
-- ============================================================================

-- Create access_control_settings table
CREATE TABLE IF NOT EXISTS access_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,
  password_expiry_enabled BOOLEAN DEFAULT true,
  password_expiry_days INTEGER DEFAULT 90,
  session_timeout INTEGER DEFAULT 30, -- minutes
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 30, -- minutes
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_special BOOLEAN DEFAULT true,
  ip_restrictions_enabled BOOLEAN DEFAULT false,
  allowed_ips JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create active_sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  session_token VARCHAR(500) UNIQUE,
  ip_address INET,
  device VARCHAR(255),
  browser VARCHAR(100),
  os VARCHAR(100),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update access_logs table with additional fields
ALTER TABLE access_logs
ADD COLUMN IF NOT EXISTS action VARCHAR(100),
ADD COLUMN IF NOT EXISTS resource VARCHAR(255),
ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS failure_reason TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================================================
-- 8. SECURITY TABLES
-- ============================================================================

-- Create security_settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  data_encryption_enabled BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  backup_retention_days INTEGER DEFAULT 30,
  data_retention_days INTEGER DEFAULT 90,
  gdpr_compliance_enabled BOOLEAN DEFAULT false,
  data_anonymization_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create backup_history table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'differential'
  backup_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'failed'
  backup_size BIGINT, -- bytes
  backup_location TEXT,
  backup_checksum VARCHAR(255),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  triggered_by VARCHAR(50) DEFAULT 'automatic', -- 'automatic', 'manual'
  triggered_by_user UUID REFERENCES employees(id)
);

-- Update security_analytics table with additional fields
ALTER TABLE security_analytics
ADD COLUMN IF NOT EXISTS affected_users UUID[],
ADD COLUMN IF NOT EXISTS affected_roles UUID[],
ADD COLUMN IF NOT EXISTS recommendations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Company settings indexes
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON company_settings(company_id);

-- Subsidiary sync indexes
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_log_company_id ON subsidiary_sync_log(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_log_subsidiary_id ON subsidiary_sync_log(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_log_status ON subsidiary_sync_log(sync_status);

-- HR configuration indexes
CREATE INDEX IF NOT EXISTS idx_hr_configuration_company_id ON hr_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_company_id ON hr_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_type ON hr_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_unstructured_salary_grades_company_id ON unstructured_salary_grades(company_id);

-- Tax rate indexes
CREATE INDEX IF NOT EXISTS idx_tax_rate_versions_company_id ON tax_rate_versions(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_versions_status ON tax_rate_versions(status);
CREATE INDEX IF NOT EXISTS idx_tax_band_versions_tax_version_id ON tax_band_versions(tax_version_id);
CREATE INDEX IF NOT EXISTS idx_social_security_versions_tax_version_id ON social_security_versions(tax_version_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_audit_log_company_id ON tax_rate_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rate_audit_log_created_at ON tax_rate_audit_log(created_at);

-- Access control indexes
CREATE INDEX IF NOT EXISTS idx_access_control_settings_company_id ON access_control_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_employee_id ON active_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_settings_company_id ON security_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_company_id ON backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_status ON backup_history(backup_status);
CREATE INDEX IF NOT EXISTS idx_backup_history_started_at ON backup_history(started_at);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiary_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE unstructured_salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rate_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_band_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_security_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rate_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rate_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rate_rollbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE SIMPLE, NON-RECURSIVE RLS POLICIES
-- ============================================================================

-- Company settings policies
CREATE POLICY "company_settings_full_access" ON company_settings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Subsidiary sync policies
CREATE POLICY "subsidiary_sync_log_full_access" ON subsidiary_sync_log FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- HR configuration policies
CREATE POLICY "hr_configuration_full_access" ON hr_configuration FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "hr_documents_full_access" ON hr_documents FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "unstructured_salary_grades_full_access" ON unstructured_salary_grades FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Tax rate policies
CREATE POLICY "tax_rate_versions_full_access" ON tax_rate_versions FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "tax_band_versions_full_access" ON tax_band_versions FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "social_security_versions_full_access" ON social_security_versions FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "tax_rate_audit_log_full_access" ON tax_rate_audit_log FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "tax_rate_comparisons_full_access" ON tax_rate_comparisons FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "tax_rate_rollbacks_full_access" ON tax_rate_rollbacks FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Access control policies
CREATE POLICY "access_control_settings_full_access" ON access_control_settings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "active_sessions_full_access" ON active_sessions FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- Security policies
CREATE POLICY "security_settings_full_access" ON security_settings FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);
CREATE POLICY "backup_history_full_access" ON backup_history FOR ALL TO authenticated, anon USING (true) WITH CHECK (true);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON company_settings TO authenticated, anon;
GRANT ALL ON subsidiary_sync_log TO authenticated, anon;
GRANT ALL ON hr_configuration TO authenticated, anon;
GRANT ALL ON hr_documents TO authenticated, anon;
GRANT ALL ON unstructured_salary_grades TO authenticated, anon;
GRANT ALL ON tax_rate_versions TO authenticated, anon;
GRANT ALL ON tax_band_versions TO authenticated, anon;
GRANT ALL ON social_security_versions TO authenticated, anon;
GRANT ALL ON tax_rate_audit_log TO authenticated, anon;
GRANT ALL ON tax_rate_comparisons TO authenticated, anon;
GRANT ALL ON tax_rate_rollbacks TO authenticated, anon;
GRANT ALL ON access_control_settings TO authenticated, anon;
GRANT ALL ON active_sessions TO authenticated, anon;
GRANT ALL ON security_settings TO authenticated, anon;
GRANT ALL ON backup_history TO authenticated, anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default HR configuration for existing companies
INSERT INTO hr_configuration (company_id)
SELECT id FROM companies
WHERE NOT EXISTS (SELECT 1 FROM hr_configuration WHERE company_id = companies.id)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default access control settings for existing companies
INSERT INTO access_control_settings (company_id)
SELECT id FROM companies
WHERE NOT EXISTS (SELECT 1 FROM access_control_settings WHERE company_id = companies.id)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default security settings for existing companies
INSERT INTO security_settings (company_id)
SELECT id FROM companies
WHERE NOT EXISTS (SELECT 1 FROM security_settings WHERE company_id = companies.id)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default company settings for existing companies
INSERT INTO company_settings (company_id)
SELECT id FROM companies
WHERE NOT EXISTS (SELECT 1 FROM company_settings WHERE company_id = companies.id)
ON CONFLICT (company_id) DO NOTHING;

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to sync settings to subsidiaries
CREATE OR REPLACE FUNCTION sync_settings_to_subsidiaries(
  p_company_id UUID,
  p_sync_type VARCHAR,
  p_synced_by UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_subsidiary RECORD;
BEGIN
  FOR v_subsidiary IN 
    SELECT id FROM subsidiaries WHERE company_id = p_company_id AND status = 'active'
  LOOP
    INSERT INTO subsidiary_sync_log (
      company_id, subsidiary_id, sync_type, sync_status, synced_by
    ) VALUES (
      p_company_id, v_subsidiary.id, p_sync_type, 'completed', p_synced_by
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE active_sessions 
  SET is_active = false 
  WHERE expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to create automatic backup
CREATE OR REPLACE FUNCTION create_automatic_backup(p_company_id UUID) RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
BEGIN
  INSERT INTO backup_history (
    company_id, backup_type, backup_status, triggered_by
  ) VALUES (
    p_company_id, 'full', 'pending', 'automatic'
  ) RETURNING id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count new tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN (
    'company_settings', 'subsidiary_sync_log', 'hr_configuration', 'hr_documents',
    'unstructured_salary_grades', 'tax_rate_versions', 'tax_band_versions',
    'social_security_versions', 'tax_rate_audit_log', 'tax_rate_comparisons',
    'tax_rate_rollbacks', 'access_control_settings', 'active_sessions',
    'security_settings', 'backup_history'
  );
  
  -- Count policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN (
    'company_settings', 'subsidiary_sync_log', 'hr_configuration', 'hr_documents',
    'unstructured_salary_grades', 'tax_rate_versions', 'tax_band_versions',
    'social_security_versions', 'tax_rate_audit_log', 'tax_rate_comparisons',
    'tax_rate_rollbacks', 'access_control_settings', 'active_sessions',
    'security_settings', 'backup_history'
  );
  
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Comprehensive Settings Database Schema Setup Complete';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Tables created/updated: %', table_count;
  RAISE NOTICE 'RLS policies created: %', policy_count;
  RAISE NOTICE 'All tables have simple, non-recursive RLS policies';
  RAISE NOTICE 'Default data inserted for existing companies';
  RAISE NOTICE 'Helper functions created for common operations';
  RAISE NOTICE '=================================================================';
END $$;
