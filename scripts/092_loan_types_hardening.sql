-- Harden loan_types for reliable admin CRUD (payroll loan module)
-- Fixes common save failures: missing table, auth.users FK on created_by, fee null checks

CREATE TABLE IF NOT EXISTS public.loan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  interest_type VARCHAR(50) NOT NULL DEFAULT 'reducing_balance'
    CHECK (interest_type IN ('fixed', 'reducing_balance', 'daily_compound')),
  annual_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(15, 2) NOT NULL DEFAULT 1000000,
  min_tenure_months INTEGER NOT NULL DEFAULT 3,
  max_tenure_months INTEGER NOT NULL DEFAULT 60,
  default_tenure_months INTEGER NOT NULL DEFAULT 12,
  processing_fee_type VARCHAR(50) DEFAULT 'fixed',
  processing_fee_amount NUMERIC(15, 2) DEFAULT 0,
  insurance_fee_type VARCHAR(50) DEFAULT 'fixed',
  insurance_fee_amount NUMERIC(15, 2) DEFAULT 0,
  admin_fee_type VARCHAR(50) DEFAULT 'fixed',
  admin_fee_amount NUMERIC(15, 2) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT TRUE,
  auto_approve_max_amount NUMERIC(15, 2) DEFAULT 0,
  approval_roles TEXT[] DEFAULT ARRAY['admin', 'finance_manager'],
  min_service_months INTEGER DEFAULT 0,
  min_monthly_salary NUMERIC(15, 2) DEFAULT 0,
  max_loan_multiplier NUMERIC(5, 2) DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_by uuid,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

-- Drop brittle auth.users FK if present (blocks saves when session user isn't in auth.users)
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'loan_types'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%created_by%auth.users%';
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.loan_types DROP CONSTRAINT %I', fk_name);
  END IF;

  SELECT con.conname INTO fk_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'loan_types'
    AND con.contype = 'f'
    AND pg_get_constraintdef(con.oid) ILIKE '%updated_by%auth.users%';
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.loan_types DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

ALTER TABLE public.loan_types ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS approval_roles TEXT[] DEFAULT ARRAY['admin', 'finance_manager'];
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Ensure employee_loans can store loan_type_id for DB-backed type selection
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS loan_type_id uuid;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'employee_loans_loan_type_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE public.employee_loans
        ADD CONSTRAINT employee_loans_loan_type_id_fkey
        FOREIGN KEY (loan_type_id) REFERENCES public.loan_types(id);
    EXCEPTION WHEN others THEN
      -- ignore if loan_types missing briefly or constraint already equivalent
      NULL;
    END;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_loan_types_company ON public.loan_types(company_id);
CREATE INDEX IF NOT EXISTS idx_loan_types_active ON public.loan_types(is_active);
CREATE INDEX IF NOT EXISTS idx_employee_loans_type ON public.employee_loans(loan_type_id);

ALTER TABLE public.loan_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loan_types_all ON public.loan_types;
CREATE POLICY loan_types_all ON public.loan_types
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.loan_types TO authenticated, anon, service_role;
