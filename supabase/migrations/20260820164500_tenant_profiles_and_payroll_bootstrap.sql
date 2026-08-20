-- Bootstrap prerequisites for payroll remodel + portal RLS.
-- Must run before payroll component migrations. Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenant admin/user profile map (used by payroll RLS policies)
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'auth' AND table_name = 'users'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_user_profiles
      ADD CONSTRAINT tenant_user_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'companies'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_profiles_company_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_user_profiles
      ADD CONSTRAINT tenant_user_profiles_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'employees'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_user_profiles_employee_id_fkey'
  ) THEN
    ALTER TABLE public.tenant_user_profiles
      ADD CONSTRAINT tenant_user_profiles_employee_id_fkey
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tenant_user_profiles_company
  ON public.tenant_user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_tenant_user_profiles_employee
  ON public.tenant_user_profiles(employee_id);

ALTER TABLE public.tenant_user_profiles ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.tenant_user_profiles TO authenticated, service_role;

-- Helper used by payroll policies so CREATE POLICY never depends on a missing table.
CREATE OR REPLACE FUNCTION public.auth_company_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.tenant_user_profiles
  WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.auth_company_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_company_ids() TO authenticated, service_role;
