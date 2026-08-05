-- Ensure loan_types columns used by Loan Settings UI persist and sync
-- Safe to re-run. Complements 090 / 092.

CREATE TABLE IF NOT EXISTS public.loan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  interest_type VARCHAR(50) NOT NULL DEFAULT 'reducing_balance'
    CHECK (interest_type IN ('fixed', 'reducing_balance', 'daily_compound')),
  annual_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  min_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
  max_amount NUMERIC(15, 2) NOT NULL DEFAULT 1000000,
  min_tenure_months INTEGER NOT NULL DEFAULT 3,
  max_tenure_months INTEGER NOT NULL DEFAULT 60,
  default_tenure_months INTEGER NOT NULL DEFAULT 12,
  processing_fee_type VARCHAR(50) DEFAULT 'fixed',
  processing_fee_amount NUMERIC(15, 2) DEFAULT 0,
  insurance_fee_type VARCHAR(50) DEFAULT 'fixed',
  insurance_fee_amount NUMERIC(15, 2) DEFAULT 0,
  admin_fee_type VARCHAR(50) DEFAULT 'fixed',
  admin_fee_amount NUMERIC(15, 2) DEFAULT 0,
  requires_approval BOOLEAN DEFAULT TRUE,
  auto_approve_max_amount NUMERIC(15, 2) DEFAULT 0,
  approval_roles TEXT[] DEFAULT ARRAY['admin', 'finance_manager'],
  min_service_months INTEGER DEFAULT 0,
  min_monthly_salary NUMERIC(15, 2) DEFAULT 0,
  max_loan_multiplier NUMERIC(5, 2) DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_by uuid,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_by uuid,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, code)
);

ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS interest_type VARCHAR(50) DEFAULT 'reducing_balance';
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS annual_interest_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS min_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS max_amount NUMERIC(15, 2) DEFAULT 1000000;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS min_tenure_months INTEGER DEFAULT 3;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS max_tenure_months INTEGER DEFAULT 60;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS default_tenure_months INTEGER DEFAULT 12;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS processing_fee_type VARCHAR(50) DEFAULT 'fixed';
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS processing_fee_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS insurance_fee_type VARCHAR(50) DEFAULT 'fixed';
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS insurance_fee_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS admin_fee_type VARCHAR(50) DEFAULT 'fixed';
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS admin_fee_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS auto_approve_max_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS approval_roles TEXT[] DEFAULT ARRAY['admin', 'finance_manager'];
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS min_service_months INTEGER DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS min_monthly_salary NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS max_loan_multiplier NUMERIC(5, 2) DEFAULT 3;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE public.loan_types ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Normalize fee types / active flags
UPDATE public.loan_types
SET
  processing_fee_type = COALESCE(NULLIF(processing_fee_type, ''), 'fixed'),
  insurance_fee_type = COALESCE(NULLIF(insurance_fee_type, ''), 'fixed'),
  admin_fee_type = COALESCE(NULLIF(admin_fee_type, ''), 'fixed'),
  processing_fee_amount = COALESCE(processing_fee_amount, 0),
  insurance_fee_amount = COALESCE(insurance_fee_amount, 0),
  admin_fee_amount = COALESCE(admin_fee_amount, 0),
  requires_approval = COALESCE(requires_approval, TRUE),
  is_active = COALESCE(is_active, TRUE),
  approval_roles = COALESCE(approval_roles, ARRAY['admin', 'finance_manager']::TEXT[]),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_loan_types_company_active ON public.loan_types(company_id, is_active);
CREATE INDEX IF NOT EXISTS idx_loan_types_sort ON public.loan_types(company_id, sort_order);

ALTER TABLE public.loan_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS loan_types_all ON public.loan_types;
CREATE POLICY loan_types_all ON public.loan_types
  FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.loan_types TO authenticated, anon, service_role;
