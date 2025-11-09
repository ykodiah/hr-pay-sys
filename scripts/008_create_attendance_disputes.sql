-- Create attendance disputes table for employee corrections
CREATE TABLE IF NOT EXISTS public.attendance_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  attendance_record_id UUID NOT NULL REFERENCES public.attendance_records(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  dispute_reason TEXT NOT NULL,
  proposed_clock_in TIME,
  proposed_clock_out TIME,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.employees(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_company ON public.attendance_disputes(company_id);
CREATE INDEX IF NOT EXISTS idx_disputes_employee ON public.attendance_disputes(employee_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.attendance_disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_record ON public.attendance_disputes(attendance_record_id);

-- RLS Policies
ALTER TABLE public.attendance_disputes ENABLE ROW LEVEL SECURITY;

-- Employees can view their own disputes
CREATE POLICY "Employees can view own disputes" ON public.attendance_disputes
  FOR SELECT
  USING (
    employee_id::text = auth.uid()::text
  );

-- Employees can create their own disputes
CREATE POLICY "Employees can create disputes" ON public.attendance_disputes
  FOR INSERT
  WITH CHECK (
    employee_id::text = auth.uid()::text
    AND employee_id IN (
      SELECT id FROM public.employees WHERE company_id = attendance_disputes.company_id
    )
  );

-- HR/Admins can view and update all disputes in their company
CREATE POLICY "HR can manage all disputes" ON public.attendance_disputes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.employee_id::text = auth.uid()::text
      AND r.code IN ('SUPER_ADMIN', 'ADMIN', 'HR_MANAGER')
      AND ur.employee_id IN (
        SELECT id FROM public.employees WHERE company_id = attendance_disputes.company_id
      )
    )
  );

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_dispute_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_disputes_updated
  BEFORE UPDATE ON public.attendance_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_dispute_timestamp();
