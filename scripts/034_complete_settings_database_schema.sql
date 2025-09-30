-- =====================================================
-- Complete Settings Database Schema
-- Creates/updates all tables for settings page sections
-- =====================================================

-- =====================================================
-- 1. SUBSIDIARY / MULTI-COMPANY SETTINGS
-- =====================================================

-- Update subsidiaries table to match settings page structure
CREATE TABLE IF NOT EXISTS subsidiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  legal_name TEXT,
  tax_id TEXT,
  ssnit_number TEXT,
  industry TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  email_address TEXT,
  phone_number TEXT,
  phone TEXT, -- Alternative phone field
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT DEFAULT 'Ghana',
  website TEXT,
  logo_url TEXT,
  logo_file_id TEXT,
  divisions JSONB DEFAULT '[]'::jsonb,
  departments JSONB DEFAULT '[]'::jsonb,
  locations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subsidiary sync logs for multi-company data synchronization
CREATE TABLE IF NOT EXISTS subsidiary_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'employees', 'payroll', 'settings', etc.
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- 2. HR CONFIGURATION SETTINGS
-- =====================================================

-- HR configuration table
CREATE TABLE IF NOT EXISTS hr_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  leave_year_start TEXT DEFAULT 'January',
  probation_period INTEGER DEFAULT 3, -- in months
  working_hours_per_day INTEGER DEFAULT 8,
  working_days_per_week INTEGER DEFAULT 5,
  auto_approve_leave BOOLEAN DEFAULT false,
  email_notifications BOOLEAN DEFAULT true,
  ai_recommendations BOOLEAN DEFAULT true,
  smart_scheduling BOOLEAN DEFAULT false,
  performance_tracking BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Leave policies table (updated structure)
CREATE TABLE IF NOT EXISTS leave_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  days INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  usage_percentage DECIMAL(5,2) DEFAULT 0, -- e.g., 68.50 for 68.5%
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  carry_over BOOLEAN DEFAULT false,
  max_carry_over_days INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy insights (AI-generated insights for leave policies)
CREATE TABLE IF NOT EXISTS policy_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES leave_policies(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Structured salary grades
CREATE TABLE IF NOT EXISTS salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  min_salary DECIMAL(15,2) NOT NULL,
  max_salary DECIMAL(15,2) NOT NULL,
  notches JSONB DEFAULT '[]'::jsonb, -- Array of {step: number, amount: number}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unstructured salary grades
CREATE TABLE IF NOT EXISTS unstructured_salary_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  general_increment_type TEXT CHECK (general_increment_type IN ('percentage', 'fixed')),
  general_increment_value DECIMAL(15,2) NOT NULL,
  performance_increment_type TEXT CHECK (performance_increment_type IN ('percentage', 'fixed')),
  performance_increment_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HR documents table
CREATE TABLE IF NOT EXISTS hr_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  document_type TEXT, -- 'policy', 'handbook', 'form', etc.
  file_url TEXT,
  file_id TEXT,
  file_size INTEGER, -- in bytes
  uploaded_by UUID,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted'))
);

-- =====================================================
-- 3. PAYROLL CONFIGURATION SETTINGS
-- =====================================================

-- Payroll configuration table (updated)
CREATE TABLE IF NOT EXISTS payroll_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  pay_frequency TEXT DEFAULT 'monthly' CHECK (pay_frequency IN ('weekly', 'biweekly', 'monthly')),
  currency TEXT DEFAULT 'ghs' CHECK (currency IN ('ghs', 'usd', 'eur', 'ngn')),
  minimum_wage DECIMAL(15,2) DEFAULT 18.15,
  weekday_overtime_rate DECIMAL(5,2) DEFAULT 1.5,
  weekend_overtime_rate DECIMAL(5,2) DEFAULT 2.0,
  payroll_cutoff_day INTEGER DEFAULT 25 CHECK (payroll_cutoff_day BETWEEN 1 AND 31),
  auto_calculate_paye BOOLEAN DEFAULT true,
  auto_calculate_ssnit BOOLEAN DEFAULT true,
  auto_calculate_provident_fund BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Payroll allowances (updated structure)
