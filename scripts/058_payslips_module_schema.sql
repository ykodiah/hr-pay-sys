-- ============================================================================
-- 058 · Payslips Module Schema
-- Adds payslip_templates and payslip_bulk_jobs tables.
-- The core payslips table already exists (see previous migrations).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- payslip_templates: custom template designs for payslip generation
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payslip_templates (
  id                uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        uuid             NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name              text             NOT NULL,
  description       text,
  is_default        boolean          NOT NULL DEFAULT false,
  is_active         boolean          NOT NULL DEFAULT true,
  -- Layout / styling options stored as JSONB
  layout_config     jsonb            NOT NULL DEFAULT '{
    "show_logo": true,
    "show_ssnit": true,
    "show_bank_details": true,
    "show_loan_summary": true,
    "show_employer_cost": false,
    "show_ytd_totals": true,
    "show_leave_balance": false,
    "primary_color": "#059669",
    "font": "Georgia",
    "paper_size": "A4",
    "orientation": "portrait"
  }'::jsonb,
  -- Custom fields to include (array of field names)
  custom_fields     jsonb            DEFAULT '[]'::jsonb,
  -- Footer note / disclaimer text
  footer_note       text,
  created_by        uuid,
  created_at        timestamp with time zone NOT NULL DEFAULT now(),
  updated_at        timestamp with time zone NOT NULL DEFAULT now()
);

-- Only one default template per company
CREATE UNIQUE INDEX IF NOT EXISTS payslip_templates_default_uniq
  ON public.payslip_templates (company_id)
  WHERE is_default = true;

-- RLS
ALTER TABLE public.payslip_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payslip_templates_hr ON public.payslip_templates;
CREATE POLICY payslip_templates_hr ON public.payslip_templates
  FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- payslip_bulk_jobs: tracks bulk payslip generation / download jobs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payslip_bulk_jobs (
  id              uuid             PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid             NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- Filter params used to build this bulk job
  filter_type     text             NOT NULL CHECK (filter_type IN (
                    'department', 'division', 'location', 'subsidiary', 'company', 'custom'
                  )),
  filter_value    text,            -- e.g. "Engineering" or subsidiary UUID
  pay_period      text             NOT NULL,  -- "YYYY-MM"
  payroll_run_id  uuid,
  -- Resolved payslip IDs
  payslip_ids     uuid[]           NOT NULL DEFAULT '{}',
  payslip_count   integer          NOT NULL DEFAULT 0,
  -- Job tracking
  status          text             NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message   text,
  -- Metadata about the generated file
  download_url    text,
  file_size_bytes bigint,
  generated_at    timestamp with time zone,
  -- Audit
  requested_by    uuid,
  created_at      timestamp with time zone NOT NULL DEFAULT now(),
  updated_at      timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payslip_bulk_jobs_company ON public.payslip_bulk_jobs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payslip_bulk_jobs_period  ON public.payslip_bulk_jobs (company_id, pay_period);

ALTER TABLE public.payslip_bulk_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payslip_bulk_jobs_hr ON public.payslip_bulk_jobs;
CREATE POLICY payslip_bulk_jobs_hr ON public.payslip_bulk_jobs
  FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Ensure payslips table has all columns used by the payslips module
-- ----------------------------------------------------------------------------

-- Add any missing columns to the payslips table
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS template_id      uuid REFERENCES public.payslip_templates(id),
  ADD COLUMN IF NOT EXISTS custom_notes     text,
  ADD COLUMN IF NOT EXISTS snapshot_location    text,
  ADD COLUMN IF NOT EXISTS snapshot_division    text,
  ADD COLUMN IF NOT EXISTS snapshot_subsidiary  text,
  ADD COLUMN IF NOT EXISTS ytd_gross        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ytd_net          numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ytd_paye         numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ytd_ssnit        numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leave_balance    numeric DEFAULT 0;

-- Index for fast lookup by department / division / location (bulk generation)
CREATE INDEX IF NOT EXISTS idx_payslips_dept     ON public.payslips (company_id, snapshot_department, pay_period);
CREATE INDEX IF NOT EXISTS idx_payslips_location ON public.payslips (company_id, snapshot_location,   pay_period);
CREATE INDEX IF NOT EXISTS idx_payslips_division ON public.payslips (company_id, snapshot_division,   pay_period);

-- Index by employee + period (individual lookups)
CREATE INDEX IF NOT EXISTS idx_payslips_emp_period ON public.payslips (employee_id, pay_period);

-- ----------------------------------------------------------------------------
-- Function: get payslips with loan data for a given period + filter
-- Used by the bulk payslips module
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_payslips_with_loans(
  p_company_id      uuid,
  p_pay_period      text,
  p_filter_type     text DEFAULT 'company',
  p_filter_value    text DEFAULT NULL
)
RETURNS TABLE (
  payslip_id                uuid,
  employee_id               uuid,
  employee_name             text,
  employee_id_no            text,
  department                text,
  position                  text,
  pay_period                text,
  pay_date                  date,
  basic_salary              numeric,
  gross_pay                 numeric,
  total_deductions          numeric,
  net_pay                   numeric,
  paye_tax                  numeric,
  ssnit_employee            numeric,
  loan_deduction            numeric,
  loan_balance              numeric,
  status                    text,
  -- Active loan details
  active_loan_type          text,
  active_loan_principal     numeric,
  active_loan_monthly_pmt   numeric,
  active_loan_remaining     numeric,
  active_loan_months_left   integer
)
LANGUAGE sql STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ps.id,
    ps.employee_id,
    COALESCE(ps.snapshot_employee_name, e.first_name || ' ' || e.last_name)  AS employee_name,
    COALESCE(ps.snapshot_employee_id_no, e.employee_id)                       AS employee_id_no,
    COALESCE(ps.snapshot_department, e.department)                            AS department,
    COALESCE(ps.snapshot_position, e.position)                                AS position,
    ps.pay_period,
    ps.pay_date,
    ps.basic_salary,
    ps.gross_pay,
    ps.total_deductions,
    ps.net_pay,
    ps.paye_tax,
    ps.ssnit_employee,
    ps.loan_deduction,
    ps.loan_balance,
    ps.status,
    el.loan_type,
    el.principal,
    el.monthly_payment,
    el.remaining_balance,
    GREATEST(0, CAST(
      CEIL((el.remaining_balance / NULLIF(el.monthly_payment, 0))) AS integer
    ), 0)                                                                     AS months_left
  FROM payslips ps
  LEFT JOIN employees    e  ON e.id          = ps.employee_id
  LEFT JOIN employee_loans el
         ON el.employee_id = ps.employee_id
        AND el.status       = 'active'
  WHERE ps.company_id = p_company_id
    AND ps.pay_period = p_pay_period
    AND (
      p_filter_type = 'company'
      OR (p_filter_type = 'department' AND COALESCE(ps.snapshot_department, e.department) = p_filter_value)
      OR (p_filter_type = 'division'   AND COALESCE(ps.snapshot_division,   e.division)   = p_filter_value)
      OR (p_filter_type = 'location'   AND COALESCE(ps.snapshot_location,   e.location)   = p_filter_value)
      OR (p_filter_type = 'subsidiary' AND e.subsidiary_id::text = p_filter_value)
    )
  ORDER BY employee_name ASC;
$$;
