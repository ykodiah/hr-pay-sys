-- =============================================================================
-- 095: Financial Data Auto-Capture & Sync
-- Safe / idempotent.
-- =============================================================================

-- Modify employees table for financial sync tracking
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS bank_account_auto_synced BOOLEAN DEFAULT false;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS ssnit_auto_synced BOOLEAN DEFAULT false;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS financial_data_synced_at TIMESTAMPTZ;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS financial_data_synced_from_checklist_id UUID REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE SET NULL;

-- Create table for onboarding financial data snapshot
CREATE TABLE IF NOT EXISTS public.employee_onboarding_financial_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  onboarding_checklist_id UUID REFERENCES public.recruitment_onboarding_checklists(id) ON DELETE SET NULL,
  -- Bank details
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_number TEXT,
  bank_account_type TEXT,
  account_holder_name TEXT,
  -- SSNIT details
  ssnit_number TEXT,
  ssnit_registered_date DATE,
  -- Payroll details
  monthly_salary DECIMAL(15, 2),
  salary_currency TEXT DEFAULT 'GHS',
  tax_id TEXT,
  tax_status TEXT,
  pension_id TEXT,
  pension_provider TEXT,
  -- Health insurance
  health_insurance_provider TEXT,
  health_insurance_number TEXT,
  insurance_beneficiary TEXT,
  insurance_relationship TEXT,
  -- Additional financial info
  other_deductions JSONB DEFAULT '{}'::jsonb,
  allowances JSONB DEFAULT '{}'::jsonb,
  -- Sync metadata
  synced_to_employee_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  synced_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  is_latest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_financial_data_employee
  ON public.employee_onboarding_financial_data (employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_data_company
  ON public.employee_onboarding_financial_data (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_financial_data_checklist
  ON public.employee_onboarding_financial_data (onboarding_checklist_id);

CREATE INDEX IF NOT EXISTS idx_financial_data_latest
  ON public.employee_onboarding_financial_data (employee_id, is_latest)
  WHERE is_latest = true;

-- Enable RLS
ALTER TABLE public.employee_onboarding_financial_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'employee_onboarding_financial_data'
      AND policyname = 'employee_financial_data_all'
  ) THEN
    CREATE POLICY employee_financial_data_all ON public.employee_onboarding_financial_data
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

NOTIFY pgrst, 'reload schema';
