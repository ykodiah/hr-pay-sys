-- =============================================================================
-- 056: Ensure companies branding fields + compliance report helpers
-- Safe to re-run.
-- =============================================================================

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Ghana',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_address TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT;

-- Recreate payroll report view (depends on payslips from 055)
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
  COALESCE(
    NULLIF(p.snapshot_employee_name, ''),
    TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, '')))
  ) AS employee_name,
  COALESCE(NULLIF(p.snapshot_employee_id_no, ''), e.employee_id, e.id::text) AS employee_id_no,
  COALESCE(NULLIF(p.snapshot_position, ''), e.position) AS position,
  COALESCE(NULLIF(p.snapshot_department, ''), e.department) AS department,
  COALESCE(ef.ssnit_number, p.snapshot_ssnit_number) AS ssnit_number,
  COALESCE(ef.bank_name, p.snapshot_bank_name) AS bank_name,
  COALESCE(ef.bank_account_number, p.snapshot_account_number) AS account_number,
  c.name AS company_name,
  COALESCE(e.ghana_card_number, to_jsonb(e)->>'national_id') AS ghana_card_number,
  COALESCE(e.first_name, '') AS first_name,
  COALESCE(e.last_name, '') AS last_name,
  COALESCE(e.other_names, '') AS other_names,
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
  COALESCE(p.bonus_tax, 0)::numeric AS bonus_tax,
  COALESCE(p.overtime_tax, 0)::numeric AS overtime_tax,
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

GRANT SELECT ON public.v_payroll_report_summary TO authenticated, anon;

-- Ensure compliance_reports exists (from 048)
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
  status TEXT NOT NULL DEFAULT 'generated',
  submitted_at TIMESTAMPTZ,
  submission_ref TEXT,
  notes TEXT,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS compliance_reports_all ON public.compliance_reports;
CREATE POLICY compliance_reports_all ON public.compliance_reports FOR ALL USING (true) WITH CHECK (true);
GRANT ALL ON public.compliance_reports TO authenticated, anon;
