-- Harden notification tables for Settings > Notifications
-- Compatible with older schemas (034 flat prefs / create_notification_system template_name)
-- and newer 059 EAV prefs. Safe to re-run.

-- ----------------------------------------------------------------------------
-- notification_templates
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
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

ALTER TABLE public.notification_templates
  ADD COLUMN IF NOT EXISTS name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS template_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS category VARCHAR(50),
  ADD COLUMN IF NOT EXISTS type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS template_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS body_template TEXT,
  ADD COLUMN IF NOT EXISTS variables JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_system_template BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_modified DATE,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill dual columns
UPDATE public.notification_templates
SET name = template_name
WHERE (name IS NULL OR btrim(name) = '') AND template_name IS NOT NULL;

UPDATE public.notification_templates
SET template_name = name
WHERE (template_name IS NULL OR btrim(template_name) = '') AND name IS NOT NULL;

UPDATE public.notification_templates
SET body = body_template
WHERE (body IS NULL OR btrim(body) = '') AND body_template IS NOT NULL;

UPDATE public.notification_templates
SET body_template = body
WHERE (body_template IS NULL OR btrim(body_template) = '') AND body IS NOT NULL;

UPDATE public.notification_templates
SET type = COALESCE(NULLIF(btrim(type), ''), INITCAP(COALESCE(template_type, 'email')))
WHERE type IS NULL OR btrim(type) = '';

UPDATE public.notification_templates
SET template_type = COALESCE(NULLIF(btrim(template_type), ''), LOWER(COALESCE(type, 'email')))
WHERE template_type IS NULL OR btrim(template_type) = '';

-- ----------------------------------------------------------------------------
-- notification_settings (EAV shape used by Settings API)
-- If an older flat-row table exists, keep it and also ensure EAV columns exist.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID,
  category VARCHAR(100),
  notification_type VARCHAR(100),
  is_enabled BOOLEAN DEFAULT true,
  delivery_method JSONB DEFAULT '["email"]'::jsonb,
  frequency VARCHAR(50) DEFAULT 'immediate',
  -- Flat columns from schema 034 (optional compatibility)
  payroll_notifications BOOLEAN DEFAULT true,
  leave_notifications BOOLEAN DEFAULT true,
  attendance_alerts BOOLEAN DEFAULT true,
  promotion_notifications BOOLEAN DEFAULT true,
  system_maintenance_alerts BOOLEAN DEFAULT true,
  email_digest TEXT DEFAULT 'daily',
  sms_alerts BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  welcome_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS employee_id UUID,
  ADD COLUMN IF NOT EXISTS category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS notification_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS delivery_method JSONB DEFAULT '["email"]'::jsonb,
  ADD COLUMN IF NOT EXISTS frequency VARCHAR(50) DEFAULT 'immediate',
  ADD COLUMN IF NOT EXISTS payroll_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS leave_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS attendance_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS promotion_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS system_maintenance_alerts BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_digest TEXT DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS sms_alerts BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS welcome_notifications BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_settings_company_prefs
  ON public.notification_settings (company_id, category, notification_type)
  WHERE employee_id IS NULL AND category IS NOT NULL AND notification_type IS NOT NULL;

-- ----------------------------------------------------------------------------
-- email_configurations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
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

ALTER TABLE public.email_configurations
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'smtp',
  ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255),
  ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
  ADD COLUMN IF NOT EXISTS smtp_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS smtp_password TEXT,
  ADD COLUMN IF NOT EXISTS from_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS from_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS reply_to VARCHAR(255),
  ADD COLUMN IF NOT EXISTS enable_tls BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS enable_ssl BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notification_templates_company
  ON public.notification_templates(company_id);

CREATE INDEX IF NOT EXISTS idx_notification_settings_company
  ON public.notification_settings(company_id);
