-- HR Payroll System Database Schema Setup
-- This script creates the core tables for the HR payroll system

-- Enable Row Level Security on existing tables that need it
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidiaries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies table
CREATE POLICY "Users can view their company data" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.company_id = companies.id 
      AND auth.uid()::text = employees.id::text
    )
  );

-- Create RLS policies for employees table  
CREATE POLICY "Employees can view their own data" ON employees
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "HR can view all employees in their company" ON employees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees hr_emp
      WHERE hr_emp.id::text = auth.uid()::text
      AND hr_emp.company_id = employees.company_id
      AND hr_emp.special_role IN ('HR', 'Admin')
    )
  );

-- Create RLS policies for subsidiaries table
CREATE POLICY "Users can view subsidiaries in their company" ON subsidiaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.company_id = subsidiaries.company_id 
      AND auth.uid()::text = employees.id::text
    )
  );

-- Create employee_profiles table for auth integration
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON employee_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON employee_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO employee_profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create payroll_runs table for tracking payroll processing
CREATE TABLE IF NOT EXISTS payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  subsidiary_id UUID REFERENCES subsidiaries(id),
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'cancelled')),
  total_gross_pay DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  total_net_pay DECIMAL(15,2) DEFAULT 0,
  created_by UUID REFERENCES employees(id),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage payroll runs for their company" ON payroll_runs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id::text = auth.uid()::text
      AND employees.company_id = payroll_runs.company_id
      AND employees.special_role IN ('HR', 'Admin', 'Finance')
    )
  );

-- Create payroll_items table for individual employee payroll entries
CREATE TABLE IF NOT EXISTS payroll_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id),
  basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowances JSONB DEFAULT '{}',
  deductions JSONB DEFAULT '{}',
  gross_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_deduction DECIMAL(15,2) DEFAULT 0,
  ssnit_employee DECIMAL(15,2) DEFAULT 0,
  ssnit_employer DECIMAL(15,2) DEFAULT 0,
  total_deductions DECIMAL(15,2) DEFAULT 0,
  net_pay DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own payroll items" ON payroll_items
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "HR can manage payroll items for their company" ON payroll_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id::text = auth.uid()::text
      AND employees.company_id = (
        SELECT e.company_id FROM employees e WHERE e.id = payroll_items.employee_id
      )
      AND employees.special_role IN ('HR', 'Admin', 'Finance')
    )
  );

-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type_id UUID REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested DECIMAL(4,1) NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can manage their own leave requests" ON leave_requests
  FOR ALL USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Managers can view/approve leave requests for their team" ON leave_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees manager
      WHERE manager.id::text = auth.uid()::text
      AND (
        manager.special_role IN ('HR', 'Admin') OR
        manager.id = (SELECT direct_supervisor FROM employees WHERE id = leave_requests.employee_id) OR
        manager.id = (SELECT head_of_department FROM employees WHERE id = leave_requests.employee_id)
      )
      AND manager.company_id = (SELECT company_id FROM employees WHERE id = leave_requests.employee_id)
    )
  );

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  break_start TIME,
  break_end TIME,
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'half_day', 'leave')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own attendance" ON attendance_records
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "HR can manage attendance for their company" ON attendance_records
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id::text = auth.uid()::text
      AND employees.company_id = (
        SELECT e.company_id FROM employees e WHERE e.id = attendance_records.employee_id
      )
      AND employees.special_role IN ('HR', 'Admin')
    )
  );

-- Create performance_reviews table
CREATE TABLE IF NOT EXISTS performance_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  reviewer_id UUID NOT NULL REFERENCES employees(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  goals_achievement JSONB DEFAULT '[]',
  strengths TEXT,
  areas_for_improvement TEXT,
  development_plan TEXT,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own reviews" ON performance_reviews
  FOR SELECT USING (auth.uid()::text = employee_id::text);

CREATE POLICY "Reviewers can manage reviews they conduct" ON performance_reviews
  FOR ALL USING (auth.uid()::text = reviewer_id::text);

CREATE POLICY "HR can manage all reviews in their company" ON performance_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id::text = auth.uid()::text
      AND employees.company_id = (
        SELECT e.company_id FROM employees e WHERE e.id = performance_reviews.employee_id
      )
      AND employees.special_role IN ('HR', 'Admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_auth_id ON employee_profiles(id);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_company ON payroll_runs(company_id, pay_period_start);
CREATE INDEX IF NOT EXISTS idx_payroll_items_employee ON payroll_items(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id, start_date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_performance_reviews_employee ON performance_reviews(employee_id);

-- Update timestamps trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_payroll_runs_updated_at BEFORE UPDATE ON payroll_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_items_updated_at BEFORE UPDATE ON payroll_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_reviews_updated_at BEFORE UPDATE ON performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
