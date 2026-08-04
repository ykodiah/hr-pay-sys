-- Attendance, leave, overtime hardening for admin attendance module
-- Safe to re-run.

-- ═══════════════════════════════════════════════════════════════════════════
-- Attendance records
-- ═══════════════════════════════════════════════════════════════════════════

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
  status varchar(20) DEFAULT 'present'
    CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave', 'holiday', 'weekend')),
  notes text,
  source varchar(40) DEFAULT 'manual',
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
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
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS total_hours numeric(6, 2) DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS overtime_hours numeric(6, 2) DEFAULT 0;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_attendance_company_date ON public.attendance_records(company_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON public.attendance_records(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance_records(status);

-- Backfill company_id from employees
UPDATE public.attendance_records ar
SET company_id = e.company_id
FROM public.employees e
WHERE ar.employee_id = e.id AND ar.company_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- Shifts
-- ═══════════════════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_shifts_company ON public.shifts(company_id, is_active);

-- ═══════════════════════════════════════════════════════════════════════════
-- Biometric devices + import batches
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  type varchar(60) DEFAULT 'fingerprint'
    CHECK (type IN ('fingerprint', 'face', 'card', 'iris', 'mobile', 'web', 'manual', 'other')),
  location varchar(160),
  ip_address varchar(64),
  serial_number varchar(120),
  status varchar(40) DEFAULT 'online'
    CHECK (status IN ('online', 'offline', 'syncing', 'error', 'disabled')),
  last_sync timestamptz,
  uptime_percentage numeric(5, 2) DEFAULT 100,
  is_active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.attendance_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.biometric_devices(id) ON DELETE SET NULL,
  source varchar(40) DEFAULT 'csv',
  filename text,
  total_rows integer DEFAULT 0,
  imported_rows integer DEFAULT 0,
  skipped_rows integer DEFAULT 0,
  error_rows integer DEFAULT 0,
  status varchar(40) DEFAULT 'completed',
  errors jsonb DEFAULT '[]'::jsonb,
  uploaded_by uuid,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

DO $$ BEGIN
  ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_records_import_batch_fkey
    FOREIGN KEY (import_batch_id) REFERENCES public.attendance_import_batches(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.attendance_records
    ADD CONSTRAINT attendance_records_shift_fkey
    FOREIGN KEY (shift_id) REFERENCES public.shifts(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_biometric_devices_company ON public.biometric_devices(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_import_batches_company ON public.attendance_import_batches(company_id, created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- Leave requests / balances
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS leave_type_name varchar(120);
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS cancelled_by uuid;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS initiated_by varchar(40) DEFAULT 'employee';
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS initiated_by_user_id uuid;
ALTER TABLE public.leave_requests ADD COLUMN IF NOT EXISTS notes text;

UPDATE public.leave_requests lr
SET company_id = e.company_id
FROM public.employees e
WHERE lr.employee_id = e.id AND lr.company_id IS NULL;

CREATE TABLE IF NOT EXISTS public.leave_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type_id uuid REFERENCES public.leave_types(id) ON DELETE SET NULL,
  year integer NOT NULL,
  entitled_days numeric(8, 2) DEFAULT 0,
  used_days numeric(8, 2) DEFAULT 0,
  remaining_days numeric(8, 2) DEFAULT 0,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_company ON public.leave_requests(company_id, status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_company ON public.leave_balances(company_id, year);

-- ═══════════════════════════════════════════════════════════════════════════
-- Overtime requests
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  hours_requested numeric(6, 2) NOT NULL DEFAULT 0,
  hours_approved numeric(6, 2),
  reason text,
  status varchar(40) DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  rate_type_id uuid,
  attendance_record_id uuid REFERENCES public.attendance_records(id) ON DELETE SET NULL,
  source varchar(40) DEFAULT 'manual',
  requested_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  approved_by uuid,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS hours_approved numeric(6, 2);
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS attendance_record_id uuid;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS source varchar(40) DEFAULT 'manual';
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS rate_type_id uuid;
ALTER TABLE public.overtime_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_overtime_requests_company ON public.overtime_requests(company_id, status, date DESC);

-- Optional link to overtime_rates when table exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='overtime_rates') THEN
    BEGIN
      ALTER TABLE public.overtime_requests
        ADD CONSTRAINT overtime_requests_rate_type_id_fkey
        FOREIGN KEY (rate_type_id) REFERENCES public.overtime_rates(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Company holidays already in 097 — ensure present
CREATE TABLE IF NOT EXISTS public.company_holidays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  holiday_date date NOT NULL,
  name text NOT NULL,
  is_paid boolean DEFAULT true,
  created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, holiday_date)
);

-- RLS
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'attendance_records','shifts','biometric_devices','attendance_import_batches',
    'leave_balances','overtime_requests','company_holidays'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_all', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true)',
      t || '_all', t
    );
    EXECUTE format('GRANT ALL ON public.%I TO authenticated, anon, service_role', t);
  END LOOP;
END $$;
