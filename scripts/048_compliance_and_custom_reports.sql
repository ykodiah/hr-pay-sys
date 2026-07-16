-- Compliance reports, payroll summary view, audit log, and custom report definitions.
-- Safe to re-run (IF NOT EXISTS / OR REPLACE).

-- ── Source view used by lib/services/reports/engine.ts ───────────────────────
-- DROP first: CREATE OR REPLACE VIEW cannot drop/rename columns (42P16).
DROP VIEW IF EXISTS public.v_payroll_report_summary CASCADE;

CREATE VIEW public.v_payroll_report_summary AS
SELECT
  p.company_id,
  p.payroll_run_id,
  COALESCE(p.pay_period, to_char(COALESCE(p.pay_period_start, p.pay_date, p.created_at), 'YYYY-MM')) AS pay_period,
  p.pay_period_start,
  p.pay_period_end,
  p.pay_date,
  p.employee_id,
  TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))) AS employee_name,
  COALESCE(e.employee_id, e.id::text) AS employee_id_no,
  e.position,
  e.department,
  ef.ssnit_number,
  ef.bank_name,
  ef.bank_account_number AS account_number,
  c.name AS company_name,
  COALESCE(e.ghana_card_number, to_jsonb(e)->>'national_id') AS ghana_card_number,
  -- Support both hire_date and date_of_joining schemas without failing the view
  COALESCE(
    NULLIF(to_jsonb(e)->>'hire_date', '')::date,
    NULLIF(to_jsonb(e)->>'date_of_joining', '')::date
  ) AS date_of_joining,
  COALESCE(
    to_jsonb(e)->>'employment_type',
    to_jsonb(e)->>'contract_type',
    to_jsonb(e)->>'employment_status'
  ) AS contract_type,
  COALESCE(p.basic_salary, 0)::numeric AS basic_salary,
  COALESCE(p.transport_allowance, 0)::numeric AS transport_allowance,
  COALESCE(p.housing_allowance, 0)::numeric AS housing_allowance,
  COALESCE(p.medical_allowance, 0)::numeric AS medical_allowance,
  COALESCE(p.meal_allowance, 0)::numeric AS meal_allowance,
  COALESCE(p.communication_allowance, 0)::numeric AS communication_allowance,
  COALESCE(p.other_allowances, 0)::numeric AS other_allowances,
  COALESCE(p.overtime_pay, 0)::numeric AS overtime_pay,
  COALESCE(p.bonus_pay, 0)::numeric AS bonus_pay,
  (
    COALESCE(p.transport_allowance, 0) + COALESCE(p.housing_allowance, 0) +
    COALESCE(p.medical_allowance, 0) + COALESCE(p.meal_allowance, 0) +
    COALESCE(p.communication_allowance, 0) + COALESCE(p.other_allowances, 0)
  )::numeric AS total_allowances,
  COALESCE(p.gross_pay, 0)::numeric AS gross_pay,
  COALESCE(p.ssnit_employee, 0)::numeric AS ssnit_employee,
  COALESCE(p.ssnit_employer, 0)::numeric AS ssnit_employer,
  COALESCE(p.tier2_employee, 0)::numeric AS tier2_employee,
  COALESCE(p.tier2_employer, 0)::numeric AS tier2_employer,
  COALESCE(p.tier3_employee, 0)::numeric AS tier3_employee,
  COALESCE(p.tier3_employer, 0)::numeric AS tier3_employer,
  COALESCE(p.paye_taxable_income, 0)::numeric AS paye_taxable_income,
  COALESCE(p.tax_relief_total, 0)::numeric AS tax_relief_total,
  COALESCE(p.paye_tax, 0)::numeric AS paye_tax,
  COALESCE(p.loan_deduction, 0)::numeric AS loan_deduction,
  COALESCE(p.advance_deduction, 0)::numeric AS advance_deduction,
  COALESCE(p.other_deductions, 0)::numeric AS other_deductions,
  COALESCE(p.total_deductions, 0)::numeric AS total_deductions,
  COALESCE(p.net_pay, 0)::numeric AS net_pay,
  COALESCE(p.total_employer_cost, 0)::numeric AS total_employer_cost,
  (
    COALESCE(p.gross_pay, 0) + COALESCE(p.ssnit_employer, 0) +
    COALESCE(p.tier2_employer, 0) + COALESCE(p.tier3_employer, 0)
  )::numeric AS cost_to_company,
  COALESCE(p.status, 'draft') AS payslip_status,
  NULL::numeric AS loan_amount,
  COALESCE(p.loan_balance, 0)::numeric AS current_loan_balance,
  COALESCE(p.loan_deduction, 0)::numeric AS current_loan_deduction
FROM public.payslips p
LEFT JOIN public.employees e ON e.id = p.employee_id
LEFT JOIN public.employee_financial ef ON ef.employee_id = p.employee_id
LEFT JOIN public.companies c ON c.id = p.company_id;

-- ── Compliance report run history ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_run_id UUID,
  report_type TEXT NOT NULL,
  report_name TEXT NOT NULL,
  pay_period TEXT,
  tax_year INT,
  from_date DATE,
  to_date DATE,
  generated_by UUID,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  row_count INT NOT NULL DEFAULT 0,
  file_path TEXT,
  export_format TEXT NOT NULL DEFAULT 'csv',
  status TEXT NOT NULL DEFAULT 'generated'
    CHECK (status IN ('generated', 'submitted', 'filed', 'voided', 'failed')),
  submitted_at TIMESTAMPTZ,
  submission_ref TEXT,
  notes TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_company_period
  ON public.compliance_reports(company_id, pay_period, report_type);

-- ── Audit log ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.report_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.compliance_reports(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID,
  actor_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_audit_report ON public.report_audit(report_id);

-- ── Custom report definitions (designer) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_report_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom'
    CHECK (category IN ('compliance', 'financial', 'banking', 'payroll', 'custom')),
  data_source TEXT NOT NULL DEFAULT 'payroll'
    CHECK (data_source IN ('payroll', 'employees', 'loans', 'banking')),
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  filters JSONB NOT NULL DEFAULT '[]'::jsonb,
  group_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custom_report_definitions_company
  ON public.custom_report_definitions(company_id, is_active);

-- ── RPCs used by the app ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_report_action(
  p_report_id UUID,
  p_action TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_actor_name TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.report_audit (report_id, action, actor_id, actor_name, notes)
  VALUES (p_report_id, p_action, p_actor_id, p_actor_name, p_notes);
END;
$$;

CREATE OR REPLACE FUNCTION public.file_compliance_report(
  p_report_id UUID,
  p_submission_ref TEXT,
  p_actor_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.compliance_reports
  SET status = 'filed',
      submission_ref = p_submission_ref,
      submitted_at = now(),
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_report_id;

  PERFORM public.log_report_action(p_report_id, 'filed', p_actor_id, NULL, p_submission_ref);
END;
$$;

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_report_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS compliance_reports_all ON public.compliance_reports;
CREATE POLICY compliance_reports_all ON public.compliance_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS report_audit_all ON public.report_audit;
CREATE POLICY report_audit_all ON public.report_audit FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS custom_report_definitions_all ON public.custom_report_definitions;
CREATE POLICY custom_report_definitions_all ON public.custom_report_definitions FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT ON public.v_payroll_report_summary TO authenticated, anon;
GRANT ALL ON public.compliance_reports TO authenticated, anon;
GRANT ALL ON public.report_audit TO authenticated, anon;
GRANT ALL ON public.custom_report_definitions TO authenticated, anon;
