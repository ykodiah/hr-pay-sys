-- Complete payroll components schema: enterprise columns, catalogue seed helper,
-- period control that works without fragile dependencies. Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Prerequisites
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenant_user_profiles (
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  employee_id uuid,
  display_name varchar(180),
  job_title varchar(180),
  phone varchar(50),
  avatar_url text,
  role_label varchar(80) DEFAULT 'Administrator',
  bio text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

CREATE OR REPLACE FUNCTION public.auth_company_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Core tables (idempotent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL CHECK (pay_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  payroll_run_id UUID,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_by UUID,
  closed_at TIMESTAMPTZ,
  closed_by UUID,
  close_notes TEXT,
  reopened_at TIMESTAMPTZ,
  reopened_by UUID,
  reopen_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, pay_period)
);

CREATE TABLE IF NOT EXISTS public.payroll_component_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('allowance', 'deduction', 'provident_fund', 'bonus', 'backpay')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calculation_type TEXT NOT NULL DEFAULT 'amount',
  calculation_basis TEXT NOT NULL DEFAULT 'basic_salary',
  default_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  default_percentage NUMERIC(9,4) NOT NULL DEFAULT 0,
  default_rate NUMERIC(15,4) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'GHS',
  frequency TEXT NOT NULL DEFAULT 'monthly',
  tax_treatment TEXT NOT NULL DEFAULT 'taxable',
  pensionable BOOLEAN NOT NULL DEFAULT false,
  proratable BOOLEAN NOT NULL DEFAULT false,
  include_in_overtime_base BOOLEAN NOT NULL DEFAULT false,
  affects_gross_pay BOOLEAN NOT NULL DEFAULT true,
  employer_component BOOLEAN NOT NULL DEFAULT false,
  min_amount NUMERIC(15,2),
  max_amount NUMERIC(15,2),
  gl_debit_account TEXT,
  gl_credit_account TEXT,
  cost_center TEXT,
  display_order INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, category, code)
);

CREATE TABLE IF NOT EXISTS public.payroll_component_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'amount',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(7,4) NOT NULL DEFAULT 0,
  taxable BOOLEAN NOT NULL DEFAULT true,
  recurring BOOLEAN NOT NULL DEFAULT true,
  effective_period TEXT NOT NULL,
  end_period TEXT,
  backpay_treatment TEXT,
  source_scope_type TEXT NOT NULL DEFAULT 'individual',
  source_scope_value TEXT,
  source_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payroll_period_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  category TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  schema_version INTEGER NOT NULL DEFAULT 2,
  checksum TEXT,
  generated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, category)
);

CREATE TABLE IF NOT EXISTS public.payroll_component_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  pay_period TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'validating',
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payroll_component_import_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payroll_component_import_batches(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  employee_code TEXT,
  raw_data JSONB NOT NULL,
  normalized_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  assignment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, row_number)
);

CREATE TABLE IF NOT EXISTS public.payroll_period_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Enterprise columns on definitions
-- ---------------------------------------------------------------------------
ALTER TABLE public.payroll_component_definitions
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'amount',
  ADD COLUMN IF NOT EXISTS rounding_rule TEXT DEFAULT 'nearest_0_01',
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS statutory_code TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'GH',
  ADD COLUMN IF NOT EXISTS payslip_label TEXT,
  ADD COLUMN IF NOT EXISTS display_on_payslip BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ytd_cap NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS period_cap NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS contribution_tier TEXT,
  ADD COLUMN IF NOT EXISTS formula_expression TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_notes TEXT;

