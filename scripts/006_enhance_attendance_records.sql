-- Add new columns to existing attendance_records table
ALTER TABLE public.attendance_records
ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.attendance_shifts(id),
ADD COLUMN IF NOT EXISTS device_id UUID REFERENCES public.biometric_devices(id),
ADD COLUMN IF NOT EXISTS clock_in_location POINT,
ADD COLUMN IF NOT EXISTS clock_out_location POINT,
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_early_departure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS early_departure_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_anomaly_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.employees(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Add index for company_id
CREATE INDEX IF NOT EXISTS idx_attendance_records_company ON public.attendance_records(company_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_shift ON public.attendance_records(shift_id);

-- Update existing RLS policy to include company_id check
DROP POLICY IF EXISTS "HR can manage attendance for their company" ON public.attendance_records;

CREATE POLICY "attendance_hr_company_access"
  ON public.attendance_records
  FOR ALL
  USING (
    company_id IN (
      SELECT company_id FROM public.employees
      WHERE id IN (
        SELECT employee_id FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      )
    )
  );
