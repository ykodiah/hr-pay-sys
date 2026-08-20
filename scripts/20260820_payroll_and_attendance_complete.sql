-- =============================================================================
-- ONE-SHOT: Payroll remodel + employee portal GPS attendance schema
-- Paste into Supabase SQL Editor and run once. Safe to re-run (idempotent).
-- Or: DATABASE_URL=... npm run db:migrate:payroll
-- =============================================================================

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
-- Payroll component management and immutable period controls.
-- Group assignments are expanded to employees when created, preserving who was
-- included even if the organisation structure changes later.
-- Requires 20260820164500_tenant_profiles_and_payroll_bootstrap.sql (or equivalent).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure tenant profile map exists even if bootstrap migration was skipped.
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
  USING (company_id IN (SELECT public.auth_company_ids()));

DROP POLICY IF EXISTS payroll_components_company_read ON public.payroll_component_assignments;
CREATE POLICY payroll_components_company_read ON public.payroll_component_assignments
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.auth_company_ids()));

DROP POLICY IF EXISTS payroll_snapshots_company_read ON public.payroll_period_snapshots;
CREATE POLICY payroll_snapshots_company_read ON public.payroll_period_snapshots
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.auth_company_ids()));

GRANT SELECT ON public.payroll_periods TO authenticated;
GRANT SELECT ON public.payroll_component_assignments TO authenticated;
GRANT SELECT ON public.payroll_period_snapshots TO authenticated;

NOTIFY pgrst, 'reload schema';
-- Employee portal GPS attendance schema.
-- Creates/updates tables required for self-service clock-in/out with geofencing.
-- Safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Core attendance records
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  clock_in time,
  clock_out time,
  break_start time,
  break_end time,
  total_hours numeric(6, 2) DEFAULT 0,
  overtime_hours numeric(6, 2) DEFAULT 0,
  status varchar(20) DEFAULT 'present',
  notes text,
  source varchar(40) DEFAULT 'manual',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (employee_id, date)
);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS company_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_method varchar(40);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_method varchar(40);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_gps_lat numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_gps_lng numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_gps_lat numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_gps_lng numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_device_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_device_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS source varchar(40) DEFAULT 'manual';
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS import_batch_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS shift_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS geofence_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS department varchar(120);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS total_hours numeric(6, 2) DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS overtime_hours numeric(6, 2) DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_attendance_company_date
  ON public.attendance_records(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON public.attendance_records(employee_id, date DESC);

UPDATE public.attendance_records ar
SET company_id = e.company_id
FROM public.employees e
WHERE ar.employee_id = e.id AND ar.company_id IS NULL;

-- ---------------------------------------------------------------------------
-- Shifts + employee assignments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  code varchar(40),
  start_time time NOT NULL DEFAULT '08:00',
  end_time time NOT NULL DEFAULT '17:00',
  break_duration_minutes integer DEFAULT 60,
  grace_period_minutes integer DEFAULT 15,
  working_days text[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'],
  expected_hours numeric(5, 2) DEFAULT 8,
  department varchar(120),
  location varchar(120),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS code varchar(40);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS grace_period_minutes integer DEFAULT 15;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS break_duration_minutes integer DEFAULT 60;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_hours numeric(5, 2) DEFAULT 8;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['monday','tuesday','wednesday','thursday','friday'];
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.employee_shift_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id uuid NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  effective_to date,
  is_primary boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_emp_shift_assign_company
  ON public.employee_shift_assignments(company_id, employee_id);

-- ---------------------------------------------------------------------------
-- Geofences + GPS audit
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_geofences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  location_label text,
  latitude numeric(10, 7) NOT NULL,
  longitude numeric(10, 7) NOT NULL,
  radius_meters integer NOT NULL DEFAULT 150,
  is_active boolean DEFAULT true,
  enforce_on_clock_in boolean DEFAULT true,
  enforce_on_clock_out boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_geofences_company
  ON public.attendance_geofences(company_id, is_active);

CREATE TABLE IF NOT EXISTS public.attendance_gps_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  event_type varchar(20) NOT NULL,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  accuracy_meters numeric(10, 2),
  inside_geofence boolean,
  geofence_id uuid REFERENCES public.attendance_geofences(id) ON DELETE SET NULL,
  distance_meters numeric(12, 2),
  device_info jsonb DEFAULT '{}'::jsonb,
  ip_address varchar(64),
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_gps_audit_company
  ON public.attendance_gps_audit(company_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Portal attendance settings (GPS clock enabled by default)
-- ---------------------------------------------------------------------------
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

INSERT INTO public.company_attendance_settings (
  company_id,
  employee_gps_clock_enabled,
  require_gps,
  allow_web_clock,
  biometric_enabled,
  attendance_method_label
)
SELECT
  c.id,
  true,
  true,
  true,
  false,
  'GPS and biometric'
FROM public.companies c
ON CONFLICT (company_id) DO UPDATE
SET
  employee_gps_clock_enabled = COALESCE(public.company_attendance_settings.employee_gps_clock_enabled, true),
  allow_web_clock = COALESCE(public.company_attendance_settings.allow_web_clock, true),
  require_gps = COALESCE(public.company_attendance_settings.require_gps, true),
  attendance_method_label = COALESCE(
    public.company_attendance_settings.attendance_method_label,
    'GPS and biometric'
  ),
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Biometric devices (compatible column names for portal + admin)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  type varchar(60) DEFAULT 'fingerprint',
  device_type varchar(60) DEFAULT 'fingerprint',
  location varchar(160),
  ip_address varchar(64),
  serial_number varchar(120),
  status varchar(40) DEFAULT 'online',
  last_sync timestamptz,
  last_sync_at timestamptz,
  uptime_percentage numeric(5, 2) DEFAULT 100,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS device_type varchar(60) DEFAULT 'fingerprint';
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS type varchar(60) DEFAULT 'fingerprint';
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS last_sync timestamptz;
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

UPDATE public.biometric_devices
SET device_type = COALESCE(device_type, type, 'fingerprint'),
    last_sync_at = COALESCE(last_sync_at, last_sync)
WHERE device_type IS NULL OR last_sync_at IS NULL;

-- ---------------------------------------------------------------------------
-- Grants / RLS (service role + authenticated; APIs use service client)
-- ---------------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'attendance_records',
    'shifts',
    'employee_shift_assignments',
    'attendance_geofences',
    'attendance_gps_audit',
    'company_attendance_settings',
    'biometric_devices'
  ]
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_service_all', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
        t || '_service_all', t
      );
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_authenticated_all', t);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
        t || '_authenticated_all', t
      );
      EXECUTE format('GRANT ALL ON public.%I TO authenticated, service_role', t);
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
-- Enterprise payroll component catalogue, assignments and import audit.
-- Safe after 20260820170000_payroll_components_and_periods.sql.
-- Creates base assignment table if a prior migration was rolled back.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

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
  calculation_type TEXT NOT NULL DEFAULT 'amount',
  amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (amount >= 0),
  percentage NUMERIC(7,4) NOT NULL DEFAULT 0 CHECK (percentage >= 0),
  taxable BOOLEAN NOT NULL DEFAULT true,
  recurring BOOLEAN NOT NULL DEFAULT true,
  effective_period TEXT NOT NULL CHECK (effective_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  end_period TEXT CHECK (end_period IS NULL OR end_period ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  backpay_treatment TEXT,
  source_scope_type TEXT NOT NULL DEFAULT 'individual',
  source_scope_value TEXT,
  source_batch_id UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, category)
);

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

