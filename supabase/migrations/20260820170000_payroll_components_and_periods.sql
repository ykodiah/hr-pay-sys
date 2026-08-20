-- Payroll component management and immutable period controls.
-- Group assignments are expanded to employees when created, preserving who was
-- included even if the organisation structure changes later.

CREATE TABLE IF NOT EXISTS public.payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL CHECK (pay_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  close_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, pay_period)
);

CREATE TABLE IF NOT EXISTS public.payroll_component_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (
    category IN ('allowance', 'deduction', 'provident_fund', 'bonus', 'backpay')
  ),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'amount'
    CHECK (calculation_type IN ('amount', 'percentage')),
  amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  percentage NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (percentage >= 0),
  taxable BOOLEAN NOT NULL DEFAULT true,
  recurring BOOLEAN NOT NULL DEFAULT true,
  effective_period TEXT NOT NULL CHECK (effective_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  end_period TEXT CHECK (end_period IS NULL OR end_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  backpay_treatment TEXT CHECK (
    backpay_treatment IS NULL OR backpay_treatment IN ('include_in_period', 'separate_run')
  ),
  source_scope_type TEXT NOT NULL DEFAULT 'individual'
    CHECK (source_scope_type IN ('individual', 'department', 'location', 'division', 'subsidiary', 'csv')),
  source_scope_value TEXT,
  source_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (calculation_type = 'amount' AND amount >= 0)
    OR (calculation_type = 'percentage' AND percentage >= 0)
  ),
  CHECK (end_period IS NULL OR end_period >= effective_period)
);

CREATE TABLE IF NOT EXISTS public.payroll_period_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  category TEXT NOT NULL CHECK (
    category IN ('allowance', 'deduction', 'provident_fund', 'bonus', 'backpay', 'payroll')
  ),
  row_count INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, category)
);

CREATE INDEX IF NOT EXISTS idx_payroll_component_company_period
  ON public.payroll_component_assignments(company_id, effective_period, category, status);
CREATE INDEX IF NOT EXISTS idx_payroll_component_employee_period
  ON public.payroll_component_assignments(employee_id, effective_period, end_period);
CREATE INDEX IF NOT EXISTS idx_payroll_component_batch
  ON public.payroll_component_assignments(source_batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period_company_status
  ON public.payroll_periods(company_id, status, pay_period DESC);

ALTER TABLE public.payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_component_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_period_snapshots ENABLE ROW LEVEL SECURITY;

-- API routes use the service role and enforce tenant scope. Authenticated reads
-- remain company-scoped for direct reporting clients.
DROP POLICY IF EXISTS payroll_periods_company_read ON public.payroll_periods;
CREATE POLICY payroll_periods_company_read ON public.payroll_periods
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payroll_components_company_read ON public.payroll_component_assignments;
CREATE POLICY payroll_components_company_read ON public.payroll_component_assignments
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS payroll_snapshots_company_read ON public.payroll_period_snapshots;
CREATE POLICY payroll_snapshots_company_read ON public.payroll_period_snapshots
  FOR SELECT TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid()
    )
  );

GRANT SELECT ON public.payroll_periods TO authenticated;
GRANT SELECT ON public.payroll_component_assignments TO authenticated;
GRANT SELECT ON public.payroll_period_snapshots TO authenticated;

NOTIFY pgrst, 'reload schema';
