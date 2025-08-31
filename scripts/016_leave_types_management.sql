-- Create comprehensive leave types management tables

-- Leave Types table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL, -- e.g., 'AL', 'SL', 'ML', 'PL'
  description TEXT,
  
  -- Entitlement settings
  annual_entitlement DECIMAL(5,2) DEFAULT 0, -- Days per year
  accrual_method VARCHAR(20) DEFAULT 'annual', -- 'annual', 'monthly', 'per_pay_period'
  accrual_rate DECIMAL(5,2) DEFAULT 0, -- Rate for monthly/per_pay_period accrual
  
  -- Eligibility settings
  min_service_months INTEGER DEFAULT 0, -- Minimum service required
  max_consecutive_days INTEGER, -- Maximum consecutive days allowed
  max_per_year DECIMAL(5,2), -- Maximum days per year
  
  -- Carry over settings
  allow_carry_over BOOLEAN DEFAULT false,
  max_carry_over_days DECIMAL(5,2) DEFAULT 0,
  carry_over_expiry_months INTEGER DEFAULT 12,
  
  -- Notice and approval settings
  min_notice_days INTEGER DEFAULT 0,
  requires_approval BOOLEAN DEFAULT true,
  requires_medical_certificate BOOLEAN DEFAULT false,
  medical_cert_after_days INTEGER DEFAULT 3,
  
  -- Payment settings
  is_paid BOOLEAN DEFAULT true,
  pay_percentage DECIMAL(5,2) DEFAULT 100.00,
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  is_system_default BOOLEAN DEFAULT false, -- For system-defined leave types
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(company_id, code)
);

-- Leave type approval workflow
CREATE TABLE IF NOT EXISTS leave_type_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL, -- 1, 2, 3, etc.
  approver_role VARCHAR(50), -- 'line_manager', 'hr', 'department_head', 'ceo'
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave type eligibility rules
CREATE TABLE IF NOT EXISTS leave_type_eligibility (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  employee_type VARCHAR(50), -- 'permanent', 'contract', 'probation', 'all'
  gender VARCHAR(20), -- 'male', 'female', 'all'
  min_age INTEGER,
  max_age INTEGER,
  department_id UUID,
  location_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default leave types for Ghana
INSERT INTO leave_types (
  company_id, name, code, description, annual_entitlement, accrual_method,
  min_service_months, requires_approval, is_paid, is_system_default
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'Annual Leave', 
    'AL', 
    'Annual vacation leave for rest and recreation',
    21.00, 
    'monthly',
    3, 
    true, 
    true, 
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Sick Leave', 
    'SL', 
    'Leave for medical treatment and recovery',
    10.00, 
    'annual',
    0, 
    true, 
    true, 
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Maternity Leave', 
    'ML', 
    'Leave for female employees during childbirth',
    84.00, 
    'annual',
    12, 
    true, 
    true, 
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Paternity Leave', 
    'PL', 
    'Leave for male employees during childbirth',
    14.00, 
    'annual',
    12, 
    true, 
    true, 
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Compassionate Leave', 
    'CL', 
    'Leave for bereavement and family emergencies',
    5.00, 
    'annual',
    0, 
    true, 
    true, 
    true
  ),
  (
    '00000000-0000-0000-0000-000000000001', 
    'Study Leave', 
    'STL', 
    'Leave for educational and professional development',
    0.00, 
    'annual',
    24, 
    true, 
    false, 
    true
  )
ON CONFLICT (company_id, code) DO NOTHING;

-- Insert default approval workflows
INSERT INTO leave_type_approvers (leave_type_id, approval_level, approver_role, is_required)
SELECT 
  lt.id,
  1,
  'line_manager',
  true
FROM leave_types lt 
WHERE lt.company_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

INSERT INTO leave_type_approvers (leave_type_id, approval_level, approver_role, is_required)
SELECT 
  lt.id,
  2,
  'hr',
  CASE WHEN lt.code IN ('ML', 'PL', 'STL') THEN true ELSE false END
FROM leave_types lt 
WHERE lt.company_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_types_company_id ON leave_types(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_type_approvers_leave_type ON leave_type_approvers(leave_type_id);
CREATE INDEX IF NOT EXISTS idx_leave_type_eligibility_leave_type ON leave_type_eligibility(leave_type_id);

-- Enable RLS
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_type_approvers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_type_eligibility ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view leave types for their company" ON leave_types
  FOR SELECT USING (true);

CREATE POLICY "Users can manage leave types for their company" ON leave_types
  FOR ALL USING (true);

CREATE POLICY "Users can view leave type approvers" ON leave_type_approvers
  FOR SELECT USING (true);

CREATE POLICY "Users can manage leave type approvers" ON leave_type_approvers
  FOR ALL USING (true);

CREATE POLICY "Users can view leave type eligibility" ON leave_type_eligibility
  FOR SELECT USING (true);

CREATE POLICY "Users can manage leave type eligibility" ON leave_type_eligibility
  FOR ALL USING (true);
