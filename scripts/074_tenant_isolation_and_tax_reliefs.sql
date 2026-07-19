-- Tenant isolation + tax_reliefs durability.
-- Safe to re-run. Does NOT require public.users (table may be absent).

-- ============================================================================
-- 1) get_current_user_company_id — JWT + employee bind; optional users table
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_current_user_company_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  -- Optional public.users profile binding (skip if table does not exist)
  IF to_regclass('public.users') IS NOT NULL THEN
    BEGIN
      EXECUTE
        'SELECT company_id FROM public.users WHERE id = $1 AND company_id IS NOT NULL LIMIT 1'
        INTO v_company_id
        USING auth.uid();
      IF v_company_id IS NOT NULL THEN
        RETURN v_company_id;
      END IF;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      -- ignore
    END;
  END IF;

  -- JWT metadata (app_metadata / user_metadata)
  BEGIN
    v_company_id := NULLIF(auth.jwt() -> 'app_metadata' ->> 'company_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_company_id := NULL;
  END;
  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  BEGIN
    v_company_id := NULLIF(auth.jwt() -> 'user_metadata' ->> 'company_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_company_id := NULL;
  END;
  IF v_company_id IS NOT NULL THEN
    RETURN v_company_id;
  END IF;

  -- employee_profiles → employees
  IF to_regclass('public.employee_profiles') IS NOT NULL
     AND to_regclass('public.employees') IS NOT NULL THEN
    BEGIN
      SELECT e.company_id
      INTO v_company_id
      FROM public.employee_profiles ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE ep.id = auth.uid()
        AND e.company_id IS NOT NULL
      LIMIT 1;
      IF v_company_id IS NOT NULL THEN
        RETURN v_company_id;
      END IF;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      -- ignore
    END;
  END IF;

  -- employees.id = auth.uid()
  IF to_regclass('public.employees') IS NOT NULL THEN
    BEGIN
      SELECT e.company_id
      INTO v_company_id
      FROM public.employees e
      WHERE e.id = auth.uid()
        AND e.company_id IS NOT NULL
      LIMIT 1;
      IF v_company_id IS NOT NULL THEN
        RETURN v_company_id;
      END IF;
    EXCEPTION WHEN undefined_table OR undefined_column THEN
      -- ignore
    END;
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_company_id() IS
  'Resolves tenant company from optional users.company_id, JWT metadata, or employee profile. Never hardcodes a tenant. Safe when public.users is missing.';

-- ============================================================================
-- 2) tax_reliefs — ensure table + columns + natural key for upsert
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  annual_amount NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GHS',
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  gra_code TEXT,
  relief_code TEXT,
  code TEXT
);

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
