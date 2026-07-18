-- ============================================================================
-- 059_tenant_settings_persistence.sql
-- Canonical tenant settings schema for Settings page areas:
-- Company, Multi-Company, HR, Payroll, Notifications, Roles, Access, Security
-- Safe to re-run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Company
-- ----------------------------------------------------------------------------
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_file_id UUID,
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS divisions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  fiscal_year_start VARCHAR(20) DEFAULT 'January',
  default_currency VARCHAR(3) DEFAULT 'GHS',
  timezone VARCHAR(50) DEFAULT 'Africa/Accra',
  date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
  time_format VARCHAR(20) DEFAULT '24h',
  language VARCHAR(10) DEFAULT 'en',
  settings_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  setting_category VARCHAR(100) NOT NULL,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, setting_category, setting_key)
);

-- ----------------------------------------------------------------------------
-- Multi-company / subsidiaries
-- ----------------------------------------------------------------------------
ALTER TABLE subsidiaries
  ADD COLUMN IF NOT EXISTS logo_file_id UUID,
  ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS divisions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS departments JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS locations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS settings_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS subsidiary_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL,
  sync_status VARCHAR(20) DEFAULT 'pending',
  sync_data JSONB,
  synced_by UUID,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS subsidiary_sync_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  sync_hr_policies BOOLEAN DEFAULT true,
  sync_payroll_config BOOLEAN DEFAULT true,
  sync_leave_types BOOLEAN DEFAULT true,
  sync_roles_permissions BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- HR
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  leave_year_start VARCHAR(20) DEFAULT 'January',
  probation_period INTEGER DEFAULT 3,
  working_hours_per_day INTEGER DEFAULT 8,
  working_days_per_week INTEGER DEFAULT 5,
  auto_approve_leave BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  ai_recommendations BOOLEAN DEFAULT true,
  smart_scheduling BOOLEAN DEFAULT false,
  performance_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  days INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  carry_over BOOLEAN DEFAULT false,
  usage_rate VARCHAR(20) DEFAULT '0%',
  trend VARCHAR(20) DEFAULT 'new',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS hr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  file_type VARCHAR(50),
  visible_to_all BOOLEAN DEFAULT false,
  content TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  grade_name VARCHAR(100),
  grade_level INTEGER,
  name VARCHAR(100),
  min_salary DECIMAL(15,2),
  max_salary DECIMAL(15,2),
  step_1 DECIMAL(15,2),
  step_2 DECIMAL(15,2),
  step_3 DECIMAL(15,2),
  step_4 DECIMAL(15,2),
  step_5 DECIMAL(15,2),
  notches JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE salary_grades
  ADD COLUMN IF NOT EXISTS grade_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS grade_level INTEGER,
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS min_salary DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS max_salary DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS step_1 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS step_2 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS step_3 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS step_4 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS step_5 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS notches JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS unstructured_salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  grade_name VARCHAR(100) NOT NULL,
  description TEXT,
  general_increment_type VARCHAR(20) DEFAULT 'percentage',
  general_increment_value DECIMAL(10,2) DEFAULT 0,
  performance_increment_type VARCHAR(20) DEFAULT 'percentage',
  performance_increment_value DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Payroll
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  pay_frequency VARCHAR(20) DEFAULT 'monthly',
  currency VARCHAR(10) DEFAULT 'ghs',
  minimum_wage DECIMAL(15,2) DEFAULT 18.15,
  overtime_weekday_multiplier DECIMAL(5,2) DEFAULT 1.5,
  overtime_weekend_multiplier DECIMAL(5,2) DEFAULT 2.0,
  payroll_cutoff_day INTEGER DEFAULT 25,
  auto_calculate_paye BOOLEAN DEFAULT true,
  auto_calculate_ssnit BOOLEAN DEFAULT true,
  auto_calculate_provident_fund BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payroll_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(8,4) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS payroll_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(8,4) DEFAULT 0,
  type VARCHAR(20) DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, code)
);

CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  rate_type VARCHAR(50) NOT NULL,
  employee_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  employer_rate DECIMAL(8,4) NOT NULL DEFAULT 0,
  tax_year INTEGER,
  effective_date DATE,
  currency_code VARCHAR(3) DEFAULT 'GHS',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, rate_type)
);

