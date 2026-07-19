-- =============================================================================
-- 069: Employee tax reliefs (per tax year) + vault link
-- Safe / idempotent. Never assumes company_id (or other columns) already exist.
-- Re-run this entire script after a failed attempt.
-- =============================================================================

-- Helper pattern: create bare tables first, then ADD COLUMN IF NOT EXISTS for
-- every column, then create indexes only after confirming columns exist.

-- ---------------------------------------------------------------------------
-- 1) tax_reliefs catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'name'
  ) THEN
    EXECUTE $u$UPDATE public.tax_reliefs
      SET name = COALESCE(NULLIF(name, ''), 'Tax relief')
      WHERE name IS NULL OR name = ''$u$;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'amount'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs SET amount = COALESCE(amount, 0) WHERE amount IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'annual_amount'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'amount'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs
      SET annual_amount = COALESCE(annual_amount, amount, 0)
      WHERE annual_amount IS NULL';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'annual_amount'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs
      SET annual_amount = COALESCE(annual_amount, 0)
      WHERE annual_amount IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tax_reliefs' AND column_name = 'is_active'
  ) THEN
    EXECUTE 'UPDATE public.tax_reliefs SET is_active = COALESCE(is_active, true) WHERE is_active IS NULL';
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
-- 2) document_vault
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.document_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS employee_name TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS document_type TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS upload_date TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS uploaded_by UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'employee-onboarding';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'employee-document';
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.document_vault ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

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
-- 3) employee_tax_reliefs (may already exist from Phase 1 without company_id)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_tax_reliefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS company_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS employee_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS tax_relief_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS tax_year INTEGER;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS override_amount DECIMAL(15,2);
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_url TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_name TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_file_type VARCHAR(100);
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS document_size BIGINT DEFAULT 0;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS vault_document_id UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS assigned_by UUID;
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.employee_tax_reliefs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'is_active'
  ) THEN
    EXECUTE 'UPDATE public.employee_tax_reliefs
      SET is_active = COALESCE(is_active, true) WHERE is_active IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'tax_year'
  ) THEN
    EXECUTE 'UPDATE public.employee_tax_reliefs
      SET tax_year = COALESCE(tax_year, EXTRACT(YEAR FROM NOW())::INTEGER)
      WHERE tax_year IS NULL';
  END IF;
END $$;

-- Backfill company_id from the employee row when missing
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'employee_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'company_id'
  ) THEN
    EXECUTE '
      UPDATE public.employee_tax_reliefs etr
      SET company_id = e.company_id
      FROM public.employees e
      WHERE etr.employee_id = e.id
        AND etr.company_id IS NULL
        AND e.company_id IS NOT NULL
    ';
  END IF;
END $$;

-- Unique assignment key (only when all columns exist and no null company/employee/relief/year)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'employee_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'tax_relief_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'tax_year'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employee_tax_reliefs_company_employee_relief_year_key'
  ) THEN
    -- Drop orphan null-key rows that would block a unique index (safe: incomplete rows)
    EXECUTE '
      DELETE FROM public.employee_tax_reliefs
      WHERE company_id IS NULL
         OR employee_id IS NULL
         OR tax_relief_id IS NULL
         OR tax_year IS NULL
    ';
    BEGIN
      EXECUTE '
        ALTER TABLE public.employee_tax_reliefs
        ADD CONSTRAINT employee_tax_reliefs_company_employee_relief_year_key
        UNIQUE (company_id, employee_id, tax_relief_id, tax_year)
      ';
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Unique constraint skipped: %', SQLERRM;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'company_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'tax_year'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'is_active'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_company_year
      ON public.employee_tax_reliefs (company_id, tax_year, is_active)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'employee_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'tax_year'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_employee_year
      ON public.employee_tax_reliefs (employee_id, tax_year, is_active)';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'employee_tax_reliefs' AND column_name = 'vault_document_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_employee_tax_reliefs_vault
      ON public.employee_tax_reliefs (vault_document_id)';
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 4) payroll_items / payslips monthly relief total
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payroll_items'
  ) THEN
    EXECUTE 'ALTER TABLE public.payroll_items
      ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payslips'
  ) THEN
    EXECUTE 'ALTER TABLE public.payslips
      ADD COLUMN IF NOT EXISTS tax_relief_total DECIMAL(15,2) DEFAULT 0';
  END IF;
END $$;

COMMENT ON TABLE public.employee_tax_reliefs IS
  'Employee tax relief assignments scoped by company_id and tax_year. No auto-rollover across years.';
