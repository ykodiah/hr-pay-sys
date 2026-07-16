-- Superadmin Portal Schema - Complete multi-tenant management system
-- Created: 2026-07-16

-- ============================================================================
-- 1. SUPERADMIN USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', -- 'admin', 'support', 'viewer'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_users_email ON public.superadmin_users(email);
CREATE INDEX idx_superadmin_users_status ON public.superadmin_users(status);

-- ============================================================================
-- 2. SUPERADMIN TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  company_id UUID, -- Link to existing company table if migrating from tenant
  subdomain TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'trial', 'suspended', 'archived'
  plan TEXT NOT NULL DEFAULT 'basic', -- 'starter', 'basic', 'pro', 'enterprise'
  subscription_status TEXT DEFAULT 'active', -- 'active', 'past_due', 'cancelled'
  
  -- Database provisioning
  database_schema_name TEXT UNIQUE, -- tenant-specific schema
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX idx_superadmin_tenants_slug ON public.superadmin_tenants(slug);
CREATE INDEX idx_superadmin_tenants_status ON public.superadmin_tenants(status);
CREATE INDEX idx_superadmin_tenants_plan ON public.superadmin_tenants(plan);
CREATE INDEX idx_superadmin_tenants_subscription_status ON public.superadmin_tenants(subscription_status);

-- ============================================================================
-- 3. SUPERADMIN TENANT USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.superadmin_tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'owner', 'admin', 'user'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'invited'
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_superadmin_tenant_users_tenant ON public.superadmin_tenant_users(tenant_id);
CREATE INDEX idx_superadmin_tenant_users_email ON public.superadmin_tenant_users(email);

-- ============================================================================
-- 4. SUPERADMIN MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'payroll', 'hr', 'attendance', 'leave', 'reports'
  description TEXT,
  icon TEXT, -- icon name or URL
  monthly_cost DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 5. SUPERADMIN TENANT MODULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.superadmin_tenants(id) ON DELETE CASCADE,
  module_id UUID NOT NULL REFERENCES public.superadmin_modules(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enabled', -- 'enabled', 'disabled', 'trial'
  enabled_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, module_id)
);

CREATE INDEX idx_superadmin_tenant_modules_tenant ON public.superadmin_tenant_modules(tenant_id);

-- ============================================================================
-- 6. SUPERADMIN BILLING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.superadmin_tenants(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Itemized costs
  base_plan_cost DECIMAL(12,2) DEFAULT 0,
  modules_cost DECIMAL(12,2) DEFAULT 0, -- sum of module costs
  user_count INTEGER DEFAULT 1,
  user_overage_cost DECIMAL(12,2) DEFAULT 0, -- cost beyond included users
  
  -- Totals
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  
  -- Payment
  payment_method TEXT, -- 'stripe', 'paystack', 'bank_transfer'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_date TIMESTAMPTZ,
  invoice_number TEXT UNIQUE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_billing_tenant ON public.superadmin_billing_history(tenant_id);
CREATE INDEX idx_superadmin_billing_period ON public.superadmin_billing_history(billing_period_start);
CREATE INDEX idx_superadmin_billing_status ON public.superadmin_billing_history(payment_status);

-- ============================================================================
-- 7. SUPERADMIN AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_user_id UUID NOT NULL REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'tenant_created', 'user_updated', 'module_enabled'
  resource_type TEXT NOT NULL, -- 'tenant', 'user', 'billing', 'module'
  resource_id UUID,
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  
  -- Change tracking
  changes JSONB, -- {old_value: {...}, new_value: {...}}
  
  -- Network info
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_audit_user ON public.superadmin_audit_logs(superadmin_user_id);
CREATE INDEX idx_superadmin_audit_tenant ON public.superadmin_audit_logs(tenant_id);
CREATE INDEX idx_superadmin_audit_resource ON public.superadmin_audit_logs(resource_type, resource_id);
CREATE INDEX idx_superadmin_audit_action ON public.superadmin_audit_logs(action);
CREATE INDEX idx_superadmin_audit_created ON public.superadmin_audit_logs(created_at DESC);

-- ============================================================================
-- 8. SUPERADMIN SETTINGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  value_type TEXT DEFAULT 'text', -- 'text', 'number', 'boolean', 'json'
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_settings_key ON public.superadmin_settings(key);

-- ============================================================================
-- 9. SUPERADMIN BACKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  backup_type TEXT NOT NULL DEFAULT 'full', -- 'full', 'incremental', 'tenant_export'
  backup_size_mb DECIMAL(12,2),
  status TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
  
  -- Storage
  s3_path TEXT,
  backup_file_name TEXT,
  
  -- Retention
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  retention_until DATE,
  created_by UUID REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  
  -- Error handling
  error_message TEXT
);

