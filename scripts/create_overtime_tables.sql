-- Create overtime_requests table for tracking overtime requests and approvals
CREATE TABLE IF NOT EXISTS overtime_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  attendance_record_id UUID REFERENCES attendance_records(id),
  date DATE NOT NULL,
  overtime_hours DECIMAL(5,2) NOT NULL,
  reason TEXT NOT NULL,
  justification TEXT,
  
  -- Approval workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approval_level INTEGER DEFAULT 1, -- 1: Manager, 2: HR, 3: Payroll
  current_approver_role VARCHAR(50),
  
  -- Manager approval
  manager_approved_by UUID REFERENCES employees(id),
  manager_approved_at TIMESTAMP,
  manager_comments TEXT,
  
  -- HR approval
  hr_approved_by UUID REFERENCES employees(id),
  hr_approved_at TIMESTAMP,
  hr_comments TEXT,
  
  -- Payroll approval
  payroll_approved_by UUID REFERENCES employees(id),
  payroll_approved_at TIMESTAMP,
  payroll_comments TEXT,
  
  -- Rejection
  rejected_by UUID REFERENCES employees(id),
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  -- Metadata
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT positive_overtime CHECK (overtime_hours > 0),
  CONSTRAINT valid_approval_level CHECK (approval_level BETWEEN 1 AND 3)
);

-- Create overtime_audit_log for tracking all approval actions
CREATE TABLE IF NOT EXISTS overtime_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overtime_request_id UUID NOT NULL REFERENCES overtime_requests(id),
  action VARCHAR(50) NOT NULL, -- submitted, approved, rejected, cancelled, commented
  actor_id UUID REFERENCES employees(id),
  actor_name VARCHAR(255),
  actor_role VARCHAR(100),
  previous_status VARCHAR(20),
  new_status VARCHAR(20),
  comments TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create overtime_policies for managing overtime rules
CREATE TABLE IF NOT EXISTS overtime_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  
  -- Policy rules
  daily_overtime_threshold DECIMAL(5,2) DEFAULT 8.0,
  weekly_overtime_threshold DECIMAL(5,2) DEFAULT 40.0,
  max_daily_overtime DECIMAL(5,2) DEFAULT 4.0,
  max_weekly_overtime DECIMAL(5,2) DEFAULT 12.0,
  
  -- Rate multipliers
  overtime_rate_multiplier DECIMAL(5,2) DEFAULT 1.5,
  weekend_rate_multiplier DECIMAL(5,2) DEFAULT 2.0,
  holiday_rate_multiplier DECIMAL(5,2) DEFAULT 2.5,
  
  -- Approval settings
  require_manager_approval BOOLEAN DEFAULT true,
  require_hr_approval BOOLEAN DEFAULT true,
  require_payroll_approval BOOLEAN DEFAULT false,
  auto_approve_under_hours DECIMAL(5,2),
  
  -- Grace periods and rounding
  grace_period_minutes INTEGER DEFAULT 15,
  rounding_minutes INTEGER DEFAULT 15, -- Round to nearest 15 minutes
  
  -- Fatigue and wellness
  require_rest_period_hours INTEGER DEFAULT 12,
  max_consecutive_overtime_days INTEGER DEFAULT 5,
  trigger_wellness_check_hours DECIMAL(5,2) DEFAULT 10.0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  effective_from DATE,
  effective_to DATE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_overtime_requests_employee ON overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_status ON overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_overtime_requests_date ON overtime_requests(date);
CREATE INDEX IF NOT EXISTS idx_overtime_audit_request ON overtime_audit_log(overtime_request_id);
CREATE INDEX IF NOT EXISTS idx_overtime_policies_department ON overtime_policies(department);

-- Insert default overtime policy
INSERT INTO overtime_policies (
  policy_name,
  daily_overtime_threshold,
  max_daily_overtime,
  overtime_rate_multiplier,
  require_manager_approval,
  require_hr_approval,
  is_active
) VALUES (
  'Default Company Policy',
  8.0,
  4.0,
  1.5,
  true,
  true,
  true
) ON CONFLICT DO NOTHING;
