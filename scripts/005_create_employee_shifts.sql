-- Create employee shifts assignment table
CREATE TABLE IF NOT EXISTS public.employee_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES public.attendance_shifts(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES public.employees(id)
);

-- Enable RLS
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "employee_shifts_view"
  ON public.employee_shifts
  FOR SELECT
  USING (
    employee_id = (SELECT id FROM public.employees WHERE id = auth.uid())
    OR employee_id IN (
      SELECT id FROM public.employees
      WHERE company_id IN (
        SELECT company_id FROM public.employees e
        JOIN public.user_roles ur ON e.id = ur.employee_id
        JOIN public.roles r ON ur.role_id = r.id
        WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      )
    )
  );

CREATE POLICY "employee_shifts_manage"
  ON public.employee_shifts
  FOR ALL
  USING (
    employee_id IN (
      SELECT id FROM public.employees
      WHERE company_id IN (
        SELECT company_id FROM public.employees e
        JOIN public.user_roles ur ON e.id = ur.employee_id
        JOIN public.roles r ON ur.role_id = r.id
        WHERE r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      )
    )
  );

-- Indexes
CREATE INDEX idx_employee_shifts_employee ON public.employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_shift ON public.employee_shifts(shift_id);
CREATE INDEX idx_employee_shifts_active ON public.employee_shifts(is_active);
