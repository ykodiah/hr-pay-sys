-- Enterprise payroll component catalogue, assignments and import audit.
-- Safe after 20260820170000_payroll_components_and_periods.sql.

CREATE TABLE IF NOT EXISTS public.payroll_component_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('allowance', 'deduction', 'provident_fund', 'bonus', 'backpay')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  calculation_type TEXT NOT NULL DEFAULT 'amount'
    CHECK (calculation_type IN ('amount', 'percentage', 'rate_x_quantity')),
  calculation_basis TEXT NOT NULL DEFAULT 'basic_salary'
    CHECK (calculation_basis IN ('basic_salary', 'gross_pay', 'taxable_pay', 'fixed', 'custom')),
  default_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  default_percentage NUMERIC(9,4) NOT NULL DEFAULT 0,
  default_rate NUMERIC(15,4) NOT NULL DEFAULT 0,
  currency_code CHAR(3) NOT NULL DEFAULT 'GHS',
  frequency TEXT NOT NULL DEFAULT 'monthly'
    CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'annual', 'per_payroll')),
  tax_treatment TEXT NOT NULL DEFAULT 'taxable'
    CHECK (tax_treatment IN ('taxable', 'non_taxable', 'tax_relief', 'post_tax')),
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
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, category, code)
);

ALTER TABLE public.payroll_component_assignments
  ADD COLUMN IF NOT EXISTS component_definition_id UUID
    REFERENCES public.payroll_component_definitions(id) ON DELETE SET NULL,
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
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  ALTER TABLE public.payroll_component_assignments
    DROP CONSTRAINT IF EXISTS payroll_component_assignments_calculation_type_check;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_component_assignment_calculation_type_check'
  ) THEN
    ALTER TABLE public.payroll_component_assignments
      ADD CONSTRAINT payroll_component_assignment_calculation_type_check
      CHECK (calculation_type IN ('amount', 'percentage', 'rate_x_quantity'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_component_assignment_basis_check'
  ) THEN
    ALTER TABLE public.payroll_component_assignments
      ADD CONSTRAINT payroll_component_assignment_basis_check
      CHECK (calculation_basis IN ('basic_salary', 'gross_pay', 'taxable_pay', 'fixed', 'custom'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_component_assignment_frequency_check'
  ) THEN
    ALTER TABLE public.payroll_component_assignments
      ADD CONSTRAINT payroll_component_assignment_frequency_check
      CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'annual', 'per_payroll'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'payroll_component_assignment_approval_check'
  ) THEN
    ALTER TABLE public.payroll_component_assignments
      ADD CONSTRAINT payroll_component_assignment_approval_check
      CHECK (approval_status IN ('draft', 'pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.payroll_component_import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  pay_period TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  status TEXT NOT NULL DEFAULT 'validating'
    CHECK (status IN ('validating', 'failed', 'ready', 'imported')),
  total_rows INTEGER NOT NULL DEFAULT 0,
  valid_rows INTEGER NOT NULL DEFAULT 0,
  invalid_rows INTEGER NOT NULL DEFAULT 0,
  imported_rows INTEGER NOT NULL DEFAULT 0,
  validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'valid', 'invalid', 'imported')),
  errors JSONB NOT NULL DEFAULT '[]'::jsonb,
  assignment_id UUID REFERENCES public.payroll_component_assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (batch_id, row_number)
);

ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS run_type TEXT NOT NULL DEFAULT 'regular',
  ADD COLUMN IF NOT EXISTS off_cycle_reason TEXT,
  ADD COLUMN IF NOT EXISTS parent_payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS skip_regular_deductions BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS component_assignment_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.payroll_period_snapshots
  ADD COLUMN IF NOT EXISTS schema_version INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS generated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payroll_component_definitions_company
  ON public.payroll_component_definitions(company_id, category, active, display_order);
CREATE INDEX IF NOT EXISTS idx_payroll_component_assignments_definition
  ON public.payroll_component_assignments(component_definition_id);
CREATE INDEX IF NOT EXISTS idx_payroll_component_import_batches_company
  ON public.payroll_component_import_batches(company_id, pay_period, created_at DESC);

ALTER TABLE public.payroll_component_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_component_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_component_import_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_component_definitions_company_read ON public.payroll_component_definitions;
CREATE POLICY payroll_component_definitions_company_read ON public.payroll_component_definitions
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS payroll_component_import_batches_company_read ON public.payroll_component_import_batches;
CREATE POLICY payroll_component_import_batches_company_read ON public.payroll_component_import_batches
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT company_id FROM public.tenant_user_profiles WHERE user_id = auth.uid()
  ));

GRANT SELECT ON public.payroll_component_definitions TO authenticated;
GRANT SELECT ON public.payroll_component_import_batches TO authenticated;
GRANT SELECT ON public.payroll_component_import_rows TO authenticated;

NOTIFY pgrst, 'reload schema';
