-- Professional schema updates for loan register, amortization sync, and payslip line items.
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).

-- ---------------------------------------------------------------------------
-- employee_loans: interest method + payable totals
-- ---------------------------------------------------------------------------
ALTER TABLE public.employee_loans
  ADD COLUMN IF NOT EXISTS interest_type TEXT DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS loan_type_id UUID,
  ADD COLUMN IF NOT EXISTS monthly_installment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS expected_total_payment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_interest NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payroll_run_id UUID,
  ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(15,2);

COMMENT ON COLUMN public.employee_loans.interest_type IS
  'Interest method: fixed | reducing_balance | daily_compound';
COMMENT ON COLUMN public.employee_loans.monthly_payment IS
  'Monthly charge deducted via payroll (same as monthly_installment when present)';
COMMENT ON COLUMN public.employee_loans.expected_total_payment IS
  'Total amount to pay = principal + total interest';
COMMENT ON COLUMN public.employee_loans.amount_paid IS
  'Cumulative loan paid (updated when payroll is approved)';
COMMENT ON COLUMN public.employee_loans.remaining_balance IS
  'Remaining balance = expected_total_payment - amount_paid';

UPDATE public.employee_loans
SET interest_type = COALESCE(NULLIF(TRIM(interest_type), ''), 'fixed')
WHERE interest_type IS NULL OR TRIM(interest_type) = '';

UPDATE public.employee_loans
SET monthly_installment = monthly_payment
WHERE monthly_installment IS NULL AND monthly_payment IS NOT NULL;

-- ---------------------------------------------------------------------------
-- loan_types: ensure interest_type is first-class
-- ---------------------------------------------------------------------------
ALTER TABLE public.loan_types
  ADD COLUMN IF NOT EXISTS interest_type TEXT DEFAULT 'fixed';

COMMENT ON COLUMN public.loan_types.interest_type IS
  'Default interest method for loans of this type: fixed | reducing_balance | daily_compound';

UPDATE public.loan_types
SET interest_type = COALESCE(NULLIF(TRIM(interest_type), ''), 'fixed')
WHERE interest_type IS NULL OR TRIM(interest_type) = '';

-- ---------------------------------------------------------------------------
-- loan_amortization_schedule: payroll linkage + paid tracking
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.loan_amortization_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
  month_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  payment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  principal_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_remaining NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  payslip_id UUID,
  payroll_run_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loan_id, month_number)
);

ALTER TABLE public.loan_amortization_schedule
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paid_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payslip_id UUID,
  ADD COLUMN IF NOT EXISTS payroll_run_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

COMMENT ON COLUMN public.loan_amortization_schedule.paid_amount IS
  'Loan paid for this installment — updates when payroll is approved and reflected on the payslip';
COMMENT ON COLUMN public.loan_amortization_schedule.status IS
  'pending | paid | overdue — updates when payroll is approved';

CREATE INDEX IF NOT EXISTS idx_loan_amort_schedule_loan
  ON public.loan_amortization_schedule(loan_id, month_number);
CREATE INDEX IF NOT EXISTS idx_loan_amort_schedule_status
  ON public.loan_amortization_schedule(loan_id, status);

ALTER TABLE public.loan_amortization_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loan_amortization_schedule_all ON public.loan_amortization_schedule;
CREATE POLICY loan_amortization_schedule_all ON public.loan_amortization_schedule
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.loan_amortization_schedule TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- payroll_loan_payments: per-loan allocation for multi-loan employees
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll_loan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_run_id UUID,
  payslip_id UUID,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
  schedule_id UUID,
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  principal_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_before NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_after NUMERIC(15,2) NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  pay_period TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_loan_payments_run_loan
  ON public.payroll_loan_payments(payroll_run_id, loan_id)
  WHERE payroll_run_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_employee_period
  ON public.payroll_loan_payments(employee_id, pay_period);
CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_loan
  ON public.payroll_loan_payments(loan_id, payment_date DESC);

ALTER TABLE public.payroll_loan_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_loan_payments_all ON public.payroll_loan_payments;
CREATE POLICY payroll_loan_payments_all ON public.payroll_loan_payments
  FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.payroll_loan_payments TO authenticated, anon, service_role;

-- ---------------------------------------------------------------------------
-- payslips: named allowance / deduction line items for exact payslip labels
-- ---------------------------------------------------------------------------
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS allowance_lines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deduction_lines JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.payslips.allowance_lines IS
  'Named issued allowances [{label, code, amount}] — shown as individual payslip lines';
COMMENT ON COLUMN public.payslips.deduction_lines IS
  'Named other deductions [{label, code, amount}] — shown as individual payslip lines';

ALTER TABLE public.payroll_items
  ADD COLUMN IF NOT EXISTS deductions_detail JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.payroll_items.deductions_detail IS
  'Optional detail payload including named deduction lines';
