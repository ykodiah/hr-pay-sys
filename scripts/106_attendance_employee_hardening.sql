-- Hardening for attendance + employee effective-dated updates/transfers.
-- Safe to re-run.

-- Shifts: ensure code column exists (older DBs may lack it)
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS code varchar(40);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS grace_period_minutes integer DEFAULT 15;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS break_duration_minutes integer DEFAULT 60;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_hours numeric(5, 2) DEFAULT 8;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Attendance records: optional denormalized department (analytics fallback uses employees)
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS department varchar(120);

-- Effective dating on audit events (HR updates apply from this date forward)
ALTER TABLE public.employee_audit_events
  ADD COLUMN IF NOT EXISTS effective_date date;

CREATE INDEX IF NOT EXISTS idx_emp_audit_effective
  ON public.employee_audit_events(employee_id, effective_date DESC);

-- Latest transfer date helper column on employees (display only; history in employee_transfers)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS last_transfer_date date;
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS last_transfer_id uuid;

COMMENT ON COLUMN public.employees.last_transfer_date IS
  'Display: most recent applied transfer effective date; org fields remain current.';
