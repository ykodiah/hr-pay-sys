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
