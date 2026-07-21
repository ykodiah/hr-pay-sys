-- Harden Access Control persistence for Settings > Access.
-- Safe to re-run.

-- ----------------------------------------------------------------------------
-- access_control_settings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.access_control_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
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

ALTER TABLE public.access_control_settings
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS password_expiry_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS session_timeout INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS max_login_attempts INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS lockout_duration INTEGER DEFAULT 15,
  ADD COLUMN IF NOT EXISTS password_min_length INTEGER DEFAULT 8,
  ADD COLUMN IF NOT EXISTS password_require_uppercase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_require_lowercase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_require_numbers BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_require_special BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ip_restrictions_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allowed_ips JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Coerce allowed_ips to JSONB when an older text[]/text column exists.
DO $$
DECLARE
  ip_type TEXT;
BEGIN
  SELECT data_type INTO ip_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'access_control_settings'
    AND column_name = 'allowed_ips';

  IF ip_type IS NOT NULL AND ip_type <> 'jsonb' THEN
    ALTER TABLE public.access_control_settings
      ALTER COLUMN allowed_ips TYPE JSONB USING
        CASE
          WHEN allowed_ips IS NULL THEN '[]'::jsonb
          WHEN ip_type = 'ARRAY' THEN to_jsonb(allowed_ips)
          WHEN btrim(allowed_ips::text) = '' THEN '[]'::jsonb
          WHEN left(btrim(allowed_ips::text), 1) = '[' THEN allowed_ips::text::jsonb
          ELSE to_jsonb(string_to_array(allowed_ips::text, ','))
        END;
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'access_control_settings.allowed_ips coercion skipped: %', SQLERRM;
END $$;

ALTER TABLE public.access_control_settings ALTER COLUMN allowed_ips SET DEFAULT '[]'::jsonb;
UPDATE public.access_control_settings SET allowed_ips = '[]'::jsonb WHERE allowed_ips IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_access_control_settings_company
  ON public.access_control_settings(company_id);

-- ----------------------------------------------------------------------------
-- active_sessions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
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

ALTER TABLE public.active_sessions
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS user_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100),
  ADD COLUMN IF NOT EXISTS device VARCHAR(100),
  ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
  ADD COLUMN IF NOT EXISTS os VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_active_sessions_company ON public.active_sessions(company_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_active ON public.active_sessions(company_id, is_active);

-- Seed a baseline access_control_settings row for companies without one.
INSERT INTO public.access_control_settings (company_id)
SELECT c.id
FROM public.companies c
WHERE NOT EXISTS (
  SELECT 1 FROM public.access_control_settings a WHERE a.company_id = c.id
)
ON CONFLICT (company_id) DO NOTHING;
