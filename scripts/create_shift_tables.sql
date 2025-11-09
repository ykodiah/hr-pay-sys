-- Create shifts table for shift templates/types
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_name VARCHAR(100) NOT NULL,
  shift_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'MOR', 'EVE', 'NIG'
  department VARCHAR(100),
  
  -- Shift timing
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours DECIMAL(5,2),
  
  -- Shift details
  break_duration_minutes INTEGER DEFAULT 60,
  color_code VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar display
  description TEXT,
  
  -- Capacity
  required_staff INTEGER DEFAULT 1,
  max_staff INTEGER,
  
  -- Flags
  is_overnight BOOLEAN DEFAULT false, -- For shifts crossing midnight
  is_weekend BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create shift_assignments table for employee-shift roster
CREATE TABLE IF NOT EXISTS shift_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  assignment_date DATE NOT NULL,
  
  -- Assignment details
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled', 'swap_requested')),
  notes TEXT,
  
  -- Confirmation
  confirmed_by UUID REFERENCES employees(id),
  confirmed_at TIMESTAMP,
  
  -- Swap/Change tracking
  swap_with_employee_id UUID REFERENCES employees(id),
  swap_requested_at TIMESTAMP,
  swap_approved BOOLEAN,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Prevent duplicate assignments
  UNIQUE(employee_id, assignment_date, shift_id)
);

-- Create shift_templates for recurring schedules
CREATE TABLE IF NOT EXISTS shift_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  
  -- Template settings
  pattern_type VARCHAR(50) DEFAULT 'weekly', -- weekly, bi-weekly, monthly, rotating
  rotation_days INTEGER DEFAULT 7,
  effective_from DATE,
  effective_to DATE,
  
  -- Template metadata
  created_by UUID REFERENCES employees(id),
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create shift_template_details for pattern definitions
CREATE TABLE IF NOT EXISTS shift_template_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES shift_templates(id) ON DELETE CASCADE,
  shift_id UUID NOT NULL REFERENCES shifts(id),
  
  -- Pattern definition
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  week_number INTEGER DEFAULT 1, -- For rotating schedules
  position_in_rotation INTEGER,
  
  -- Staff allocation
  required_count INTEGER DEFAULT 1,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create shift_coverage table for analytics
CREATE TABLE IF NOT EXISTS shift_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id),
  coverage_date DATE NOT NULL,
  
  -- Coverage metrics
  required_staff INTEGER NOT NULL,
  assigned_staff INTEGER DEFAULT 0,
  confirmed_staff INTEGER DEFAULT 0,
  absent_staff INTEGER DEFAULT 0,
  coverage_percentage DECIMAL(5,2),
  
  -- Status
  is_understaffed BOOLEAN DEFAULT false,
  is_overstaffed BOOLEAN DEFAULT false,
  
  calculated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(shift_id, coverage_date)
);

-- Create shift_preferences for employee availability
CREATE TABLE IF NOT EXISTS shift_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  shift_id UUID REFERENCES shifts(id),
  
  -- Preference type
  preference_type VARCHAR(20) CHECK (preference_type IN ('preferred', 'available', 'unavailable', 'restricted')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  
  -- Details
  reason TEXT,
  priority INTEGER DEFAULT 1, -- 1=low, 5=high
  
  -- Validity
  effective_from DATE,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create shift_swap_requests for employee shift exchanges
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_employee_id UUID NOT NULL REFERENCES employees(id),
  target_employee_id UUID NOT NULL REFERENCES employees(id),
  requesting_assignment_id UUID NOT NULL REFERENCES shift_assignments(id),
  target_assignment_id UUID REFERENCES shift_assignments(id),
  
  -- Request details
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Approval
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee ON shift_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date ON shift_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift ON shift_assignments(shift_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_status ON shift_assignments(assignment_date, status);
CREATE INDEX IF NOT EXISTS idx_shift_coverage_date ON shift_coverage(coverage_date);
CREATE INDEX IF NOT EXISTS idx_shift_preferences_employee ON shift_preferences(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_status ON shift_swap_requests(status);

-- Insert default shifts
INSERT INTO shifts (shift_name, shift_code, start_time, end_time, duration_hours, color_code, description) VALUES
('Morning Shift', 'MOR', '06:00', '14:00', 8.0, '#3B82F6', 'Early morning shift'),
('Day Shift', 'DAY', '09:00', '17:00', 8.0, '#10B981', 'Standard day shift'),
('Evening Shift', 'EVE', '14:00', '22:00', 8.0, '#F59E0B', 'Evening shift'),
('Night Shift', 'NIG', '22:00', '06:00', 8.0, '#8B5CF6', 'Overnight shift'),
('Split Shift', 'SPL', '09:00', '13:00', 4.0, '#EC4899', 'Part-time split shift')
ON CONFLICT (shift_code) DO NOTHING;
