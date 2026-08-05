-- Sync employee_loans columns required by loan create / payroll / advanced workflows.
-- Fixes: Could not find the 'principal_amount' column of 'employee_loans' in the schema cache
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Core / payroll columns (049 + 091)
-- ---------------------------------------------------------------------------
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'Personal Loan';
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS principal NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(8, 4) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS repayment_months INT DEFAULT 1;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMPTZ;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS auto_deduct BOOLEAN DEFAULT true;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- Advanced / UI create path columns (090 + 094) — includes principal_amount
-- ---------------------------------------------------------------------------
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS loan_type_id UUID;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS principal_amount NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS tenure_months INTEGER;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS interest_type TEXT DEFAULT 'fixed';
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS expected_total_payment NUMERIC(15, 2);
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS total_interest NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS processing_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS insurance_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS admin_fee NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS total_charges NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS initiated_by UUID;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS initiated_by_role VARCHAR(50) DEFAULT 'admin';
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS disbursement_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS first_payment_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS final_payment_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS last_payroll_run_id UUID;

-- FK for loan_type_id (best-effort)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loan_types')
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.table_constraints
       WHERE table_schema = 'public' AND table_name = 'employee_loans' AND constraint_name = 'employee_loans_loan_type_id_fkey'
     )
  THEN
    ALTER TABLE public.employee_loans
      ADD CONSTRAINT employee_loans_loan_type_id_fkey
      FOREIGN KEY (loan_type_id) REFERENCES public.loan_types(id) ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Backfill aliases so both payroll + advanced readers work
-- ---------------------------------------------------------------------------
UPDATE public.employee_loans
SET principal_amount = principal
WHERE principal_amount IS NULL AND principal IS NOT NULL;

UPDATE public.employee_loans
SET principal = principal_amount
WHERE (principal IS NULL OR principal = 0) AND principal_amount IS NOT NULL AND principal_amount > 0;

UPDATE public.employee_loans
SET tenure_months = repayment_months
WHERE tenure_months IS NULL AND repayment_months IS NOT NULL;

UPDATE public.employee_loans
SET repayment_months = tenure_months
WHERE (repayment_months IS NULL OR repayment_months = 0) AND tenure_months IS NOT NULL;

UPDATE public.employee_loans
SET monthly_installment = monthly_payment
WHERE monthly_installment IS NULL AND monthly_payment IS NOT NULL;

UPDATE public.employee_loans
SET monthly_payment = monthly_installment
WHERE (monthly_payment IS NULL OR monthly_payment = 0) AND monthly_installment IS NOT NULL;

UPDATE public.employee_loans
SET outstanding_balance = COALESCE(outstanding_balance, remaining_balance, principal_amount, principal, 0)
WHERE outstanding_balance IS NULL;

UPDATE public.employee_loans
SET remaining_balance = COALESCE(remaining_balance, outstanding_balance, principal_amount, principal, 0)
WHERE remaining_balance IS NULL;

UPDATE public.employee_loans
SET interest_type = COALESCE(NULLIF(TRIM(interest_type), ''), 'fixed')
WHERE interest_type IS NULL OR TRIM(interest_type) = '';

UPDATE public.employee_loans
SET approval_status = CASE
  WHEN status IN ('active', 'approved', 'completed') THEN 'approved'
  WHEN status IN ('rejected', 'cancelled') THEN status
  ELSE 'pending'
END
WHERE approval_status IS NULL;

-- ---------------------------------------------------------------------------
-- Indexes / grants / RLS
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_employee_loans_company_status ON public.employee_loans(company_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_loans_employee ON public.employee_loans(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_type ON public.employee_loans(loan_type_id);
CREATE INDEX IF NOT EXISTS idx_employee_loans_approval ON public.employee_loans(approval_status);

ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employee_loans_all ON public.employee_loans;
CREATE POLICY employee_loans_all ON public.employee_loans FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.employee_loans TO authenticated, anon, service_role;

COMMENT ON COLUMN public.employee_loans.principal_amount IS
  'Alias of principal used by advanced loan APIs; keep in sync with principal';
COMMENT ON COLUMN public.employee_loans.principal IS
  'Payroll-compatible principal; keep in sync with principal_amount';

-- After running in Supabase SQL editor, reload PostgREST schema cache if needed:
-- NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
