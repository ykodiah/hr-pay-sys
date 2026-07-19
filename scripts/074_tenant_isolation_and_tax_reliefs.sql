-- Tenant isolation + tax_reliefs durability.
-- Safe to re-run.

-- ============================================================================
-- 1) get_current_user_company_id — prefer users.company_id, never hardcode
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT u.company_id FROM public.users u WHERE u.id = auth.uid() LIMIT 1),
    NULLIF(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid,
    NULLIF(auth.jwt() -> 'user_metadata' ->> 'company_id', '')::uuid,
    (
      SELECT e.company_id
      FROM public.employee_profiles ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE ep.id = auth.uid()
      LIMIT 1
    ),
    (
      SELECT e.company_id
      FROM public.employees e
      WHERE e.id = auth.uid()
      LIMIT 1
    )
  );
$$;

COMMENT ON FUNCTION public.get_current_user_company_id() IS
  'Resolves tenant company from users.company_id, JWT metadata, or employee profile. Never hardcodes a tenant.';

-- ============================================================================
-- 2) tax_reliefs — natural key for upsert + settings_data JSON backup column path
-- ============================================================================
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS annual_amount NUMERIC DEFAULT 0;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GHS';
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code TEXT;

-- Unique active gra_code per company (enables upsert)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tax_reliefs_company_gra_code_active
  ON public.tax_reliefs (company_id, gra_code)
  WHERE company_id IS NOT NULL
    AND gra_code IS NOT NULL
    AND coalesce(is_active, true) = true;

CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company_active
  ON public.tax_reliefs (company_id, is_active);

-- Ensure company_settings can hold JSON catalog backup
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS settings_data JSONB DEFAULT '{}'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_company_id_unique
  ON public.company_settings(company_id)
  WHERE company_id IS NOT NULL;

-- companies.settings_data fallback
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS settings_data JSONB DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
