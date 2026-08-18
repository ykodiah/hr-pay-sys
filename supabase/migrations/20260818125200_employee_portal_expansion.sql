-- Employee portal expansion: attendance, authority lines, document routing,
-- disciplinary visibility, role-scoped workspaces, admin profiles and loan balances.

CREATE TABLE IF NOT EXISTS public.tenant_user_profiles (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_tenant_user_profiles_company
  ON public.tenant_user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_profiles_employee
  ON public.tenant_user_profiles(employee_id);

ALTER TABLE public.employee_portal_accounts
  ADD COLUMN IF NOT EXISTS access_level varchar(40) DEFAULT 'employee',
  ADD COLUMN IF NOT EXISTS approval_permissions text[] DEFAULT '{}';

ALTER TABLE public.document_vault
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS submitted_to_roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS submitted_to_employee_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS employee_visible boolean DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_document_vault_company_employee
  ON public.document_vault(company_id, employee_id, upload_date DESC);

ALTER TABLE public.disciplinary_cases
  ADD COLUMN IF NOT EXISTS employee_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS employee_response text,
  ADD COLUMN IF NOT EXISTS employee_responded_at timestamptz;

ALTER TABLE public.disciplinary_actions
  ADD COLUMN IF NOT EXISTS employee_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS employee_response text;

CREATE TABLE IF NOT EXISTS public.company_attendance_settings (
  company_id uuid PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_gps_clock_enabled boolean NOT NULL DEFAULT true,
  require_gps boolean NOT NULL DEFAULT true,
  allow_web_clock boolean NOT NULL DEFAULT true,
  biometric_enabled boolean NOT NULL DEFAULT false,
  attendance_method_label varchar(120) DEFAULT 'GPS and biometric',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.approval_authority_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  approver_employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  authority_type varchar(40) NOT NULL DEFAULT 'supervisor',
  approval_scope text[] NOT NULL DEFAULT ARRAY['leave', 'overtime'],
  sequence_no integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, employee_id, approver_employee_id, authority_type, sequence_no)
);

CREATE INDEX IF NOT EXISTS idx_authority_lines_employee
  ON public.approval_authority_lines(company_id, employee_id, sequence_no);
CREATE INDEX IF NOT EXISTS idx_authority_lines_approver
  ON public.approval_authority_lines(company_id, approver_employee_id, is_active);

-- Existing employee hierarchy remains authoritative. Seed explicit lines so future
-- multi-step workflows can use a stable sequence without losing legacy data.
INSERT INTO public.approval_authority_lines
  (company_id, employee_id, approver_employee_id, authority_type, approval_scope, sequence_no)
SELECT e.company_id, e.id, e.direct_supervisor, 'supervisor',
       ARRAY['leave', 'overtime', 'documents', 'profile_changes', 'loans'], 1
FROM public.employees e
WHERE e.company_id IS NOT NULL AND e.direct_supervisor IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_authority_lines
  (company_id, employee_id, approver_employee_id, authority_type, approval_scope, sequence_no)
SELECT e.company_id, e.id, e.head_of_department, 'head_of_department',
       ARRAY['leave', 'overtime', 'documents', 'disciplinary', 'loans'], 2
FROM public.employees e
WHERE e.company_id IS NOT NULL
  AND e.head_of_department IS NOT NULL
  AND e.head_of_department IS DISTINCT FROM e.direct_supervisor
ON CONFLICT DO NOTHING;

-- Fixed/flat loans owe principal + the full fixed-term interest less repayments.
-- Other methods retain their schedule-driven balance semantics.
CREATE OR REPLACE FUNCTION public.loan_remaining_balance(
  p_interest_type text,
  p_principal numeric,
  p_total_interest numeric,
  p_expected_total numeric,
  p_amount_paid numeric,
  p_existing_balance numeric
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT round(
    GREATEST(
      0,
      CASE
        WHEN lower(replace(coalesce(p_interest_type, 'fixed'), '-', '_'))
             IN ('fixed', 'flat', 'fixed_term', 'flat_rate')
          THEN GREATEST(
            coalesce(p_expected_total, 0),
            coalesce(p_principal, 0) + coalesce(p_total_interest, 0)
          ) - coalesce(p_amount_paid, 0)
        ELSE coalesce(
          p_existing_balance,
          GREATEST(coalesce(p_principal, 0) - coalesce(p_amount_paid, 0), 0)
        )
      END
    ),
    2
  );
$$;

UPDATE public.employee_loans
SET remaining_balance = public.loan_remaining_balance(
      interest_type, principal, total_interest, expected_total_payment, amount_paid, remaining_balance
    ),
    outstanding_balance = public.loan_remaining_balance(
      interest_type, principal, total_interest, expected_total_payment, amount_paid, outstanding_balance
    ),
    updated_at = now()
WHERE lower(replace(coalesce(interest_type, 'fixed'), '-', '_'))
      IN ('fixed', 'flat', 'fixed_term', 'flat_rate');

ALTER TABLE public.tenant_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_attendance_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_authority_lines ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.tenant_user_profiles TO authenticated, service_role;
GRANT ALL ON public.company_attendance_settings TO authenticated, service_role;
GRANT ALL ON public.approval_authority_lines TO authenticated, service_role;
