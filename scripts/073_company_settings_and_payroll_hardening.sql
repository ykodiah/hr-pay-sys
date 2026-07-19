-- Harden company_settings + payroll catalog schemas for tenant Settings.
-- Fixes: missing company_id on legacy company_settings; tax_reliefs columns.
-- Safe to re-run.

-- ============================================================================
-- 1) company_settings — add company_id and canonical columns
-- ============================================================================
ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS company_id UUID,
  ADD COLUMN IF NOT EXISTS settings_data JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS fiscal_year_start VARCHAR(50) DEFAULT 'January',
  ADD COLUMN IF NOT EXISTS default_currency VARCHAR(10) DEFAULT 'GHS',
  ADD COLUMN IF NOT EXISTS timezone VARCHAR(80) DEFAULT 'Africa/Accra',
  ADD COLUMN IF NOT EXISTS date_format VARCHAR(40) DEFAULT 'DD/MM/YYYY',
  ADD COLUMN IF NOT EXISTS time_format VARCHAR(20) DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS language VARCHAR(20) DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Backfill company_id from companies when 1:1 by id or name match
UPDATE public.company_settings cs
SET company_id = c.id
FROM public.companies c
WHERE cs.company_id IS NULL
  AND (cs.id = c.id OR lower(coalesce(cs.name, '')) = lower(c.name));

-- If still null and exactly one company exists, link it
DO $$
DECLARE
  only_company UUID;
  orphan_count INT;
BEGIN
  SELECT COUNT(*) INTO orphan_count FROM public.company_settings WHERE company_id IS NULL;
  SELECT id INTO only_company FROM public.companies ORDER BY created_at ASC LIMIT 1;
  IF orphan_count > 0 AND only_company IS NOT NULL
     AND (SELECT COUNT(*) FROM public.companies) = 1 THEN
    UPDATE public.company_settings SET company_id = only_company WHERE company_id IS NULL;
  END IF;
END $$;

-- Unique index for upsert onConflict company_id (ignore nulls)
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_company_id_unique
  ON public.company_settings(company_id)
  WHERE company_id IS NOT NULL;

-- FK best-effort (ignore if already exists / bad data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_company_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.company_settings
        ADD CONSTRAINT company_settings_company_id_fkey
        FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Skipping company_settings FK: %', SQLERRM;
    END;
  END IF;
END $$;

-- ============================================================================
-- 2) tax_reliefs catalog columns
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company ON public.tax_reliefs(company_id);
CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company_active ON public.tax_reliefs(company_id, is_active);

-- ============================================================================
-- 3) payroll_allowances / payroll_deductions — ensure company scoping columns
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.payroll_allowances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT true,
  recurring BOOLEAN DEFAULT true,
  amount NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  taxable BOOLEAN DEFAULT false,
  recurring BOOLEAN DEFAULT true,
  amount NUMERIC DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  type TEXT DEFAULT 'FIXED',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payroll_allowances ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.payroll_allowances ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.payroll_deductions ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.payroll_deductions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_allowances_company_code
  ON public.payroll_allowances(company_id, code)
  WHERE company_id IS NOT NULL AND code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_deductions_company_code
  ON public.payroll_deductions(company_id, code)
  WHERE company_id IS NOT NULL AND code IS NOT NULL;

-- ============================================================================
-- 4) paye_tax_bands for live calculator
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.paye_tax_bands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  tax_year INT,
  band_order INT NOT NULL,
  rate NUMERIC NOT NULL DEFAULT 0,
  threshold_amount NUMERIC NOT NULL DEFAULT 0,
  is_remaining_amount BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS tax_year INT;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS band_order INT;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS rate NUMERIC DEFAULT 0;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS threshold_amount NUMERIC DEFAULT 0;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS is_remaining_amount BOOLEAN DEFAULT false;
ALTER TABLE public.paye_tax_bands ADD COLUMN IF NOT EXISTS description TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_paye_tax_bands_company_year_order
  ON public.paye_tax_bands(company_id, tax_year, band_order)
  WHERE company_id IS NOT NULL;

-- Notify PostgREST to reload schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
