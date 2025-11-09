-- Create attendance shifts table
CREATE TABLE IF NOT EXISTS public.attendance_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  shift_name VARCHAR(255) NOT NULL,
  shift_code VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  grace_period_minutes INTEGER DEFAULT 15,
  is_active BOOLEAN DEFAULT true,
  days_of_week JSONB DEFAULT '[]', -- Array of days ["Monday", "Tuesday", ...]
  color_code VARCHAR(7) DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id),
  UNIQUE(company_id, shift_code)
);

-- Enable RLS
ALTER TABLE public.attendance_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "shifts_company_access"
  ON public.attendance_shifts
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

-- Index for performance
CREATE INDEX idx_attendance_shifts_company ON public.attendance_shifts(company_id);
CREATE INDEX idx_attendance_shifts_active ON public.attendance_shifts(is_active);
