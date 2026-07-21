-- =============================================================================
-- 081: Tier 2 is report-only — exclude from payroll cash totals + backfill
--
-- Tier 2 (Employee 5%) remains stored for the SSNIT Tier 2 report, but must NOT
-- be included in total_deductions / net_pay on payslips, payroll_items, or runs.
-- Safe / idempotent. Run after 080.
-- =============================================================================

-- ── Ensure payroll_runs aggregate columns exist (older DBs omit employee_count)
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS total_gross_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS total_deductions NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS total_net_pay NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS employee_count INTEGER DEFAULT 0;
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ── Schema: mark Tier 2 as report-only on payroll tables ─────────────────────
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS tier2_report_only BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS tier2_employer NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS total_employer_cost NUMERIC(15,2) DEFAULT 0;
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS loan_balance NUMERIC(15,2) DEFAULT 0;

ALTER TABLE public.payroll_items
  ADD COLUMN IF NOT EXISTS tier2_report_only BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.payslips.tier2_employee IS
  'Occupational pension (Tier 2) employee amount — for SSNIT Tier 2 reports only. Not included in total_deductions or net_pay.';
COMMENT ON COLUMN public.payslips.tier2_employer IS
  'Tier 2 employer amount — report/compliance only (Act 766 default 0%).';
COMMENT ON COLUMN public.payslips.total_deductions IS
  'Cash payroll deductions: SSNIT + Tier3/PF + PAYE + loans/advances/other. Excludes Tier 2.';
COMMENT ON COLUMN public.payslips.net_pay IS
  'gross_pay - total_deductions (Tier 2 excluded from deductions).';
COMMENT ON COLUMN public.payroll_items.tier2_employee IS
  'Occupational pension (Tier 2) employee amount — for SSNIT Tier 2 reports only. Not included in total_deductions or net_pay.';
COMMENT ON COLUMN public.payroll_items.total_deductions IS
  'Cash payroll deductions: SSNIT + Tier3/PF + PAYE + loans/advances/other. Excludes Tier 2.';

-- Fix legacy seeded Tier 2 employer rate (Act 766 default is 0%, not 5%)
UPDATE public.tax_rates
SET employer_rate = 0
WHERE rate_type = 'tier2'
  AND COALESCE(employer_rate, 0) = 5;

-- Fix legacy SSNIT 0.5% Tier-1 split typo → Act 766 employee 5.5%
UPDATE public.tax_rates
SET employee_rate = 5.5
WHERE rate_type = 'ssnit'
  AND COALESCE(employee_rate, 0) > 0
  AND COALESCE(employee_rate, 0) < 1;

-- ── Helper: cash deductions excluding Tier 2 ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.payroll_cash_deductions(
  p_ssnit NUMERIC,
  p_tier3 NUMERIC,
  p_paye NUMERIC,
  p_loan NUMERIC,
  p_advance NUMERIC,
  p_other NUMERIC
) RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ROUND((
    COALESCE(p_ssnit, 0) +
    COALESCE(p_tier3, 0) +
    COALESCE(p_paye, 0) +
    COALESCE(p_loan, 0) +
    COALESCE(p_advance, 0) +
    COALESCE(p_other, 0)
  )::numeric, 2);
$$;

-- ── Backfill payslips ────────────────────────────────────────────────────────
UPDATE public.payslips p
SET
  -- Restore taxable income when previous engine reduced it by Tier 2
  paye_taxable_income = CASE
    WHEN COALESCE(p.tier2_employee, 0) > 0
      AND ABS(
        COALESCE(p.total_deductions, 0) - (
          COALESCE(p.ssnit_employee, 0) + COALESCE(p.tier2_employee, 0) +
          COALESCE(p.tier3_employee, 0) + COALESCE(p.paye_tax, 0) +
          COALESCE(p.loan_deduction, 0) + COALESCE(p.advance_deduction, 0) +
          COALESCE(p.other_deductions, 0)
        )
      ) < 0.05
    THEN ROUND((COALESCE(p.paye_taxable_income, 0) + COALESCE(p.tier2_employee, 0))::numeric, 2)
    ELSE p.paye_taxable_income
  END,
  total_deductions = public.payroll_cash_deductions(
    p.ssnit_employee,
    p.tier3_employee,
    p.paye_tax,
    p.loan_deduction,
    p.advance_deduction,
    p.other_deductions
  ),
  net_pay = ROUND((
    COALESCE(p.gross_pay, 0) - public.payroll_cash_deductions(
      p.ssnit_employee,
      p.tier3_employee,
      p.paye_tax,
      p.loan_deduction,
      p.advance_deduction,
      p.other_deductions
    )
  )::numeric, 2),
  tier2_report_only = true,
  updated_at = now()
WHERE COALESCE(p.tier2_employee, 0) > 0
   OR ABS(
        COALESCE(p.total_deductions, 0) - public.payroll_cash_deductions(
          p.ssnit_employee, p.tier3_employee, p.paye_tax,
          p.loan_deduction, p.advance_deduction, p.other_deductions
        )
      ) >= 0.05;

