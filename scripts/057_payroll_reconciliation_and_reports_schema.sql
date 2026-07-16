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
  ADD COLUMN IF NOT EXISTS data_source TEXT CHECK (data_source IN ('view', 'payslips', 'payroll_items', 'none')),
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

-- ── Simple data validation function for reports ──────────────────────────────
-- Just checks if data exists, doesn't require the problematic view
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

  -- If no payslips, check payroll_items as fallback
  IF v_slip_count = 0 THEN
    SELECT COUNT(*) INTO v_item_count
    FROM public.payroll_items pi
    INNER JOIN public.payroll_runs pr ON pr.id = pi.payroll_run_id
    WHERE pr.company_id = p_company_id
      AND to_char(pr.pay_period_start, 'YYYY-MM') = p_pay_period
      AND pi.status != 'cancelled';
  END IF;

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

-- ── Update compliance_reports table for audit trail ──────────────────────────
ALTER TABLE public.compliance_reports
  ADD COLUMN IF NOT EXISTS attempt_number INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS last_error TEXT,
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0;

-- Final grants for compliance_reports
GRANT ALL ON public.compliance_reports TO authenticated, anon;

-- ── NOTE: v_payroll_report_summary view remains unchanged ──────────────────────
-- It already handles both payslips and payroll_items through the engine logic
-- No view modification needed - the fallback is handled in the reporting engine

COMMIT;