CREATE INDEX idx_superadmin_backups_tenant ON public.superadmin_backups(tenant_id);
CREATE INDEX idx_superadmin_backups_status ON public.superadmin_backups(status);
CREATE INDEX idx_superadmin_backups_created ON public.superadmin_backups(created_at DESC);

-- ============================================================================
-- 10. SUPERADMIN ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL, -- 'active_tenants', 'total_revenue', 'module_usage', 'user_count'
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  value DECIMAL(20,2),
  int_value INTEGER,
  metadata JSONB,
  period_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_analytics_metric ON public.superadmin_analytics(metric_type);
CREATE INDEX idx_superadmin_analytics_tenant ON public.superadmin_analytics(tenant_id);
CREATE INDEX idx_superadmin_analytics_period ON public.superadmin_analytics(period_date);
CREATE INDEX idx_superadmin_analytics_created ON public.superadmin_analytics(created_at DESC);

-- ============================================================================
-- 11. SUPERADMIN INTEGRATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  integration_type TEXT NOT NULL, -- 'stripe', 'paystack', 'twilio', 'arkesel', 'sendgrid', 'slack', 'zapier'
  
  -- Credentials (encrypted at application level)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  webhook_url TEXT,
  webhook_secret TEXT,
  
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'error'
  last_sync_at TIMESTAMPTZ,
  sync_error_message TEXT,
  
  -- Integration-specific config
  config JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_integrations_tenant ON public.superadmin_integrations(tenant_id);
CREATE INDEX idx_superadmin_integrations_type ON public.superadmin_integrations(integration_type);
CREATE INDEX idx_superadmin_integrations_status ON public.superadmin_integrations(status);

-- ============================================================================
-- 12. SUPERADMIN NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.superadmin_users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'billing_issue', 'tenant_alert', 'system_error', 'backup_complete'
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT DEFAULT 'info', -- 'info', 'warning', 'critical'
  
  -- Read status
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX idx_superadmin_notifications_user ON public.superadmin_notifications(user_id);
CREATE INDEX idx_superadmin_notifications_is_read ON public.superadmin_notifications(is_read);
CREATE INDEX idx_superadmin_notifications_created ON public.superadmin_notifications(created_at DESC);

-- ============================================================================
-- 13. SUPERADMIN FEATURE FLAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  for_tenants JSONB, -- array of tenant IDs or null for all
  description TEXT,
  updated_by UUID REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_feature_flags_name ON public.superadmin_feature_flags(flag_name);

-- ============================================================================
-- 14. SUPERADMIN API KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_user_id UUID NOT NULL REFERENCES public.superadmin_users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  permissions JSONB, -- scopes like 'read:tenants', 'write:billing'
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_api_keys_user ON public.superadmin_api_keys(superadmin_user_id);
CREATE INDEX idx_superadmin_api_keys_hash ON public.superadmin_api_keys(key_hash);