ALTER TABLE public.payroll_periods
  ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reopen_reason TEXT;

CREATE TABLE IF NOT EXISTS public.payroll_period_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  payroll_period_id UUID NOT NULL REFERENCES public.payroll_periods(id) ON DELETE CASCADE,
  pay_period TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('opened', 'closed', 'reopened')),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
    SET payroll_run_id = EXCLUDED.payroll_run_id,
        close_notes = EXCLUDED.close_notes,
        updated_at = now()
  RETURNING id INTO v_period_id;

  IF EXISTS (
    SELECT 1 FROM public.payroll_periods
    WHERE id = v_period_id AND status = 'closed'
  ) THEN
    RAISE EXCEPTION 'Payroll period % is already closed', p_pay_period;
  END IF;

  FOR v_snapshot IN SELECT value FROM jsonb_array_elements(p_snapshots)
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
      payroll_run_id = p_payroll_run_id,
      closed_at = now(),
      closed_by = p_actor_id,
      close_notes = p_notes,
      updated_at = now()
  WHERE id = v_period_id;

  INSERT INTO public.payroll_period_audit (
    company_id, payroll_period_id, pay_period, action, actor_id, reason,
    metadata
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

CREATE INDEX IF NOT EXISTS idx_payroll_component_definitions_company
  ON public.payroll_component_definitions(company_id, category, active, display_order);
CREATE INDEX IF NOT EXISTS idx_payroll_component_assignments_definition
  ON public.payroll_component_assignments(component_definition_id);
CREATE INDEX IF NOT EXISTS idx_payroll_component_import_batches_company
  ON public.payroll_component_import_batches(company_id, pay_period, created_at DESC);

ALTER TABLE public.payroll_component_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_component_import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_component_import_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_period_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payroll_component_definitions_company_read ON public.payroll_component_definitions;
CREATE POLICY payroll_component_definitions_company_read ON public.payroll_component_definitions
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.auth_company_ids()));

DROP POLICY IF EXISTS payroll_component_import_batches_company_read ON public.payroll_component_import_batches;
CREATE POLICY payroll_component_import_batches_company_read ON public.payroll_component_import_batches
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.auth_company_ids()));

GRANT SELECT ON public.payroll_component_definitions TO authenticated;
GRANT SELECT ON public.payroll_component_import_batches TO authenticated;
GRANT SELECT ON public.payroll_component_import_rows TO authenticated;
GRANT SELECT ON public.payroll_period_audit TO authenticated;

DROP POLICY IF EXISTS payroll_period_audit_company_read ON public.payroll_period_audit;
CREATE POLICY payroll_period_audit_company_read ON public.payroll_period_audit
  FOR SELECT TO authenticated
  USING (company_id IN (SELECT public.auth_company_ids()));

NOTIFY pgrst, 'reload schema';
