-- Payroll reconciliation, reports schema fixes, and performance indexes
-- Fixes: Process & Submit routing, report generation fallback, data integrity validation
-- Safe to re-run.

-- ── Add performance indexes for payroll processing ─────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company_status_period
  ON public.payroll_runs(company_id, status, pay_period_start DESC);

CREATE INDEX IF NOT EXISTS idx_payroll_items_run_status
  ON public.payroll_items(payroll_run_id, status);

CREATE INDEX IF NOT EXISTS idx_payslips_run_status
  ON public.payslips(payroll_run_id, status);

CREATE INDEX IF NOT EXISTS idx_payslips_company_period
  ON public.payslips(company_id, pay_period);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_lookup
  ON public.compliance_reports(company_id, report_type, pay_period, generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_compliance_reports_run_id
  ON public.compliance_reports(payroll_run_id);

-- ── Add audit columns to compliance_reports for troubleshooting ──────────────
ALTER TABLE public.compliance_reports
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS data_source TEXT CHECK (data_source IN ('payslips', 'payroll_items', 'both')),
  ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'failed'));

-- ── Reconciliation function: validates payroll_items and payslips sync ────────
CREATE OR REPLACE FUNCTION public.reconcile_payroll_items_and_payslips(p_payroll_run_id UUID)
RETURNS TABLE (
  matched INT,
  total_items INT,
  total_slips INT,
  mismatches JSONB,
  errors TEXT[]
) AS $$
DECLARE
  v_items_count INT;
  v_slips_count INT;
  v_mismatches JSONB;
  v_errors TEXT[] := '{}';
BEGIN
  -- Count payroll_items for this run
  SELECT COUNT(*) INTO v_items_count
  FROM public.payroll_items
  WHERE payroll_run_id = p_payroll_run_id AND status != 'cancelled';

  -- Count payslips for this run
  SELECT COUNT(*) INTO v_slips_count
  FROM public.payslips
  WHERE payroll_run_id = p_payroll_run_id AND status != 'cancelled';

  -- If counts don't match, find mismatches
  IF v_items_count != v_slips_count THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'item_id', pi.id,
        'employee_id', pi.employee_id,
        'has_item', true,
        'has_slip', COALESCE(ps.id IS NOT NULL, false),
        'item_gross', pi.gross_pay,
        'slip_gross', ps.gross_pay
      )
    ) INTO v_mismatches
    FROM public.payroll_items pi
    LEFT JOIN public.payslips ps ON ps.employee_id = pi.employee_id
      AND ps.payroll_run_id = pi.payroll_run_id
    WHERE pi.payroll_run_id = p_payroll_run_id
      AND pi.status != 'cancelled';

    v_errors := array_append(v_errors, 
      format('Item/slip count mismatch: %s items vs %s slips', v_items_count, v_slips_count));
  ELSE
    v_mismatches := '[]'::jsonb;
  END IF;

  RETURN QUERY SELECT
    LEAST(v_items_count, v_slips_count),
    v_items_count,
    v_slips_count,
    v_mismatches,
    v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reconcile_payroll_items_and_payslips(UUID) TO authenticated, anon;

