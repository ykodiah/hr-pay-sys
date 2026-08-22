-- Payslip loan summary integrity, tax relief quantities / disability %,
-- and portal sync of latest same-period payslips.
-- Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Payslips: loan summary lines + superseded status for re-runs
-- ---------------------------------------------------------------------------
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS loan_summary_lines JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS superseded_by UUID;

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ;

DO $$
BEGIN
  -- Allow superseded alongside existing status values
  ALTER TABLE public.payslips DROP CONSTRAINT IF EXISTS payslips_status_check;
EXCEPTION WHEN undefined_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payslips_status_check'
      AND conrelid = 'public.payslips'::regclass
  ) THEN
    ALTER TABLE public.payslips
      ADD CONSTRAINT payslips_status_check
      CHECK (
        status IS NULL
        OR lower(status) IN (
          'draft', 'issued', 'viewed', 'archived', 'superseded', 'void'
        )
      );
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'payslips_status_check skipped: %', SQLERRM;
END $$;

CREATE INDEX IF NOT EXISTS idx_payslips_employee_period_created
  ON public.payslips (company_id, employee_id, pay_period, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payslips_status_period
  ON public.payslips (company_id, pay_period, status);

-- ---------------------------------------------------------------------------
-- 2) Tax relief catalog: percentage type, unit amount, max quantity
-- ---------------------------------------------------------------------------
ALTER TABLE public.tax_reliefs
  ADD COLUMN IF NOT EXISTS relief_type TEXT DEFAULT 'fixed';

ALTER TABLE public.tax_reliefs
  ADD COLUMN IF NOT EXISTS unit_amount NUMERIC;

ALTER TABLE public.tax_reliefs
  ADD COLUMN IF NOT EXISTS max_quantity INTEGER;

ALTER TABLE public.tax_reliefs
  ADD COLUMN IF NOT EXISTS quantity_label TEXT;

ALTER TABLE public.tax_reliefs
  ADD COLUMN IF NOT EXISTS percentage_rate NUMERIC;

DO $$
BEGIN
  ALTER TABLE public.tax_reliefs DROP CONSTRAINT IF EXISTS tax_reliefs_relief_type_check;
  ALTER TABLE public.tax_reliefs
    ADD CONSTRAINT tax_reliefs_relief_type_check
    CHECK (relief_type IS NULL OR lower(relief_type) IN ('fixed', 'percentage', 'per_unit'));
EXCEPTION WHEN others THEN
  RAISE NOTICE 'tax_reliefs_relief_type_check: %', SQLERRM;
END $$;

-- Disability = 25% of employment/business income (GRA)
UPDATE public.tax_reliefs
SET
  relief_type = 'percentage',
  percentage_rate = 25,
  amount = 25,
  annual_amount = 25,
  unit_amount = NULL,
  max_quantity = 1,
  quantity_label = NULL,
  description = COALESCE(
    NULLIF(BTRIM(description), ''),
    'Granted to persons who prove to the Commissioner-General that they are disabled. Relief is 25% of income from business or employment (GRA).'
  ),
  updated_at = now()
WHERE
  lower(COALESCE(gra_code, relief_code, code, '')) LIKE '%dis%'
  OR lower(COALESCE(name, relief_name, '')) LIKE '%disability%';

-- Child education: GHS 600 per child, max 3
UPDATE public.tax_reliefs
SET
  relief_type = 'per_unit',
  unit_amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), NULLIF(annual_amount, 0), 600),
  amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), 600),
  annual_amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), 600),
  max_quantity = 3,
  quantity_label = 'Children',
  updated_at = now()
WHERE
  lower(COALESCE(gra_code, relief_code, code, '')) LIKE '%cer%'
  OR lower(COALESCE(gra_code, relief_code, code, '')) LIKE '%child%'
  OR lower(COALESCE(name, relief_name, '')) LIKE '%child%education%';

-- Aged dependent relative: GHS 1000 per relative, max 2
UPDATE public.tax_reliefs
SET
  relief_type = 'per_unit',
  unit_amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), NULLIF(annual_amount, 0), 1000),
  amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), 1000),
  annual_amount = COALESCE(NULLIF(unit_amount, 0), NULLIF(amount, 0), 1000),
  max_quantity = 2,
  quantity_label = 'Dependents',
  updated_at = now()
WHERE
  lower(COALESCE(gra_code, relief_code, code, '')) LIKE '%adr%'
  OR lower(COALESCE(name, relief_name, '')) LIKE '%aged%dependent%'
  OR lower(COALESCE(name, relief_name, '')) LIKE '%aged dependant%';

-- ---------------------------------------------------------------------------
-- 3) Employee tax relief assignments: quantity
-- ---------------------------------------------------------------------------
ALTER TABLE public.employee_tax_reliefs
  ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

DO $$
BEGIN
  ALTER TABLE public.employee_tax_reliefs DROP CONSTRAINT IF EXISTS employee_tax_reliefs_quantity_check;
  ALTER TABLE public.employee_tax_reliefs
    ADD CONSTRAINT employee_tax_reliefs_quantity_check
    CHECK (quantity IS NULL OR quantity >= 1);
EXCEPTION WHEN others THEN
  RAISE NOTICE 'employee_tax_reliefs_quantity_check: %', SQLERRM;
END $$;

UPDATE public.employee_tax_reliefs
SET quantity = 1
WHERE quantity IS NULL OR quantity < 1;

-- ---------------------------------------------------------------------------
-- 4) Helper: mark older same-period slips superseded by the latest run
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.akwaaba_supersede_prior_payslips(
  p_company_id UUID,
  p_pay_period TEXT,
  p_keep_run_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  IF p_company_id IS NULL OR p_pay_period IS NULL OR p_keep_run_id IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.payslips AS older
  SET
    status = 'superseded',
    superseded_by = newer.id,
    superseded_at = now(),
    updated_at = now()
  FROM public.payslips AS newer
  WHERE older.company_id = p_company_id
    AND older.pay_period = p_pay_period
    AND older.payroll_run_id IS DISTINCT FROM p_keep_run_id
    AND lower(COALESCE(older.status, 'draft')) IN ('draft', 'issued', 'viewed')
    AND newer.company_id = older.company_id
    AND newer.employee_id = older.employee_id
    AND newer.pay_period = older.pay_period
    AND newer.payroll_run_id = p_keep_run_id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

COMMENT ON FUNCTION public.akwaaba_supersede_prior_payslips IS
  'When payroll is re-run for a period, mark prior employee payslips superseded so the portal serves the latest run.';
