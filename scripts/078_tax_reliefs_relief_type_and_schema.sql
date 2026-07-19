-- =============================================================================
-- 078: Align tax_reliefs.relief_type + full catalog schema
-- Fixes: violates check constraint "tax_relief_relief_type_check"
-- Safe / idempotent. Run in Supabase SQL editor.
-- =============================================================================

-- 1) Ensure core columns exist (legacy + modern aliases)
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_name TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS amount NUMERIC DEFAULT 0;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS annual_amount NUMERIC DEFAULT 0;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'GHS';
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Personal';
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_type TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code TEXT;

-- Widen short VARCHAR columns that break GRA names
DO $$
DECLARE
  col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'name', 'relief_name', 'description', 'relief_code', 'gra_code',
    'code', 'category', 'currency', 'relief_type'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = col
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.tax_reliefs ALTER COLUMN %I TYPE TEXT USING %I::text',
        col, col
      );
    END IF;
  END LOOP;
END $$;

-- 2) Drop legacy restrictive relief_type checks (name variants)
ALTER TABLE public.tax_reliefs DROP CONSTRAINT IF EXISTS tax_relief_relief_type_check;
ALTER TABLE public.tax_reliefs DROP CONSTRAINT IF EXISTS tax_reliefs_relief_type_check;
ALTER TABLE public.tax_reliefs DROP CONSTRAINT IF EXISTS tax_reliefs_relief_type_check1;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'tax_reliefs'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%relief_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.tax_reliefs DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- 3) Backfill relief_type to values apps understand
UPDATE public.tax_reliefs
SET relief_type = CASE
  WHEN lower(coalesce(relief_type, '')) IN ('percentage', 'percent', '%') THEN 'percentage'
  WHEN lower(coalesce(category, '')) LIKE '%disab%' THEN 'percentage'
  WHEN coalesce(nullif(btrim(relief_type), ''), '') <> '' THEN lower(btrim(relief_type))
  ELSE 'fixed'
END
WHERE relief_type IS NULL
   OR btrim(relief_type) = ''
   OR lower(relief_type) NOT IN ('fixed', 'percentage', 'standard', 'personal', 'other', 'custom');

-- Normalize known variants
UPDATE public.tax_reliefs
SET relief_type = 'percentage'
WHERE lower(relief_type) IN ('percent', '%', 'pct');

UPDATE public.tax_reliefs
SET relief_type = 'fixed'
WHERE lower(relief_type) IN ('amount', 'flat', 'standard', 'personal', 'other', 'custom')
   OR relief_type IS NULL
   OR btrim(relief_type) = '';

ALTER TABLE public.tax_reliefs ALTER COLUMN relief_type SET DEFAULT 'fixed';

-- Permissive check matching app write path (fixed | percentage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tax_reliefs_relief_type_check'
      AND conrelid = 'public.tax_reliefs'::regclass
  ) THEN
    ALTER TABLE public.tax_reliefs
      ADD CONSTRAINT tax_reliefs_relief_type_check
      CHECK (relief_type IS NULL OR lower(relief_type) IN ('fixed', 'percentage'));
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not add relief_type check: %', SQLERRM;
END $$;

-- 4) Backfill name / code aliases
UPDATE public.tax_reliefs
SET relief_name = COALESCE(NULLIF(BTRIM(relief_name), ''), NULLIF(BTRIM(name), ''), 'Tax relief')
WHERE relief_name IS NULL OR BTRIM(relief_name) = '';

UPDATE public.tax_reliefs
SET name = COALESCE(NULLIF(BTRIM(name), ''), NULLIF(BTRIM(relief_name), ''), 'Tax relief')
WHERE name IS NULL OR BTRIM(name) = '';

UPDATE public.tax_reliefs
SET relief_code = COALESCE(
  NULLIF(BTRIM(relief_code), ''),
  NULLIF(BTRIM(gra_code), ''),
  NULLIF(BTRIM(code), ''),
  'CUSTOM'
)
WHERE relief_code IS NULL OR BTRIM(relief_code) = '';

UPDATE public.tax_reliefs
SET gra_code = COALESCE(NULLIF(BTRIM(gra_code), ''), NULLIF(BTRIM(relief_code), ''), NULLIF(BTRIM(code), ''))
WHERE gra_code IS NULL OR BTRIM(gra_code) = '';

UPDATE public.tax_reliefs
SET code = COALESCE(NULLIF(BTRIM(code), ''), NULLIF(BTRIM(relief_code), ''), NULLIF(BTRIM(gra_code), ''))
WHERE code IS NULL OR BTRIM(code) = '';

-- 5) employee_tax_reliefs assignment table (required for Assign / Bulk)
CREATE TABLE IF NOT EXISTS public.employee_tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS tax_relief_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS tax_year INTEGER;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS override_amount NUMERIC;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_name TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_file_type TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_size BIGINT DEFAULT 0;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS vault_document_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employee_tax_reliefs_company_employee_relief_year_key'
  ) THEN
    BEGIN
      ALTER TABLE public.employee_tax_reliefs
        ADD CONSTRAINT employee_tax_reliefs_company_employee_relief_year_key
        UNIQUE (company_id, employee_id, tax_relief_id, tax_year);
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Unique constraint skipped (cleanup duplicates first): %', SQLERRM;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company_active
  ON public.tax_reliefs (company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_company_year
  ON public.employee_tax_reliefs (company_id, tax_year, is_active);

-- 6) Inspect helper for app/schema diagnostics
CREATE OR REPLACE FUNCTION public.akwaaba_inspect_tax_reliefs_schema()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cols jsonb;
  checks jsonb;
  types jsonb;
  has_assign boolean;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'column_name', column_name,
    'data_type', data_type,
    'udt_name', udt_name,
    'is_nullable', is_nullable,
    'character_maximum_length', character_maximum_length
  ) ORDER BY ordinal_position), '[]'::jsonb)
  INTO cols
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'tax_reliefs';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'name', c.conname,
    'def', pg_get_constraintdef(c.oid)
  )), '[]'::jsonb)
  INTO checks
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname = 'public' AND t.relname = 'tax_reliefs' AND c.contype = 'c';

  BEGIN
    SELECT COALESCE(jsonb_agg(DISTINCT relief_type), '[]'::jsonb)
    INTO types
    FROM public.tax_reliefs
    WHERE relief_type IS NOT NULL;
  EXCEPTION WHEN undefined_column THEN
    types := '[]'::jsonb;
  END;

  SELECT to_regclass('public.employee_tax_reliefs') IS NOT NULL INTO has_assign;

  RETURN jsonb_build_object(
    'ok', true,
    'table', 'tax_reliefs',
    'columns', cols,
    'check_constraints', checks,
    'distinct_relief_types', types,
    'employee_tax_reliefs_exists', has_assign
  );
END;
$$;

REVOKE ALL ON FUNCTION public.akwaaba_inspect_tax_reliefs_schema() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.akwaaba_inspect_tax_reliefs_schema() TO service_role;
GRANT EXECUTE ON FUNCTION public.akwaaba_inspect_tax_reliefs_schema() TO authenticated;
