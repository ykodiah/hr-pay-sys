-- Track per-loan payroll repayments so multi-loan employees update independently
-- and payslips can show individual loan payment lines.

ALTER TABLE public.employee_loans
  ADD COLUMN IF NOT EXISTS last_payment_date DATE,
  ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payroll_run_id UUID,
  ADD COLUMN IF NOT EXISTS expected_total_payment NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS total_interest NUMERIC(15,2) DEFAULT 0;

COMMENT ON COLUMN public.employee_loans.monthly_payment IS 'Expected amount to pay each payroll period';
COMMENT ON COLUMN public.employee_loans.amount_paid IS 'Cumulative loan amount paid to date';
COMMENT ON COLUMN public.employee_loans.remaining_balance IS 'Outstanding remaining balance';

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_run_id, loan_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_employee
  ON public.payroll_loan_payments(employee_id, pay_period);
CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_loan
  ON public.payroll_loan_payments(loan_id, payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_run
  ON public.payroll_loan_payments(payroll_run_id);

ALTER TABLE public.payroll_loan_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_loan_payments_all ON public.payroll_loan_payments;
CREATE POLICY payroll_loan_payments_all ON public.payroll_loan_payments
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.payroll_loan_payments TO authenticated, anon, service_role;

-- Ensure amortization schedule can store payslip linkage
ALTER TABLE public.loan_amortization_schedule
  ADD COLUMN IF NOT EXISTS payslip_id UUID,
  ADD COLUMN IF NOT EXISTS payroll_run_id UUID;
