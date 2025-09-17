-- Create employees table with comprehensive HR fields
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal Information
  prefix VARCHAR(10),
  first_name VARCHAR(100) NOT NULL,
  other_names VARCHAR(200),
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(300) NOT NULL,
  
  -- Contact Information
  personal_email VARCHAR(255) NOT NULL,
  corporate_email VARCHAR(255),
  phone_number VARCHAR(20),
  address TEXT,
  
  -- Personal Details
  date_of_birth DATE,
  gender VARCHAR(20),
  marital_status VARCHAR(20),
  educational_level VARCHAR(100),
  
  -- Emergency Contact
  emergency_contact_name VARCHAR(200),
  emergency_contact_tel VARCHAR(20),
  
  -- Employment Information
  department VARCHAR(100),
  position VARCHAR(100),
  hire_date DATE DEFAULT CURRENT_DATE,
  employment_type VARCHAR(50) DEFAULT 'Full-time',
  salary DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'Active',
  
  -- System Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for employees table
CREATE POLICY "Allow authenticated users to view employees" 
  ON public.employees FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert employees" 
  ON public.employees FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update employees" 
  ON public.employees FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete employees" 
  ON public.employees FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_employees_updated_at 
  BEFORE UPDATE ON public.employees 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON public.employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
