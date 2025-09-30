-- Access Control and Security Settings Tables
-- This script creates tables for access control and security settings

-- Access Control Settings table
CREATE TABLE IF NOT EXISTS access_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  -- Authentication Settings
  two_factor_enabled BOOLEAN DEFAULT false,
  sso_enabled BOOLEAN DEFAULT false,
  password_expiry_enabled BOOLEAN DEFAULT false,
  password_expiry_days INTEGER DEFAULT 90,
  
  -- Session Settings
  session_timeout_minutes INTEGER DEFAULT 30,
  max_login_attempts INTEGER DEFAULT 5,
  lockout_duration_minutes INTEGER DEFAULT 15,
  
  -- Password Policy
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_special BOOLEAN DEFAULT true,
  
  -- IP Restrictions
  ip_restrictions_enabled BOOLEAN DEFAULT false,
  allowed_ips JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(company_id, subsidiary_id)
);

-- Active Sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  session_token TEXT NOT NULL,
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  device VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT true
);

-- Security Settings table
CREATE TABLE IF NOT EXISTS security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  -- Encryption & Security
  data_encryption_enabled BOOLEAN DEFAULT true,
  audit_logging_enabled BOOLEAN DEFAULT true,
  
  -- Backup Settings
  auto_backup_enabled BOOLEAN DEFAULT true,
  backup_frequency VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  backup_retention_days INTEGER DEFAULT 30,
  last_backup_at TIMESTAMPTZ,
  last_backup_size VARCHAR(50),
  backup_status VARCHAR(50) DEFAULT 'ready',
  
  -- Data Retention
  data_retention_days INTEGER DEFAULT 365,
  
  -- Compliance
  gdpr_compliant BOOLEAN DEFAULT true,
  data_anonymization_enabled BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(company_id, subsidiary_id)
);

-- Security Audit Log table (enhanced version of access_logs)
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id),
  
  action VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  user_email VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  severity VARCHAR(20) DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure'
  
  details JSONB,
  metadata JSONB,
  
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Backup History table
CREATE TABLE IF NOT EXISTS backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  backup_type VARCHAR(50) DEFAULT 'automatic', -- 'automatic', 'manual'
  backup_size VARCHAR(50),
  backup_location TEXT,
  backup_status VARCHAR(50) DEFAULT 'completed', -- 'in_progress', 'completed', 'failed'
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_access_settings_company ON access_control_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_access_settings_subsidiary ON access_control_settings(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_employee ON active_sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_company ON active_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_security_settings_company ON security_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_company ON security_audit_log(company_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_backup_history_company ON backup_history(company_id);

-- Enable RLS
ALTER TABLE access_control_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for demo mode)
CREATE POLICY "Allow all access to access_control_settings" ON access_control_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to active_sessions" ON active_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to security_settings" ON security_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to security_audit_log" ON security_audit_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to backup_history" ON backup_history FOR ALL USING (true) WITH CHECK (true);

-- Update triggers
CREATE TRIGGER update_access_control_settings_updated_at BEFORE UPDATE ON access_control_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at BEFORE UPDATE ON security_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_active_sessions_last_activity BEFORE UPDATE ON active_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
