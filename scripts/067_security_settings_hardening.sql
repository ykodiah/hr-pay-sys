-- Harden Security persistence for Settings > Security.
-- Safe to re-run.

-- ----------------------------------------------------------------------------
-- security_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
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

ALTER TABLE public.security_settings
  ADD COLUMN IF NOT EXISTS data_encryption_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS audit_logging_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_backup_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS backup_frequency VARCHAR(30) DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS backup_retention_days INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS data_retention_days INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS gdpr_compliance_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_anonymization_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_settings_company
  ON public.security_settings(company_id);

-- ----------------------------------------------------------------------------
-- backup_history
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.backup_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
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

ALTER TABLE public.backup_history
  ADD COLUMN IF NOT EXISTS backup_type VARCHAR(30) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS backup_status VARCHAR(30) DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS backup_size BIGINT,
  ADD COLUMN IF NOT EXISTS backup_location TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS triggered_by VARCHAR(50) DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS triggered_by_user UUID;

CREATE INDEX IF NOT EXISTS idx_backup_history_company ON public.backup_history(company_id);
CREATE INDEX IF NOT EXISTS idx_backup_history_started ON public.backup_history(company_id, started_at DESC);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  action VARCHAR(255),
  ip_address VARCHAR(100),
  severity VARCHAR(20) DEFAULT 'low',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS action VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100),
  ADD COLUMN IF NOT EXISTS severity VARCHAR(20) DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(company_id, created_at DESC);

-- Seed a baseline security_settings row for companies without one.
INSERT INTO public.security_settings (company_id)
SELECT c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.security_settings s WHERE s.company_id = c.id
)
ON CONFLICT (company_id) DO NOTHING;
