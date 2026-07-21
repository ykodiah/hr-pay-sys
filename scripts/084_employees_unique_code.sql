-- =============================================================================
-- 084: Prevent duplicate employee codes / reduce double-create fallout
-- Safe / idempotent. Skips unique index if duplicate codes already exist.
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.employees
    WHERE employee_id IS NOT NULL AND btrim(employee_id) <> ''
    GROUP BY company_id, employee_id
    HAVING COUNT(*) > 1
  ) THEN
    RAISE NOTICE '084: duplicate (company_id, employee_id) rows exist — unique index skipped. Clean duplicates then re-run.';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_company_employee_id_unique
      ON public.employees (company_id, employee_id)
      WHERE employee_id IS NOT NULL AND btrim(employee_id) <> '';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_employees_company_corporate_email
  ON public.employees (company_id, lower(corporate_email))
  WHERE corporate_email IS NOT NULL AND btrim(corporate_email) <> '';

CREATE INDEX IF NOT EXISTS idx_employees_company_personal_email
  ON public.employees (company_id, lower(personal_email))
  WHERE personal_email IS NOT NULL AND btrim(personal_email) <> '';

NOTIFY pgrst, 'reload schema';
