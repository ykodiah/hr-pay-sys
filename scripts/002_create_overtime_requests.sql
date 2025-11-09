-- Create overtime requests table
CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours_requested NUMERIC(5,2) NOT NULL,
  overtime_type VARCHAR(50) NOT NULL DEFAULT 'weekday', -- weekday, weekend, holiday
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  requested_by UUID REFERENCES public.employees(id),
  approved_by UUID REFERENCES public.employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "overtime_employee_view"
  ON public.overtime_requests
  FOR SELECT
  USING (
    employee_id = (SELECT id FROM public.employees WHERE id = auth.uid())
  );

CREATE POLICY "overtime_hr_manage"
  ON public.overtime_requests
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

-- Indexes
CREATE INDEX idx_overtime_requests_employee ON public.overtime_requests(employee_id);
CREATE INDEX idx_overtime_requests_company ON public.overtime_requests(company_id);
CREATE INDEX idx_overtime_requests_status ON public.overtime_requests(status);
CREATE INDEX idx_overtime_requests_date ON public.overtime_requests(request_date);