CREATE TABLE IF NOT EXISTS paye_tax_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  band_order INTEGER NOT NULL,
  rate DECIMAL(8,4) NOT NULL,
  threshold_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  is_remaining_amount BOOLEAN DEFAULT false,
  description TEXT,
  effective_date DATE,
  currency_code VARCHAR(3) DEFAULT 'GHS',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (company_id, tax_year, band_order)
);

CREATE TABLE IF NOT EXISTS tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'GHS',
  category VARCHAR(50) DEFAULT 'Personal',
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(150),
  template_name VARCHAR(150),
  category VARCHAR(50),
  type VARCHAR(50),
  template_type VARCHAR(50),
  status VARCHAR(30) DEFAULT 'Active',
  description TEXT,
  subject TEXT,
  body TEXT,
  body_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false,
  last_modified DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS template_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS body_template TEXT,
  ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_modified DATE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID,
  category VARCHAR(100) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  delivery_method JSONB DEFAULT '["email"]'::jsonb,
  frequency VARCHAR(50) DEFAULT 'immediate',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_settings_company_prefs
  ON notification_settings (company_id, category, notification_type)
  WHERE employee_id IS NULL;

CREATE TABLE IF NOT EXISTS email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  provider VARCHAR(50) DEFAULT 'smtp',
  smtp_host VARCHAR(255),
  smtp_port INTEGER DEFAULT 587,
  smtp_username VARCHAR(255),
  smtp_password TEXT,
  api_key TEXT,
  from_email VARCHAR(255),
  from_name VARCHAR(255),
  reply_to VARCHAR(255),
  enable_tls BOOLEAN DEFAULT true,
  enable_ssl BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_configurations
  ADD COLUMN IF NOT EXISTS enable_tls BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_ssl BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- ----------------------------------------------------------------------------
-- Roles & access
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  code VARCHAR(50),
  level INTEGER DEFAULT 1,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_system_role BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_company_name ON roles (company_id, name);

CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (employee_id, role_id)
);

CREATE TABLE IF NOT EXISTS access_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  two_factor_enabled BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,
  password_expiry_enabled BOOLEAN DEFAULT true,
  password_expiry_days INTEGER DEFAULT 90,
  session_timeout INTEGER DEFAULT 30,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration INTEGER DEFAULT 15,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_special BOOLEAN DEFAULT false,
  ip_restrictions_enabled BOOLEAN DEFAULT false,
  allowed_ips JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID,
  user_id UUID,
  user_email VARCHAR(255),
  session_token TEXT,
  ip_address VARCHAR(100),
  device VARCHAR(100),
  browser VARCHAR(100),
  os VARCHAR(100),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE active_sessions
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS device VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID,
  action VARCHAR(255),
  resource VARCHAR(255),
  ip_address VARCHAR(100),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  action VARCHAR(255),
  ip_address VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'low',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- Security
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE,
  data_encryption_enabled BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(30) DEFAULT 'daily',
  backup_retention_days INTEGER DEFAULT 30,
  data_retention_days INTEGER DEFAULT 90,
  gdpr_compliance_enabled BOOLEAN DEFAULT false,
  data_anonymization_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  backup_type VARCHAR(30) DEFAULT 'manual',
  backup_status VARCHAR(30) DEFAULT 'completed',
  backup_size BIGINT,
  backup_location TEXT,
  backup_checksum TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  triggered_by VARCHAR(50) DEFAULT 'manual',
  triggered_by_user UUID
);

-- ----------------------------------------------------------------------------
-- Helpful indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company ON subsidiaries(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_policies_company ON leave_policies(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_company ON hr_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_grades_company ON salary_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_company ON notification_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_company ON access_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_company ON backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_company ON active_sessions(company_id);

COMMENT ON TABLE company_settings IS 'Tenant company settings blob + locale defaults';
COMMENT ON TABLE leave_policies IS 'Tenant leave policies managed from Settings > HR';
COMMENT ON TABLE notification_templates IS 'Tenant notification templates managed from Settings > Notifications';
COMMENT ON TABLE access_control_settings IS 'Tenant authentication / IP access settings';
COMMENT ON TABLE security_settings IS 'Tenant security policy settings';
