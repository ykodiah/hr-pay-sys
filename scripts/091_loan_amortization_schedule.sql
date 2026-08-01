-- Loan amortization schedule used by payroll loan module
-- Compatible with lib/services/loan-service.ts

CREATE TABLE IF NOT EXISTS public.loan_amortization_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES public.employee_loans(id) ON DELETE CASCADE,
  month_number INT NOT NULL,
  due_date DATE NOT NULL,
  payment_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  principal_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_portion NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance_remaining NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'skipped')),
  payslip_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (loan_id, month_number)
);

CREATE INDEX IF NOT EXISTS idx_loan_amort_loan
  ON public.loan_amortization_schedule(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_amort_due
  ON public.loan_amortization_schedule(due_date, status);

ALTER TABLE public.loan_amortization_schedule ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loan_amortization_schedule_all ON public.loan_amortization_schedule;
CREATE POLICY loan_amortization_schedule_all ON public.loan_amortization_schedule
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.loan_amortization_schedule TO authenticated, anon;

-- Ensure payroll-compatible columns exist on employee_loans
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS loan_type TEXT DEFAULT 'Personal Loan';
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS purpose TEXT;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS principal NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(8,4) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS repayment_months INT DEFAULT 1;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS monthly_payment NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(15,2) DEFAULT 0;
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
ALTER TABLE public.employee_loans ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
