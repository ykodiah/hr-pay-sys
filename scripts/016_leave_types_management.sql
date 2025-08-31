-- Create leave types table for comprehensive leave management
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL, -- e.g., 'AL', 'SL', 'ML', 'PL'
  description TEXT,
  category VARCHAR(50) NOT NULL DEFAULT 'general', -- general, medical, family, emergency
  
  -- Entitlement settings
  entitlement_type VARCHAR(20) NOT NULL DEFAULT 'annual', -- annual, monthly, fixed, unlimited
  entitlement_amount DECIMAL(5,2) DEFAULT 0, -- days per year/month
  max_days_per_year DECIMAL(5,2),
  max_consecutive_days INTEGER,
  
  -- Eligibility rules
  min_service_months INTEGER DEFAULT 0,
  eligible_genders VARCHAR(20) DEFAULT 'all', -- all, male, female
  eligible_employment_types TEXT[], -- permanent, contract, temporary
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT true,
  approval_levels INTEGER DEFAULT 1,
  auto_approve_threshold INTEGER, -- auto approve if <= this many days
  
  -- Notice and documentation
  min_notice_days INTEGER DEFAULT 0,
  requires_documentation BOOLEAN DEFAULT false,
  documentation_required_after INTEGER, -- days after which docs are required
  
  -- Payment settings
  is_paid BOOLEAN DEFAULT true,
  payment_percentage DECIMAL(5,2) DEFAULT 100.00,
  payment_cap_days INTEGER, -- max paid days
  
  -- Carry over and accrual
  allow_carry_over BOOLEAN DEFAULT false,
  max_carry_over_days DECIMAL(5,2) DEFAULT 0,
  carry_over_expiry_months INTEGER DEFAULT 12,
  accrual_start_date DATE, -- when accrual begins (e.g., after probation)
  
  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(company_id, code)
);

-- Create leave type rules table for complex conditions
CREATE TABLE IF NOT EXISTS leave_type_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
  rule_type VARCHAR(50) NOT NULL, -- eligibility, approval, accrual, payment
  condition_field VARCHAR(100) NOT NULL, -- employee_grade, department, years_of_service, etc.
  condition_operator VARCHAR(20) NOT NULL, -- equals, greater_than, less_than, in, not_in
  condition_value TEXT NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- set_entitlement, require_approval, set_payment_rate
  action_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default leave types for Ghana
INSERT INTO leave_types (
  company_id, name, code, description, category, entitlement_type, entitlement_amount, 
  max_days_per_year, requires_approval, min_notice_days, is_paid, allow_carry_over, max_carry_over_days
) VALUES 
  (
    '00000000-0000-0000-0000-000000000001', 
    'Annual Leave', 
    'AL', 
    'Annual vacation leave for rest and recreation',
    'general',
    'annual',
    21.00,
    21.00,
    true,
    14,
    true,
    true,
    5.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Sick Leave',
    'SL',
    'Medical leave for illness or injury',
    'medical',
    'annual',
    10.00,
    30.00,
    false,
    0,
    true,
    false,
    0.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Maternity Leave',
    'ML',
    'Maternity leave for female employees',
    'family',
    'fixed',
    84.00,
    84.00,
    true,
    28,
    true,
    false,
    0.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Paternity Leave',
    'PL',
    'Paternity leave for male employees',
    'family',
    'fixed',
    14.00,
    14.00,
    true,
    14,
    true,
    false,
    0.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Compassionate Leave',
    'CL',
    'Leave for bereavement and family emergencies',
    'emergency',
    'fixed',
    3.00,
    7.00,
    true,
    0,
    true,
    false,
    0.00
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    'Study Leave',
    'STL',
    'Educational leave for professional development',
    'general',
    'fixed',
    5.00,
    30.00,
    true,
    30,
    false,
    false,
    0.00
  )
ON CONFLICT (company_id, code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leave_types_company_id ON leave_types(company_id);
CREATE INDEX IF NOT EXISTS idx_leave_types_active ON leave_types(is_active);
CREATE INDEX IF NOT EXISTS idx_leave_types_category ON leave_types(category);
CREATE INDEX IF NOT EXISTS idx_leave_type_rules_leave_type_id ON leave_type_rules(leave_type_id);

-- Add RLS policies
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_type_rules ENABLE ROW LEVEL SECURITY;

-- Policy for leave_types
CREATE POLICY "Users can view leave types for their company" ON leave_types
  FOR SELECT USING (true);

CREATE POLICY "Users can manage leave types for their company" ON leave_types
  FOR ALL USING (true);

-- Policy for leave_type_rules  
CREATE POLICY "Users can view leave type rules" ON leave_type_rules
  FOR SELECT USING (true);

CREATE POLICY "Users can manage leave type rules" ON leave_type_rules
  FOR ALL USING (true);