-- Enterprise columns on assignments
ALTER TABLE public.payroll_component_assignments
  ADD COLUMN IF NOT EXISTS component_definition_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS currency_code CHAR(3) NOT NULL DEFAULT 'GHS',
  ADD COLUMN IF NOT EXISTS calculation_basis TEXT NOT NULL DEFAULT 'basic_salary',
  ADD COLUMN IF NOT EXISTS rate NUMERIC(15,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity NUMERIC(15,4) NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS employer_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS employer_percentage NUMERIC(9,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS max_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS frequency TEXT NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS tax_treatment TEXT NOT NULL DEFAULT 'taxable',
  ADD COLUMN IF NOT EXISTS pensionable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proratable BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS proration_method TEXT NOT NULL DEFAULT 'calendar_days',
  ADD COLUMN IF NOT EXISTS include_in_overtime_base BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_period TEXT,
  ADD COLUMN IF NOT EXISTS reason_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'with_payroll',
  ADD COLUMN IF NOT EXISTS pay_date DATE,
  ADD COLUMN IF NOT EXISTS gl_debit_account TEXT,
  ADD COLUMN IF NOT EXISTS gl_credit_account TEXT,
  ADD COLUMN IF NOT EXISTS cost_center TEXT,
  ADD COLUMN IF NOT EXISTS project_code TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_by UUID,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'amount',
  ADD COLUMN IF NOT EXISTS rounding_rule TEXT DEFAULT 'nearest_0_01',
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS statutory_code TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction_code TEXT DEFAULT 'GH',
  ADD COLUMN IF NOT EXISTS payslip_label TEXT,
  ADD COLUMN IF NOT EXISTS display_on_payslip BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ytd_cap NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS period_cap NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS contribution_tier TEXT,
  ADD COLUMN IF NOT EXISTS formula_expression TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_notes TEXT,
  ADD COLUMN IF NOT EXISTS arrears_months INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS override_reason TEXT,
  ADD COLUMN IF NOT EXISTS affects_gross_pay BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS employer_component BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS run_type TEXT NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS off_cycle_reason TEXT,
  ADD COLUMN IF NOT EXISTS parent_payroll_run_id UUID,
  ADD COLUMN IF NOT EXISTS skip_regular_deductions BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS component_assignment_ids UUID[] NOT NULL DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- Period finalize / reopen (service_role)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.finalize_payroll_period(
  p_company_id UUID,
  p_pay_period TEXT,
  p_payroll_run_id UUID,
  p_actor_id UUID,
  p_notes TEXT,
  p_snapshots JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_id UUID;
  v_snapshot JSONB;
BEGIN
  INSERT INTO public.payroll_periods (
    company_id, pay_period, status, payroll_run_id, opened_by, close_notes
  ) VALUES (
    p_company_id, p_pay_period, 'open', p_payroll_run_id, p_actor_id, p_notes
  )
  ON CONFLICT (company_id, pay_period) DO UPDATE
    SET payroll_run_id = COALESCE(EXCLUDED.payroll_run_id, public.payroll_periods.payroll_run_id),
        close_notes = EXCLUDED.close_notes,
        updated_at = now()
  RETURNING id INTO v_period_id;

  IF EXISTS (
    SELECT 1 FROM public.payroll_periods WHERE id = v_period_id AND status = 'closed'
  ) THEN
    RAISE EXCEPTION 'Payroll period % is already closed', p_pay_period;
  END IF;

  FOR v_snapshot IN SELECT value FROM jsonb_array_elements(COALESCE(p_snapshots, '[]'::jsonb))
  LOOP
    INSERT INTO public.payroll_period_snapshots (
      company_id, payroll_period_id, pay_period, category, row_count,
      total_amount, data, schema_version, generated_by
    ) VALUES (
      p_company_id,
      v_period_id,
      p_pay_period,
      v_snapshot->>'category',
      COALESCE((v_snapshot->>'row_count')::INTEGER, 0),
      COALESCE((v_snapshot->>'total_amount')::NUMERIC, 0),
      COALESCE(v_snapshot->'data', '[]'::jsonb),
      2,
      p_actor_id
    )
    ON CONFLICT (payroll_period_id, category) DO UPDATE
      SET row_count = EXCLUDED.row_count,
          total_amount = EXCLUDED.total_amount,
          data = EXCLUDED.data,
          schema_version = EXCLUDED.schema_version,
          generated_by = EXCLUDED.generated_by,
          created_at = now();
  END LOOP;

  UPDATE public.payroll_periods
  SET status = 'closed',
      payroll_run_id = COALESCE(p_payroll_run_id, payroll_run_id),
      closed_at = now(),
      closed_by = p_actor_id,
      close_notes = p_notes,
      updated_at = now()
  WHERE id = v_period_id;

  INSERT INTO public.payroll_period_audit (
    company_id, payroll_period_id, pay_period, action, actor_id, reason, metadata
  ) VALUES (
    p_company_id, v_period_id, p_pay_period, 'closed', p_actor_id, p_notes,
    jsonb_build_object('payroll_run_id', p_payroll_run_id)
  );

  RETURN v_period_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reopen_payroll_period(
  p_company_id UUID,
  p_pay_period TEXT,
  p_actor_id UUID,
  p_reason TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period_id UUID;
BEGIN
  UPDATE public.payroll_periods
  SET status = 'open',
      reopened_at = now(),
      reopened_by = p_actor_id,
      reopen_reason = p_reason,
      updated_at = now()
  WHERE company_id = p_company_id
    AND pay_period = p_pay_period
    AND status = 'closed'
  RETURNING id INTO v_period_id;

  IF v_period_id IS NULL THEN
    RAISE EXCEPTION 'Closed payroll period % was not found', p_pay_period;
  END IF;

  INSERT INTO public.payroll_period_audit (
    company_id, payroll_period_id, pay_period, action, actor_id, reason
  ) VALUES (
    p_company_id, v_period_id, p_pay_period, 'reopened', p_actor_id, p_reason
  );
  RETURN v_period_id;
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_payroll_period(UUID, TEXT, UUID, UUID, TEXT, JSONB)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reopen_payroll_period(UUID, TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_payroll_period(UUID, TEXT, UUID, UUID, TEXT, JSONB)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.reopen_payroll_period(UUID, TEXT, UUID, TEXT)
  TO service_role;

-- ---------------------------------------------------------------------------
-- Indexes / grants / RLS
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_payroll_component_definitions_company
  ON public.payroll_component_definitions(company_id, category, active, display_order);
CREATE INDEX IF NOT EXISTS idx_payroll_component_assignments_company_period
  ON public.payroll_component_assignments(company_id, effective_period, category, status);
CREATE INDEX IF NOT EXISTS idx_payroll_component_assignments_employee
  ON public.payroll_component_assignments(employee_id, effective_period, end_period);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_company
  ON public.payroll_periods(company_id, status, pay_period DESC);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'payroll_periods',
    'payroll_component_assignments',
    'payroll_component_definitions',
    'payroll_period_snapshots',
    'payroll_component_import_batches',
    'payroll_component_import_rows',
    'payroll_period_audit',
    'tenant_user_profiles'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated, service_role', t);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