-- ── Backfill payroll_items ───────────────────────────────────────────────────
UPDATE public.payroll_items i
SET
  paye_taxable_income = CASE
    WHEN COALESCE(i.tier2_employee, 0) > 0
      AND ABS(
        COALESCE(i.total_deductions, 0) - (
          COALESCE(i.ssnit_employee, 0) + COALESCE(i.tier2_employee, 0) +
          COALESCE(i.tier3_employee, 0) +
          COALESCE(i.tax_deduction, i.paye_tax, 0) +
          COALESCE(i.loan_deduction, 0) + COALESCE(i.advance_deduction, 0) +
          COALESCE(i.other_deductions, 0)
        )
      ) < 0.05
    THEN ROUND((COALESCE(i.paye_taxable_income, i.taxable_income, 0) + COALESCE(i.tier2_employee, 0))::numeric, 2)
    ELSE COALESCE(i.paye_taxable_income, i.taxable_income)
  END,
  total_deductions = public.payroll_cash_deductions(
    i.ssnit_employee,
    i.tier3_employee,
    COALESCE(i.tax_deduction, i.paye_tax, 0),
    i.loan_deduction,
    i.advance_deduction,
    i.other_deductions
  ),
  net_pay = ROUND((
    COALESCE(i.gross_pay, 0) - public.payroll_cash_deductions(
      i.ssnit_employee,
      i.tier3_employee,
      COALESCE(i.tax_deduction, i.paye_tax, 0),
      i.loan_deduction,
      i.advance_deduction,
      i.other_deductions
    )
  )::numeric, 2),
  tier2_report_only = true,
  updated_at = now()
WHERE COALESCE(i.tier2_employee, 0) > 0
   OR ABS(
        COALESCE(i.total_deductions, 0) - public.payroll_cash_deductions(
          i.ssnit_employee, i.tier3_employee, COALESCE(i.tax_deduction, i.paye_tax, 0),
          i.loan_deduction, i.advance_deduction, i.other_deductions
        )
      ) >= 0.05;

-- ── Re-aggregate payroll_runs from corrected items ───────────────────────────
UPDATE public.payroll_runs r
SET
  total_gross_pay = COALESCE(x.gross, r.total_gross_pay, 0),
  total_deductions = COALESCE(x.ded, r.total_deductions, 0),
  total_net_pay = COALESCE(x.net, r.total_net_pay, 0),
  employee_count = COALESCE(x.cnt, r.employee_count, 0),
  updated_at = now()
FROM (
  SELECT
    payroll_run_id,
    ROUND(SUM(COALESCE(gross_pay, 0))::numeric, 2) AS gross,
    ROUND(SUM(COALESCE(total_deductions, 0))::numeric, 2) AS ded,
    ROUND(SUM(COALESCE(net_pay, 0))::numeric, 2) AS net,
    COUNT(*)::int AS cnt
  FROM public.payroll_items
  WHERE payroll_run_id IS NOT NULL
  GROUP BY payroll_run_id
) x
WHERE r.id = x.payroll_run_id;

-- Prefer payslip aggregates when the run has payslips (source of truth for history links)
UPDATE public.payroll_runs r
SET
  total_gross_pay = x.gross,
  total_deductions = x.ded,
  total_net_pay = x.net,
  employee_count = x.cnt,
  updated_at = now()
FROM (
  SELECT
    payroll_run_id,
    ROUND(SUM(COALESCE(gross_pay, 0))::numeric, 2) AS gross,
    ROUND(SUM(COALESCE(total_deductions, 0))::numeric, 2) AS ded,
    ROUND(SUM(COALESCE(net_pay, 0))::numeric, 2) AS net,
    COUNT(*)::int AS cnt
  FROM public.payslips
  WHERE payroll_run_id IS NOT NULL
  GROUP BY payroll_run_id
) x
WHERE r.id = x.payroll_run_id;

