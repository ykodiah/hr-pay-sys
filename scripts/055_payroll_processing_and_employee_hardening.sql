-- =============================================================================
-- 055: Payroll processing hardening + employee ID sequence + profile picture
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS patterns).
-- =============================================================================

-- ── payroll_runs: expand statuses (idempotent with 049) ──────────────────────
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
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS history_locked BOOLEAN DEFAULT false;

-- created_by may reference auth.users, not employees — drop restrictive FK if present
DO $$
DECLARE
  fk_name text;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'public.payroll_runs'::regclass
    AND contype = 'f'
    AND pg_get_constraintdef(oid) ILIKE '%created_by%employees%';
  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.payroll_runs DROP CONSTRAINT %I', fk_name);
  END IF;
END $$;

-- ── payroll_items: Ghana tax / payroll columns ───────────────────────────────
ALTER TABLE public.payroll_items
  ADD COLUMN IF NOT EXISTS allowances JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS deductions JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS ssnit_employee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ssnit_employer NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier2_employee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier2_employer NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier3_employee NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tier3_employer NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paye_taxable_income NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_relief_total NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_deduction NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loan_deduction NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advance_deduction NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_deductions NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS overtime_pay NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bonus_pay NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_year INT,
  ADD COLUMN IF NOT EXISTS calculation_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── payslips table (employee-facing documents) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_item_id UUID UNIQUE REFERENCES public.payroll_items(id) ON DELETE SET NULL,
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  pay_period TEXT NOT NULL,
  pay_period_start DATE,
  pay_period_end DATE,
  pay_date DATE,
  snapshot_employee_name TEXT,
  snapshot_employee_id_no TEXT,
  snapshot_position TEXT,
  snapshot_department TEXT,
  snapshot_ssnit_number TEXT,
  snapshot_bank_name TEXT,
  snapshot_account_number TEXT,
  snapshot_company_name TEXT,
  basic_salary NUMERIC(15,2) DEFAULT 0,
  transport_allowance NUMERIC(15,2) DEFAULT 0,
  housing_allowance NUMERIC(15,2) DEFAULT 0,
  medical_allowance NUMERIC(15,2) DEFAULT 0,
  meal_allowance NUMERIC(15,2) DEFAULT 0,
  communication_allowance NUMERIC(15,2) DEFAULT 0,
  other_allowances NUMERIC(15,2) DEFAULT 0,
  overtime_pay NUMERIC(15,2) DEFAULT 0,
  bonus_pay NUMERIC(15,2) DEFAULT 0,
  gross_pay NUMERIC(15,2) DEFAULT 0,
  ssnit_employee NUMERIC(15,2) DEFAULT 0,
  ssnit_employer NUMERIC(15,2) DEFAULT 0,
  tier2_employee NUMERIC(15,2) DEFAULT 0,
  tier2_employer NUMERIC(15,2) DEFAULT 0,
  tier3_employee NUMERIC(15,2) DEFAULT 0,
  tier3_employer NUMERIC(15,2) DEFAULT 0,
  paye_taxable_income NUMERIC(15,2) DEFAULT 0,
  tax_relief_total NUMERIC(15,2) DEFAULT 0,
  paye_tax NUMERIC(15,2) DEFAULT 0,
  overtime_tax NUMERIC(15,2) DEFAULT 0,
  bonus_tax NUMERIC(15,2) DEFAULT 0,
  loan_deduction NUMERIC(15,2) DEFAULT 0,
  advance_deduction NUMERIC(15,2) DEFAULT 0,
  other_deductions NUMERIC(15,2) DEFAULT 0,
  total_deductions NUMERIC(15,2) DEFAULT 0,
  net_pay NUMERIC(15,2) DEFAULT 0,
  total_employer_cost NUMERIC(15,2) DEFAULT 0,
  loan_balance NUMERIC(15,2) DEFAULT 0,
  calculation_breakdown JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'issued', 'viewed', 'archived')),
  issued_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslips_run ON public.payslips(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips(employee_id, pay_date DESC);
CREATE INDEX IF NOT EXISTS idx_payslips_status ON public.payslips(status);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS payslips_all ON public.payslips;
CREATE POLICY payslips_all ON public.payslips FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.payslips TO authenticated, anon;

-- Issue all draft payslips for a run
CREATE OR REPLACE FUNCTION public.issue_payroll_run_payslips(p_payroll_run_id UUID)
RETURNS TABLE(issued INT, already_issued INT)
LANGUAGE plpgsql
AS $$
DECLARE
  v_issued INT := 0;
  v_already INT := 0;
BEGIN
  SELECT COUNT(*)::INT INTO v_already
  FROM public.payslips
  WHERE payroll_run_id = p_payroll_run_id
    AND status IN ('issued', 'viewed');

  UPDATE public.payslips
  SET status = 'issued',
      issued_at = COALESCE(issued_at, now()),
      updated_at = now()
  WHERE payroll_run_id = p_payroll_run_id
    AND status = 'draft';

  GET DIAGNOSTICS v_issued = ROW_COUNT;
  RETURN QUERY SELECT v_issued, v_already;
END;
$$;

-- Approval audit (idempotent)
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

-- ── Employee profile picture + sequential code helper ────────────────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS profile_picture TEXT,
  ADD COLUMN IF NOT EXISTS direct_supervisor UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS head_of_department UUID REFERENCES public.employees(id) ON DELETE SET NULL;

-- Company-scoped next employee code sequence tracker
CREATE TABLE IF NOT EXISTS public.employee_id_sequences (
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  prefix TEXT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (company_id, prefix)
);

CREATE OR REPLACE FUNCTION public.next_employee_code(p_company_id UUID, p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_next INT;
  v_max INT;
  v_prefix TEXT := upper(regexp_replace(coalesce(p_prefix, 'EMP'), '[^A-Z0-9]', '', 'g'));
BEGIN
  IF length(v_prefix) < 2 THEN
    v_prefix := rpad(v_prefix, 4, 'X');
  ELSIF length(v_prefix) > 8 THEN
    v_prefix := left(v_prefix, 8);
  END IF;

  SELECT COALESCE(MAX(
    CASE
      WHEN employee_id ~ ('^' || v_prefix || '[0-9]+$')
      THEN substring(employee_id from length(v_prefix) + 1)::INT
      ELSE 0
    END
  ), 0) INTO v_max
  FROM public.employees
  WHERE company_id = p_company_id;

  INSERT INTO public.employee_id_sequences (company_id, prefix, last_number, updated_at)
  VALUES (p_company_id, v_prefix, GREATEST(v_max + 1, 1), now())
  ON CONFLICT (company_id, prefix)
  DO UPDATE SET
    last_number = GREATEST(public.employee_id_sequences.last_number + 1, EXCLUDED.last_number),
    updated_at = now()
  RETURNING last_number INTO v_next;

  RETURN v_prefix || lpad(v_next::text, 4, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.next_employee_code(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.issue_payroll_run_payslips(UUID) TO authenticated, anon;