CREATE TABLE IF NOT EXISTS payroll_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  taxable BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  type TEXT CHECK (type IN ('FIXED', 'VARIABLE', 'PERCENTAGE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- Payroll deductions (updated structure)
CREATE TABLE IF NOT EXISTS payroll_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  recurring BOOLEAN DEFAULT true,
  amount DECIMAL(15,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  type TEXT CHECK (type IN ('FIXED', 'VARIABLE', 'PERCENTAGE')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- Tax rates table with versioning
CREATE TABLE IF NOT EXISTS tax_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  currency TEXT NOT NULL CHECK (currency IN ('ghs', 'usd', 'eur', 'ngn')),
  country TEXT NOT NULL,
  version TEXT NOT NULL,
  effective_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'government_api', 'imported')),
  confidence INTEGER DEFAULT 100 CHECK (confidence BETWEEN 0 AND 100),
  tax_bands JSONB NOT NULL, -- Array of {rate, from, to, cumulativeTax}
  social_security JSONB, -- {employee, employer, total, cap}
  tier2 JSONB, -- {employee, employer, total}
  tier3 JSONB, -- {employee, employer, total}
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  approved_by UUID,
  changes TEXT,
  api_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSNIT rates table
CREATE TABLE IF NOT EXISTS ssnit_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_rate DECIMAL(5,2) DEFAULT 5.5,
  employer_rate DECIMAL(5,2) DEFAULT 13.0,
  total_rate DECIMAL(5,2) DEFAULT 18.5,
  effective_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier 2 rates table
CREATE TABLE IF NOT EXISTS tier2_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_rate DECIMAL(5,2) DEFAULT 5.5,
  employer_rate DECIMAL(5,2) DEFAULT 5.5,
  total_rate DECIMAL(5,2) DEFAULT 11.0,
  effective_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tier 3 rates table
CREATE TABLE IF NOT EXISTS tier3_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_rate DECIMAL(5,2) DEFAULT 5.0,
  employer_rate DECIMAL(5,2) DEFAULT 5.0,
  total_rate DECIMAL(5,2) DEFAULT 10.0,
  effective_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API status tracking for government tax APIs
CREATE TABLE IF NOT EXISTS tax_api_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL UNIQUE,
  connected BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  status TEXT DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  error_message TEXT,
  api_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. NOTIFICATION SETTINGS
-- =====================================================

-- Notification templates (updated structure)
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'HR', 'Payroll', 'Leave', 'Attendance'
  type TEXT NOT NULL CHECK (type IN ('Email', 'SMS', 'Push')),
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Draft', 'Inactive')),
  subject TEXT,
  body TEXT,
  variables JSONB DEFAULT '[]'::jsonb, -- Array of variable names
  description TEXT,
  last_modified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email configuration (updated structure)
CREATE TABLE IF NOT EXISTS email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'smtp' CHECK (provider IN ('smtp', 'sendgrid', 'mailgun', 'ses')),
  smtp_host TEXT,
  smtp_port INTEGER DEFAULT 587,
  smtp_username TEXT,
  smtp_password TEXT, -- Should be encrypted
  from_email TEXT NOT NULL,
  from_name TEXT,
  reply_to TEXT,
  enable_tls BOOLEAN DEFAULT true,
  enable_ssl BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Notification settings (updated structure)
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  payroll_notifications BOOLEAN DEFAULT true,
  leave_notifications BOOLEAN DEFAULT true,
  attendance_alerts BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT true,
  system_maintenance_alerts BOOLEAN DEFAULT true,
  email_digest TEXT DEFAULT 'daily' CHECK (email_digest IN ('daily', 'weekly', 'monthly', 'never')),
  sms_alerts BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- =====================================================
-- 5. ROLES SETTINGS
-- =====================================================

-- Roles table (updated structure)
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of permission strings
  is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- 'HR', 'Payroll', 'Settings', etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- User roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID,
  UNIQUE(user_id, role_id, company_id)
);

-- View for role user counts
CREATE OR REPLACE VIEW role_user_counts AS
SELECT 
  r.id,
  r.name,
  r.description,
  r.permissions,
  r.company_id,
  COUNT(ur.user_id) as user_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
GROUP BY r.id, r.name, r.description, r.permissions, r.company_id;

-- =====================================================
-- 6. ACCESS CONTROL SETTINGS
-- =====================================================

-- Access control settings table
CREATE TABLE IF NOT EXISTS access_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,
  password_expiry_enabled BOOLEAN DEFAULT true,
  session_timeout INTEGER DEFAULT 30, -- in minutes
  max_login_attempts INTEGER DEFAULT 5,
  password_min_length INTEGER DEFAULT 8,
  ip_restrictions_enabled BOOLEAN DEFAULT false,
  allowed_ips JSONB DEFAULT '[]'::jsonb, -- Array of IP addresses/ranges
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Active sessions table
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  ip_address TEXT,
  device TEXT,
  user_agent TEXT,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Login attempts tracking
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN DEFAULT false,
  failure_reason TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. SECURITY SETTINGS
-- =====================================================

-- Security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  data_encryption_enabled BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency TEXT DEFAULT 'daily' CHECK (backup_frequency IN ('daily', 'weekly', 'monthly')),
  data_retention_days INTEGER DEFAULT 90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Audit logs table (updated structure)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT, -- 'employee', 'payroll', 'settings', etc.
  resource_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  severity TEXT DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high')),
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Backup history table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  backup_type TEXT DEFAULT 'automatic' CHECK (backup_type IN ('automatic', 'manual')),
  backup_size BIGINT, -- in bytes
  backup_status TEXT DEFAULT 'completed' CHECK (backup_status IN ('pending', 'in_progress', 'completed', 'failed')),
  backup_location TEXT,
  file_name TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  initiated_by UUID
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Subsidiaries indexes
CREATE INDEX IF NOT EXISTS idx_subsidiaries_company_id ON subsidiaries(company_id);
CREATE INDEX IF NOT EXISTS idx_subsidiaries_status ON subsidiaries(status);
CREATE INDEX IF NOT EXISTS idx_subsidiary_sync_logs_subsidiary_id ON subsidiary_sync_logs(subsidiary_id);

-- HR configuration indexes
CREATE INDEX IF NOT EXISTS idx_hr_configuration_company_id ON hr_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_policies_company_id ON leave_policies(company_id);
CREATE INDEX IF NOT EXISTS idx_salary_grades_company_id ON salary_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_unstructured_salary_grades_company_id ON unstructured_salary_grades(company_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_company_id ON hr_documents(company_id);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_configuration_company_id ON payroll_configuration(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_allowances_company_id ON payroll_allowances(company_id);
CREATE INDEX IF NOT EXISTS idx_payroll_deductions_company_id ON payroll_deductions(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_company_id ON tax_rates(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_rates_currency ON tax_rates(currency);
CREATE INDEX IF NOT EXISTS idx_tax_rates_status ON tax_rates(status);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_templates_company_id ON notification_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_category ON notification_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_configurations_company_id ON email_configurations(company_id);
CREATE INDEX IF NOT EXISTS idx_notification_settings_company_id ON notification_settings(company_id);

-- Roles indexes
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- Access control indexes
CREATE INDEX IF NOT EXISTS idx_access_control_settings_company_id ON access_control_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_company_id ON active_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_email ON login_attempts(user_email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_security_settings_company_id ON security_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_history_company_id ON backup_history(company_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Simple, non-recursive policies to prevent infinite recursion
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiary_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE unstructured_salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssnit_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier2_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier3_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_api_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all for authenticated users" ON subsidiaries;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON subsidiaries;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON subsidiary_sync_logs;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON subsidiary_sync_logs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON hr_configuration;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON hr_configuration;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON leave_policies;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON leave_policies;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON policy_insights;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON policy_insights;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON salary_grades;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON salary_grades;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON unstructured_salary_grades;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON unstructured_salary_grades;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON hr_documents;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON hr_documents;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll_configuration;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON payroll_configuration;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll_allowances;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON payroll_allowances;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll_deductions;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON payroll_deductions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tax_rates;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON tax_rates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON ssnit_rates;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON ssnit_rates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tier2_rates;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON tier2_rates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tier3_rates;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON tier3_rates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tax_api_status;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON tax_api_status;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON notification_templates;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON notification_templates;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON email_configurations;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON email_configurations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON notification_settings;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON notification_settings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON roles;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON roles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON permissions;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON permissions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON role_permissions;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON role_permissions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_roles;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON user_roles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON access_control_settings;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON access_control_settings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON active_sessions;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON active_sessions;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON login_attempts;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON login_attempts;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON security_settings;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON security_settings;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON audit_logs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON backup_history;
DROP POLICY IF EXISTS "Allow all for anonymous users" ON backup_history;

-- Create simple, permissive policies for all tables
CREATE POLICY "Allow all for authenticated users" ON subsidiaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON subsidiaries FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON subsidiary_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON subsidiary_sync_logs FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON hr_configuration FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON hr_configuration FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON leave_policies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON leave_policies FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON policy_insights FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON policy_insights FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON salary_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON salary_grades FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON unstructured_salary_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON unstructured_salary_grades FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON hr_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON hr_documents FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON payroll_configuration FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON payroll_configuration FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON payroll_allowances FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON payroll_allowances FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON payroll_deductions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON payroll_deductions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tax_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON tax_rates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON ssnit_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON ssnit_rates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tier2_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON tier2_rates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tier3_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON tier3_rates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON tax_api_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON tax_api_status FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON notification_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON notification_templates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON email_configurations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON email_configurations FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON notification_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON notification_settings FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON roles FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON permissions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON role_permissions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON user_roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON user_roles FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON access_control_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON access_control_settings FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON active_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON active_sessions FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON login_attempts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON login_attempts FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON security_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON security_settings FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON audit_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON audit_logs FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON backup_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anonymous users" ON backup_history FOR ALL TO anon USING (true) WITH CHECK (true);

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Insert default HR configuration for existing companies
INSERT INTO hr_configuration (company_id, leave_year_start, probation_period, working_hours_per_day, working_days_per_week)
SELECT id, 'January', 3, 8, 5
FROM companies
WHERE id NOT IN (SELECT company_id FROM hr_configuration)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default payroll configuration for existing companies
INSERT INTO payroll_configuration (company_id, pay_frequency, currency, minimum_wage)
SELECT id, 'monthly', 'ghs', 18.15
FROM companies
WHERE id NOT IN (SELECT company_id FROM payroll_configuration)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default notification settings for existing companies
INSERT INTO notification_settings (company_id)
SELECT id
FROM companies
WHERE id NOT IN (SELECT company_id FROM notification_settings)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default access control settings for existing companies
INSERT INTO access_control_settings (company_id)
SELECT id
FROM companies
WHERE id NOT IN (SELECT company_id FROM access_control_settings)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default security settings for existing companies
INSERT INTO security_settings (company_id)
SELECT id
FROM companies
WHERE id NOT IN (SELECT company_id FROM security_settings)
ON CONFLICT (company_id) DO NOTHING;

-- Insert default permissions
INSERT INTO permissions (name, description, category) VALUES
  ('view_employees', 'View employee information', 'HR'),
  ('edit_employees', 'Edit employee information', 'HR'),
  ('delete_employees', 'Delete employees', 'HR'),
  ('view_payroll', 'View payroll information', 'Payroll'),
  ('process_payroll', 'Process payroll', 'Payroll'),
  ('view_settings', 'View system settings', 'Settings'),
  ('edit_settings', 'Edit system settings', 'Settings'),
  ('manage_roles', 'Manage roles and permissions', 'Settings'),
  ('view_reports', 'View reports and analytics', 'Reports'),
  ('export_data', 'Export data', 'Reports')
ON CONFLICT (name) DO NOTHING;

-- Insert default tax API status
INSERT INTO tax_api_status (country, connected, status, api_endpoint) VALUES
  ('Ghana', true, 'active', 'https://api.gra.gov.gh/tax-rates'),
  ('Nigeria', false, 'inactive', 'https://api.firs.gov.ng/tax-rates'),
  ('USA', false, 'inactive', 'https://api.irs.gov/tax-rates')
ON CONFLICT (country) DO NOTHING;

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
DROP TRIGGER IF EXISTS update_subsidiaries_updated_at ON subsidiaries;
CREATE TRIGGER update_subsidiaries_updated_at BEFORE UPDATE ON subsidiaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hr_configuration_updated_at ON hr_configuration;
CREATE TRIGGER update_hr_configuration_updated_at BEFORE UPDATE ON hr_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_policies_updated_at ON leave_policies;
CREATE TRIGGER update_leave_policies_updated_at BEFORE UPDATE ON leave_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_grades_updated_at ON salary_grades;
CREATE TRIGGER update_salary_grades_updated_at BEFORE UPDATE ON salary_grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_unstructured_salary_grades_updated_at ON unstructured_salary_grades;
CREATE TRIGGER update_unstructured_salary_grades_updated_at BEFORE UPDATE ON unstructured_salary_grades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_configuration_updated_at ON payroll_configuration;
CREATE TRIGGER update_payroll_configuration_updated_at BEFORE UPDATE ON payroll_configuration FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_allowances_updated_at ON payroll_allowances;
CREATE TRIGGER update_payroll_allowances_updated_at BEFORE UPDATE ON payroll_allowances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_deductions_updated_at ON payroll_deductions;
CREATE TRIGGER update_payroll_deductions_updated_at BEFORE UPDATE ON payroll_deductions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ssnit_rates_updated_at ON ssnit_rates;
CREATE TRIGGER update_ssnit_rates_updated_at BEFORE UPDATE ON ssnit_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tier2_rates_updated_at ON tier2_rates;
CREATE TRIGGER update_tier2_rates_updated_at BEFORE UPDATE ON tier2_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tier3_rates_updated_at ON tier3_rates;
CREATE TRIGGER update_tier3_rates_updated_at BEFORE UPDATE ON tier3_rates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_configurations_updated_at ON email_configurations;
CREATE TRIGGER update_email_configurations_updated_at BEFORE UPDATE ON email_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_access_control_settings_updated_at ON access_control_settings;
CREATE TRIGGER update_access_control_settings_updated_at BEFORE UPDATE ON access_control_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_settings_updated_at ON security_settings;
CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tax_api_status_updated_at ON tax_api_status;
CREATE TRIGGER update_tax_api_status_updated_at BEFORE UPDATE ON tax_api_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
