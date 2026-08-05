-- Persist per-loan payslip summary (Opening / This month / Closing) and
-- strengthen payroll_loan_payments for multi-loan allocation repair.

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS loan_summary_lines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allowance_lines JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS deduction_lines JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.payslips.loan_summary_lines IS
  'Per-loan payslip lines [{loan_id, loan_type, opening_balance, this_month, closing_balance}] for the pay period';

-- Ensure payment rows carry enough detail for opening/closing balances
ALTER TABLE public.payroll_loan_payments
  ADD COLUMN IF NOT EXISTS balance_before NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS balance_after NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payslip_id UUID,
  ADD COLUMN IF NOT EXISTS payroll_run_id UUID,
  ADD COLUMN IF NOT EXISTS pay_period TEXT;

CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_payslip
  ON public.payroll_loan_payments(payslip_id);

CREATE INDEX IF NOT EXISTS idx_payroll_loan_payments_period
  ON public.payroll_loan_payments(company_id, employee_id, pay_period);

-- Backfill interest totals when rate is set but total_interest was never stored
UPDATE public.employee_loans el
SET
  total_interest = ROUND(
    (el.principal * (COALESCE(el.interest_rate, 0) / 100.0 / 12.0) * GREATEST(el.repayment_months, 1))::numeric,
    2
  ),
  expected_total_payment = ROUND(
    (
      el.principal
      + (el.principal * (COALESCE(el.interest_rate, 0) / 100.0 / 12.0) * GREATEST(el.repayment_months, 1))
    )::numeric,
    2
  ),
  updated_at = now()
WHERE COALESCE(el.interest_rate, 0) > 0
  AND COALESCE(el.total_interest, 0) = 0
  AND COALESCE(el.interest_type, 'fixed') IN ('fixed', 'Fixed', 'FIXED');

COMMENT ON COLUMN public.employee_loans.total_interest IS
  'Total interest over the full tenure (method depends on interest_type)';
COMMENT ON COLUMN public.employee_loans.interest_type IS
  'fixed | reducing_balance | daily_compound — drives amortization and total interest';
