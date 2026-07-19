-- Employee tax relief assignments (per tax year) + document vault link.
-- Safe to re-run. Tolerates schema drift (missing amount / company_id / etc).

-- ---------------------------------------------------------------------------
-- Harden company tax relief catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL DEFAULT 'Tax relief',
  description TEXT,
  amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'GHS',
  category VARCHAR(50) DEFAULT 'Personal',
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name VARCHAR(150);
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS amount DECIMAL(15,2) DEFAULT 0;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS annual_amount DECIMAL(15,2);
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'GHS';
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Personal';
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS effective_date DATE;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS last_updated TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS gra_code VARCHAR(50);
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS relief_code VARCHAR(50);
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- Sync amount / annual_amount when both exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'amount'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'annual_amount'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs
      SET annual_amount = COALESCE(annual_amount, amount, 0)
      WHERE annual_amount IS NULL';
    EXECUTE 'UPDATE public.tax_reliefs
      SET amount = COALESCE(amount, annual_amount, 0)
      WHERE amount IS NULL';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'is_active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company_active
      ON public.tax_reliefs (company_id, is_active)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Document vault: ensure company_id / category exist before indexing
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID,
  employee_name TEXT,
  document_type TEXT,
  file_name TEXT,
  file_size BIGINT DEFAULT 0,
  file_type TEXT,
  file_url TEXT,
  upload_date TIMESTAMPTZ DEFAULT now(),
  uploaded_by UUID,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  source TEXT DEFAULT 'employee-onboarding',
  category TEXT DEFAULT 'employee-document',
  company_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'employee-document';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'employee-onboarding';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_vault' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'document_vault' AND column_name = 'category'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_document_vault_category
      ON public.document_vault (company_id, category)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Per-employee, per-tax-year assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tax_relief_id UUID NOT NULL REFERENCES public.tax_reliefs(id) ON DELETE CASCADE,
  tax_year INTEGER NOT NULL,
  override_amount DECIMAL(15,2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  document_url TEXT,
  document_name TEXT,
  document_file_type VARCHAR(100),
  document_size BIGINT DEFAULT 0,
  vault_document_id UUID,
  notes TEXT,
  assigned_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, employee_id, tax_relief_id, tax_year)
);

CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_company_year
  ON public.employee_tax_reliefs (company_id, tax_year, is_active);

CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_employee_year
  ON public.employee_tax_reliefs (employee_id, tax_year, is_active);

CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_vault
  ON public.employee_tax_reliefs (vault_document_id);

-- ---------------------------------------------------------------------------
-- payroll_items / payslips monthly relief total
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payroll_items
  ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0;

ALTER TABLE IF EXISTS public.payslips
  ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0;

COMMENT ON TABLE public.employee_tax_reliefs IS
  'Employee tax relief assignments scoped by company_id and tax_year. No auto-rollover across years.';
