-- Notification Settings Tables
-- This script updates notification tables to support all settings page features

-- Update notification_settings to add subsidiary support
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE;

-- Update notification_templates to add subsidiary support
ALTER TABLE notification_templates
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE;

-- Update email_configurations to add subsidiary support
ALTER TABLE email_configurations
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS enable_tls BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_ssl BOOLEAN DEFAULT false;

-- Notification Preferences table for global settings
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
  
  -- HR Notifications
  employee_welcome_enabled BOOLEAN DEFAULT true,
  leave_notifications_enabled BOOLEAN DEFAULT true,
  promotion_notifications_enabled BOOLEAN DEFAULT true,
  
  -- Payroll & Attendance
  payroll_notifications_enabled BOOLEAN DEFAULT true,
  attendance_alerts_enabled BOOLEAN DEFAULT true,
  system_maintenance_alerts_enabled BOOLEAN DEFAULT true,
  
  -- Delivery Settings
  email_digest_frequency VARCHAR(20) DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'monthly'
  sms_alerts_enabled BOOLEAN DEFAULT false,
  push_notifications_enabled BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(company_id, subsidiary_id)
);

-- Email Test Log table for tracking test emails
CREATE TABLE IF NOT EXISTS email_test_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  email_configuration_id UUID REFERENCES email_configurations(id),
  
  test_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  recipient_email VARCHAR(255),
  error_message TEXT,
  
  tested_at TIMESTAMPTZ DEFAULT NOW(),
  tested_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notification_settings_subsidiary ON notification_settings(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_subsidiary ON notification_templates(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_email_config_subsidiary ON email_configurations(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_company ON notification_preferences(company_id);
CREATE INDEX IF NOT EXISTS idx_email_test_log_company ON email_test_log(company_id);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_test_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to notification_preferences" ON notification_preferences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to email_test_log" ON email_test_log FOR ALL USING (true) WITH CHECK (true);

-- Update trigger
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
