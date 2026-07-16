-- Payroll sync schema: approval workflow columns, audit log, employee_loans.
-- Safe to re-run.

-- ── Expand payroll_runs statuses used by processing / approvals ───────────────
ALTER TABLE public.payroll_runs
  DROP CONSTRAINT IF EXISTS payroll_runs_status_check;

ALTER TABLE public.payroll_runs
  ADD CONSTRAINT payroll_runs_status_check
  CHECK (status IN (
    'draft', 'processing', 'pending', 'completed', 'partial',
    'approved', 'paid', 'rejected', 'cancelled'
  ));

ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS approval_stage TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS hr_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS hr_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finance_reviewed_by UUID,
  ADD COLUMN IF NOT EXISTS finance_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by UUID,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS total_employer_cost NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── Approval audit trail ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payroll_approval_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payroll_approval_audit_run
  ON public.payroll_approval_audit(payroll_run_id, created_at DESC);

ALTER TABLE public.payroll_approval_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payroll_approval_audit_all ON public.payroll_approval_audit;
CREATE POLICY payroll_approval_audit_all ON public.payroll_approval_audit
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.payroll_approval_audit TO authenticated, anon;

-- ── Employee loans (used by Pay Inputs + processPayrollRun) ──────────────────
CREATE TABLE IF NOT EXISTS public.employee_loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  loan_type TEXT NOT NULL DEFAULT 'salary_advance',
  purpose TEXT,
  principal NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  repayment_months INT NOT NULL DEFAULT 1,
  monthly_payment NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(15,2) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  disbursed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'active', 'completed', 'rejected', 'defaulted', 'cancelled')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejected_by UUID,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  auto_deduct BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  loan_setting_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_loans_company_status
  ON public.employee_loans(company_id, status);
CREATE INDEX IF NOT EXISTS idx_employee_loans_employee
  ON public.employee_loans(employee_id);

ALTER TABLE public.employee_loans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS employee_loans_all ON public.employee_loans;
CREATE POLICY employee_loans_all ON public.employee_loans
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.employee_loans TO authenticated, anon;
