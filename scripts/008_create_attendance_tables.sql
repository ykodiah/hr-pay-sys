-- Create missing tables for attendance system

-- Shifts table
CREATE TABLE IF NOT EXISTS public.shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 0,
  grace_period_minutes INTEGER DEFAULT 0,
  working_days TEXT[] DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  department VARCHAR(255),
  division VARCHAR(255),
  location VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Overtime requests table
CREATE TABLE IF NOT EXISTS public.overtime_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours_requested NUMERIC(5,2) NOT NULL,
  hours_approved NUMERIC(5,2),
  reason TEXT,
  rejection_reason TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Biometric devices table
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('fingerprint', 'facial', 'card', 'iris')),
  location VARCHAR(255) NOT NULL,
  ip_address VARCHAR(50),
  serial_number VARCHAR(100),
  status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'maintenance')),
  last_sync TIMESTAMP WITH TIME ZONE,
  uptime_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for shifts
CREATE POLICY "shifts_company_access" ON public.shifts
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.employees 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for overtime_requests
CREATE POLICY "overtime_company_access" ON public.overtime_requests
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.employees 
      WHERE id = auth.uid()
    )
  );

-- RLS Policies for biometric_devices
CREATE POLICY "devices_company_access" ON public.biometric_devices
  FOR ALL USING (
    company_id IN (
      SELECT company_id FROM public.employees 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shifts_company ON public.shifts(company_id);
CREATE INDEX IF NOT EXISTS idx_overtime_employee ON public.overtime_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_status ON public.overtime_requests(status);
CREATE INDEX IF NOT EXISTS idx_devices_company ON public.biometric_devices(company_id);
