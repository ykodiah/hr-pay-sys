-- Employee tax relief assignments (per tax year) + document vault link.
-- Safe to re-run. Always scope by company_id for tenant isolation.
-- Compatible with older tax_reliefs schemas that may lack amount / annual_amount.

-- ---------------------------------------------------------------------------
-- Harden company tax relief catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
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

-- Add missing columns one-by-one (IF NOT EXISTS) for schema drift
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
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tax_reliefs ADD COLUMN IF NOT EXISTS name VARCHAR(150);

-- Sync annual_amount <-> amount without assuming either existed before this script
DO $$
BEGIN
  -- Fill annual_amount from amount when amount exists
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
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'annual_amount'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs
      SET annual_amount = COALESCE(annual_amount, 0)
      WHERE annual_amount IS NULL';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tax_reliefs_company_active
  ON public.tax_reliefs (company_id, is_active);

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
-- Ensure payroll_items can store monthly relief total
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.payroll_items
  ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0;

ALTER TABLE IF EXISTS public.payslips
  ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Document vault index for Tax Relief card filtering
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_document_vault_category
  ON public.document_vault (company_id, category);

COMMENT ON TABLE public.employee_tax_reliefs IS
  'Employee tax relief assignments scoped by company_id and tax_year. No auto-rollover across years.';