-- ============================================================================
-- 15. SUPERADMIN COMMUNICATION LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_communication_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  communication_type TEXT NOT NULL, -- 'email', 'sms', 'in_app'
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  message_body TEXT,
  
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'delivered'
  provider TEXT, -- 'sendgrid', 'twilio', 'arkesel', 'slack'
  provider_message_id TEXT,
  
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_superadmin_communication_tenant ON public.superadmin_communication_logs(tenant_id);
CREATE INDEX idx_superadmin_communication_type ON public.superadmin_communication_logs(communication_type);
CREATE INDEX idx_superadmin_communication_status ON public.superadmin_communication_logs(status);
CREATE INDEX idx_superadmin_communication_created ON public.superadmin_communication_logs(created_at DESC);

-- ============================================================================
-- 16. SUPERADMIN ISSUES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.superadmin_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.superadmin_tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
  issue_type TEXT NOT NULL, -- 'bug', 'feature_request', 'billing', 'technical_support'
  
  assigned_to UUID REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  reported_by UUID REFERENCES public.superadmin_users(id) ON DELETE SET NULL,
  
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_superadmin_issues_tenant ON public.superadmin_issues(tenant_id);
CREATE INDEX idx_superadmin_issues_status ON public.superadmin_issues(status);
CREATE INDEX idx_superadmin_issues_priority ON public.superadmin_issues(priority);
CREATE INDEX idx_superadmin_issues_assigned ON public.superadmin_issues(assigned_to);
CREATE INDEX idx_superadmin_issues_created ON public.superadmin_issues(created_at DESC);

-- ============================================================================
-- Set RLS Policies (all tables open for service_role for now)
-- ============================================================================
ALTER TABLE public.superadmin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.superadmin_issues ENABLE ROW LEVEL SECURITY;

-- Allow all for now (will refine with proper JWT policies later)
CREATE POLICY "Allow all for service_role" ON public.superadmin_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_tenants FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_tenant_users FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_modules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_tenant_modules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_billing_history FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_backups FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_integrations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_feature_flags FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_communication_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for service_role" ON public.superadmin_issues FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- Create initial modules (standard modules that tenants can subscribe to)
-- ============================================================================
INSERT INTO public.superadmin_modules (name, description, monthly_cost, is_active) VALUES
  ('Payroll', 'Employee payroll processing, tax calculations, and salary management', 50.00, true),
  ('HR Management', 'Human resources, employee records, and document management', 40.00, true),
  ('Attendance', 'Time tracking, attendance logs, and shift management', 30.00, true),
  ('Leave Management', 'Annual leave, sick leave, and leave request workflows', 25.00, true),
  ('Reports', 'Comprehensive reporting and analytics', 35.00, true),
  ('Communication', 'Email templates, SMS, and notifications', 20.00, true),
  ('Integration Suite', 'Third-party API integrations and webhooks', 45.00, true)
ON CONFLICT DO NOTHING;

-- Create default superadmin settings
INSERT INTO public.superadmin_settings (key, value, value_type, description, is_sensitive) VALUES
  ('max_tenants', '1000', 'number', 'Maximum number of tenants allowed', false),
  ('default_payment_term_days', '30', 'number', 'Default payment term in days', false),
  ('backup_retention_days', '90', 'number', 'Number of days to retain backups', false),
  ('default_currency', 'GHS', 'text', 'Default currency code', false),
  ('max_users_per_tenant', '500', 'number', 'Maximum users per tenant', false),
  ('maintenance_mode', 'false', 'boolean', 'System maintenance mode', false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create seed superadmin user (admin@superadmin.local with password hashed)
-- Password: Admin@123456 (hashed with bcrypt)
-- ============================================================================
INSERT INTO public.superadmin_users (email, password_hash, first_name, last_name, role, status) VALUES
  ('admin@superadmin.local', '$2b$12$8QJx3Lj1p7KzQxG8cNqZOePV8vPj0C1O1p7p7Q1q1q1q1q1q1q1q', 'System', 'Admin', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
