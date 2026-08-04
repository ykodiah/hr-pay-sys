-- Attendance enhancements: shift assignment, geofence, GPS audit,
-- alert schedules, manager team helpers. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1) Employee ↔ shift assignment
-- ---------------------------------------------------------------------------
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
CREATE INDEX IF NOT EXISTS idx_emp_shift_assign_active
  ON public.employee_shift_assignments(employee_id, is_primary, effective_from);

-- ---------------------------------------------------------------------------
-- 2) Geofences for mobile / on-site clock-in
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

-- ---------------------------------------------------------------------------
-- 3) GPS audit trail
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_gps_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  event_type varchar(20) NOT NULL, -- clock_in | clock_out
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
CREATE INDEX IF NOT EXISTS idx_attendance_gps_audit_emp
  ON public.attendance_gps_audit(employee_id, created_at DESC);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS shift_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS geofence_id uuid;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_gps_lat numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_gps_lng numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_gps_lat numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_gps_lng numeric(10, 7);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_in_method varchar(40);
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS clock_out_method varchar(40);

-- ---------------------------------------------------------------------------
-- 4) Alert auto-schedule (cron-like)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_alert_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(120) NOT NULL DEFAULT 'Daily attendance scan',
  frequency varchar(40) NOT NULL DEFAULT 'daily', -- hourly | daily | weekdays
  run_hour integer DEFAULT 9, -- 0-23 local intent
  lookback_days integer DEFAULT 1,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status varchar(40),
  last_run_message text,
  last_created_count integer DEFAULT 0,
  next_run_at timestamptz,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (company_id, name)
);

CREATE INDEX IF NOT EXISTS idx_alert_schedules_due
  ON public.attendance_alert_schedules(is_active, next_run_at);

-- ---------------------------------------------------------------------------
-- 5) Shifts: ensure expected_hours / grace for late detection
-- ---------------------------------------------------------------------------
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_hours numeric(5, 2) DEFAULT 8;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS grace_period_minutes integer DEFAULT 15;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS break_duration_minutes integer DEFAULT 60;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS working_days text[] DEFAULT ARRAY['mon','tue','wed','thu','fri'];
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'employee_shift_assignments',
    'attendance_geofences',
    'attendance_gps_audit',
    'attendance_alert_schedules',
    'shifts',
    'attendance_records'
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)', t || '_all', t);
      EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon, service_role', t);
    END IF;
  END LOOP;
END $$;