-- ── RPC: recompute cash totals for one run (app can call after process) ──────
CREATE OR REPLACE FUNCTION public.recompute_payroll_run_cash_totals(p_payroll_run_id UUID)
RETURNS TABLE(
  items_updated INT,
  payslips_updated INT,
  total_deductions NUMERIC,
  total_net_pay NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_items INT := 0;
  v_slips INT := 0;
  v_ded NUMERIC := 0;
  v_net NUMERIC := 0;
BEGIN
  UPDATE public.payroll_items i
  SET
    total_deductions = public.payroll_cash_deductions(
      i.ssnit_employee, i.tier3_employee, COALESCE(i.tax_deduction, i.paye_tax, 0),
      i.loan_deduction, i.advance_deduction, i.other_deductions
    ),
    net_pay = ROUND((
      COALESCE(i.gross_pay, 0) - public.payroll_cash_deductions(
        i.ssnit_employee, i.tier3_employee, COALESCE(i.tax_deduction, i.paye_tax, 0),
        i.loan_deduction, i.advance_deduction, i.other_deductions
      )
    )::numeric, 2),
    tier2_report_only = true,
    updated_at = now()
  WHERE i.payroll_run_id = p_payroll_run_id;
  GET DIAGNOSTICS v_items = ROW_COUNT;

  UPDATE public.payslips p
  SET
    total_deductions = public.payroll_cash_deductions(
      p.ssnit_employee, p.tier3_employee, p.paye_tax,
      p.loan_deduction, p.advance_deduction, p.other_deductions
    ),
    net_pay = ROUND((
      COALESCE(p.gross_pay, 0) - public.payroll_cash_deductions(
        p.ssnit_employee, p.tier3_employee, p.paye_tax,
        p.loan_deduction, p.advance_deduction, p.other_deductions
      )
    )::numeric, 2),
    tier2_report_only = true,
    updated_at = now()
  WHERE p.payroll_run_id = p_payroll_run_id;
  GET DIAGNOSTICS v_slips = ROW_COUNT;

  SELECT
    ROUND(SUM(COALESCE(total_deductions, 0))::numeric, 2),
    ROUND(SUM(COALESCE(net_pay, 0))::numeric, 2)
  INTO v_ded, v_net
  FROM public.payslips
  WHERE payroll_run_id = p_payroll_run_id;

  IF v_slips = 0 THEN
    SELECT
      ROUND(SUM(COALESCE(total_deductions, 0))::numeric, 2),
      ROUND(SUM(COALESCE(net_pay, 0))::numeric, 2)
    INTO v_ded, v_net
    FROM public.payroll_items
    WHERE payroll_run_id = p_payroll_run_id;
  END IF;

  UPDATE public.payroll_runs
  SET
    total_deductions = COALESCE(v_ded, 0),
    total_net_pay = COALESCE(v_net, 0),
    total_gross_pay = COALESCE((
      SELECT ROUND(SUM(COALESCE(gross_pay, 0))::numeric, 2)
      FROM public.payslips WHERE payroll_run_id = p_payroll_run_id
    ), (
      SELECT ROUND(SUM(COALESCE(gross_pay, 0))::numeric, 2)
      FROM public.payroll_items WHERE payroll_run_id = p_payroll_run_id
    ), total_gross_pay),
    employee_count = COALESCE((
      SELECT COUNT(*)::int FROM public.payslips WHERE payroll_run_id = p_payroll_run_id
    ), (
      SELECT COUNT(*)::int FROM public.payroll_items WHERE payroll_run_id = p_payroll_run_id
    ), employee_count),
    updated_at = now()
  WHERE id = p_payroll_run_id;

  RETURN QUERY SELECT v_items, v_slips, COALESCE(v_ded, 0), COALESCE(v_net, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.payroll_cash_deductions(NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.recompute_payroll_run_cash_totals(UUID)
  TO authenticated, anon;

-- ── Recreate report view with cash totals that exclude Tier 2 ────────────────
DROP VIEW IF EXISTS public.v_payroll_report_summary CASCADE;

CREATE VIEW public.v_payroll_report_summary AS
SELECT
  p.id AS payslip_id,
  p.payroll_run_id,
  p.company_id,
  p.pay_period,
  p.pay_period_start,
  p.pay_period_end,
  p.pay_date,
  p.employee_id,
  COALESCE(
    p.snapshot_employee_name,
    NULLIF(TRIM(COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')), '')
  ) AS employee_name,
  COALESCE(p.snapshot_employee_id_no, e.employee_id) AS employee_id_no,
  COALESCE(p.snapshot_position, e.position) AS position,
  COALESCE(p.snapshot_department, e.department) AS department,
  COALESCE(ef.ssnit_number, p.snapshot_ssnit_number) AS ssnit_number,
  COALESCE(ef.bank_name, p.snapshot_bank_name) AS bank_name,
  COALESCE(ef.bank_account_number, p.snapshot_account_number) AS account_number,
  c.name AS company_name,
  COALESCE(e.ghana_card_number, to_jsonb(e)->>'national_id') AS ghana_card_number,
  p.snapshot_subsidiary AS snapshot_subsidiary,
  p.snapshot_division AS snapshot_division,
  p.snapshot_location AS snapshot_location,
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
  -- Always derive cash totals excluding Tier 2 (even if stored row is stale)
  public.payroll_cash_deductions(
    p.ssnit_employee, p.tier3_employee, p.paye_tax,
    p.loan_deduction, p.advance_deduction, p.other_deductions
  ) AS total_deductions,
  ROUND((
    COALESCE(p.gross_pay, 0) - public.payroll_cash_deductions(
      p.ssnit_employee, p.tier3_employee, p.paye_tax,
      p.loan_deduction, p.advance_deduction, p.other_deductions
    )
  )::numeric, 2) AS net_pay,
  COALESCE(p.total_employer_cost, 0)::numeric AS total_employer_cost,
  (
    COALESCE(p.gross_pay, 0) + COALESCE(p.ssnit_employer, 0) +
    COALESCE(p.tier3_employer, 0)
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
