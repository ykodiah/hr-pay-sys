-- Create attendance policies table
CREATE TABLE IF NOT EXISTS public.attendance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(50) NOT NULL, -- grace_period, late_penalty, early_departure, overtime_calculation
  rules JSONB NOT NULL, -- Flexible rules configuration
  is_active BOOLEAN DEFAULT true,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id)
);

-- Enable RLS
ALTER TABLE public.attendance_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "policies_company_access"
  ON public.attendance_policies
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

-- Index
CREATE INDEX idx_attendance_policies_company ON public.attendance_policies(company_id);
CREATE INDEX idx_attendance_policies_active ON public.attendance_policies(is_active);