-- ── Data source validation function ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.validate_report_data_exists(
  p_company_id UUID,
  p_report_type TEXT,
  p_pay_period TEXT
)
RETURNS TABLE (
  has_data BOOLEAN,
  row_count INT,
  data_source TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_slip_count INT := 0;
  v_item_count INT := 0;
  v_source TEXT := 'none';
  v_error TEXT := NULL;
BEGIN
  -- Check payslips first (primary source)
  SELECT COUNT(*) INTO v_slip_count
  FROM public.payslips
  WHERE company_id = p_company_id
    AND pay_period = p_pay_period
    AND status != 'cancelled';

  -- Check payroll_items as fallback
  SELECT COUNT(*) INTO v_item_count
  FROM public.payroll_items pi
  INNER JOIN public.payroll_runs pr ON pr.id = pi.payroll_run_id
  WHERE pr.company_id = p_company_id
    AND pr.pay_period = p_pay_period
    AND pi.status != 'cancelled';

  -- Determine data source and validity
  IF v_slip_count > 0 THEN
    v_source := 'payslips';
    RETURN QUERY SELECT
      true,
      v_slip_count,
      v_source,
      v_error;
  ELSIF v_item_count > 0 THEN
    v_source := 'payroll_items';
    RETURN QUERY SELECT
      true,
      v_item_count,
      v_source,
      v_error;
  ELSE
    v_source := 'none';
    v_error := format('No payroll data found for company %s, period %s. Process payroll first.',
      p_company_id::text, p_pay_period);
    RETURN QUERY SELECT
      false,
      0,
      v_source,
      v_error;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.validate_report_data_exists(UUID, TEXT, TEXT) TO authenticated, anon;

-- ── RECREATE v_payroll_report_summary with fallback to payroll_items ────────
-- This view now uses payslips as primary, falls back to payroll_items if needed
DROP VIEW IF EXISTS public.v_payroll_report_summary CASCADE;

CREATE VIEW public.v_payroll_report_summary AS
WITH report_data AS (
  -- Primary source: payslips
  SELECT
    'payslips' AS source,
    p.id AS slip_id,
    p.company_id,
    p.payroll_run_id,
    COALESCE(p.pay_period, to_char(COALESCE(p.pay_period_start, p.pay_date, p.created_at), 'YYYY-MM')) AS pay_period,
    p.pay_period_start,
    p.pay_period_end,
    p.pay_date,
    p.employee_id,
    p.basic_salary,
    p.transport_allowance,
    p.housing_allowance,
    p.medical_allowance,
    p.meal_allowance,
    p.communication_allowance,
    p.other_allowances,
    p.overtime_pay,
    p.bonus_pay,
    p.gross_pay,
    p.ssnit_employee,
    p.ssnit_employer,
    p.tier2_employee,
    p.tier2_employer,
    p.tier3_employee,
    p.tier3_employer,
    p.paye_taxable_income,
    p.tax_relief_total,
    p.paye_tax,
    p.loan_deduction,
    p.advance_deduction,
    p.other_deductions,
    p.total_deductions,
    p.net_pay,
    p.total_employer_cost,
    p.loan_balance,
    p.status
  FROM public.payslips p
  WHERE p.status != 'cancelled'

  UNION ALL

  -- Fallback source: payroll_items (for periods without payslips)
  SELECT
    'payroll_items' AS source,
    pi.id AS slip_id,
    pr.company_id,
    pr.id AS payroll_run_id,
    pr.pay_period,
    pr.pay_period_start,
    pr.pay_period_end,
    pr.pay_date,
    pi.employee_id,
    pi.basic_salary,
    pi.transport_allowance,
    pi.housing_allowance,
    pi.medical_allowance,
    pi.meal_allowance,
    pi.communication_allowance,
    pi.other_allowances,
    pi.overtime_pay,
    pi.bonus_pay,
    pi.gross_pay,
    pi.ssnit_employee,
    pi.ssnit_employer,
    pi.tier2_employee,
    pi.tier2_employer,
    pi.tier3_employee,
    pi.tier3_employer,
    pi.paye_taxable_income,
    pi.tax_relief_total,
    pi.paye_tax,
    pi.loan_deduction,
    pi.advance_deduction,
    pi.other_deductions,
    pi.total_deductions,
    pi.net_pay,
    pi.total_employer_cost,
    pi.loan_balance,
    pi.status
  FROM public.payroll_items pi
  INNER JOIN public.payroll_runs pr ON pr.id = pi.payroll_run_id
  WHERE pi.status != 'cancelled'
    -- Only use payroll_items if there are NO payslips for this run
    AND NOT EXISTS (
      SELECT 1 FROM public.payslips ps
      WHERE ps.payroll_run_id = pi.payroll_run_id
        AND ps.status != 'cancelled'
    )
)
SELECT
  rd.source,
  rd.company_id,
  rd.payroll_run_id,
  rd.pay_period,
  rd.pay_period_start,
  rd.pay_period_end,
  rd.pay_date,
  rd.employee_id,
  TRIM(CONCAT(COALESCE(e.first_name, ''), ' ', COALESCE(e.last_name, ''))) AS employee_name,
  COALESCE(e.employee_id, e.id::text) AS employee_id_no,
  e.position,
  e.department,
  ef.ssnit_number,
  ef.bank_name,
  ef.bank_account_number AS account_number,
  c.name AS company_name,
  COALESCE(e.ghana_card_number, to_jsonb(e)->>'national_id') AS ghana_card_number,
  COALESCE(
    NULLIF(to_jsonb(e)->>'hire_date', '')::date,
    NULLIF(to_jsonb(e)->>'date_of_joining', '')::date
  ) AS date_of_joining,
  COALESCE(
    to_jsonb(e)->>'employment_type',
    to_jsonb(e)->>'contract_type',
    to_jsonb(e)->>'employment_status'
  ) AS contract_type,
  COALESCE(rd.basic_salary, 0)::numeric AS basic_salary,
  COALESCE(rd.transport_allowance, 0)::numeric AS transport_allowance,
  COALESCE(rd.housing_allowance, 0)::numeric AS housing_allowance,
  COALESCE(rd.medical_allowance, 0)::numeric AS medical_allowance,
  COALESCE(rd.meal_allowance, 0)::numeric AS meal_allowance,
  COALESCE(rd.communication_allowance, 0)::numeric AS communication_allowance,
  COALESCE(rd.other_allowances, 0)::numeric AS other_allowances,
  COALESCE(rd.overtime_pay, 0)::numeric AS overtime_pay,
  COALESCE(rd.bonus_pay, 0)::numeric AS bonus_pay,
  (
    COALESCE(rd.transport_allowance, 0) + COALESCE(rd.housing_allowance, 0) +
    COALESCE(rd.medical_allowance, 0) + COALESCE(rd.meal_allowance, 0) +
    COALESCE(rd.communication_allowance, 0) + COALESCE(rd.other_allowances, 0)
  )::numeric AS total_allowances,
  COALESCE(rd.gross_pay, 0)::numeric AS gross_pay,
  COALESCE(rd.ssnit_employee, 0)::numeric AS ssnit_employee,
  COALESCE(rd.ssnit_employer, 0)::numeric AS ssnit_employer,
  COALESCE(rd.tier2_employee, 0)::numeric AS tier2_employee,
  COALESCE(rd.tier2_employer, 0)::numeric AS tier2_employer,
  COALESCE(rd.tier3_employee, 0)::numeric AS tier3_employee,
  COALESCE(rd.tier3_employer, 0)::numeric AS tier3_employer,
  COALESCE(rd.paye_taxable_income, 0)::numeric AS paye_taxable_income,
  COALESCE(rd.tax_relief_total, 0)::numeric AS tax_relief_total,
  COALESCE(rd.paye_tax, 0)::numeric AS paye_tax,
  COALESCE(rd.loan_deduction, 0)::numeric AS loan_deduction,
  COALESCE(rd.advance_deduction, 0)::numeric AS advance_deduction,
  COALESCE(rd.other_deductions, 0)::numeric AS other_deductions,
  COALESCE(rd.total_deductions, 0)::numeric AS total_deductions,
  COALESCE(rd.net_pay, 0)::numeric AS net_pay,
  COALESCE(rd.total_employer_cost, 0)::numeric AS total_employer_cost,
  (
    COALESCE(rd.gross_pay, 0) + COALESCE(rd.ssnit_employer, 0) +
    COALESCE(rd.tier2_employer, 0) + COALESCE(rd.tier3_employer, 0)
  )::numeric AS cost_to_company,
  COALESCE(rd.status, 'draft') AS payslip_status,
  NULL::numeric AS loan_amount,
  COALESCE(rd.loan_balance, 0)::numeric AS current_loan_balance,
  COALESCE(rd.loan_deduction, 0)::numeric AS current_loan_deduction
FROM report_data rd
LEFT JOIN public.employees e ON e.id = rd.employee_id
LEFT JOIN public.employee_financial ef ON ef.employee_id = rd.employee_id
LEFT JOIN public.companies c ON c.id = rd.company_id;

-- ── Update compliance_reports table for audit trail ──────────────────────────
-- Log all report generation attempts (success or failure)
ALTER TABLE public.compliance_reports
  ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- Final grants for new functions
GRANT ALL ON public.compliance_reports TO authenticated, anon;
