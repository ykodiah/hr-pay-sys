-- Create biometric devices table
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  device_name VARCHAR(255) NOT NULL,
  device_id VARCHAR(100) NOT NULL UNIQUE,
  device_type VARCHAR(50) DEFAULT 'fingerprint', -- fingerprint, face_recognition, rfid
  location VARCHAR(255),
  ip_address INET,
  status VARCHAR(50) DEFAULT 'active', -- active, inactive, offline, maintenance
  last_sync TIMESTAMPTZ,
  firmware_version VARCHAR(50),
  total_records INTEGER DEFAULT 0,
  battery_level INTEGER,
  is_online BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.employees(id)
);

-- Enable RLS
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "devices_company_access"
  ON public.biometric_devices
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
CREATE INDEX idx_biometric_devices_company ON public.biometric_devices(company_id);
CREATE INDEX idx_biometric_devices_status ON public.biometric_devices(status);
CREATE INDEX idx_biometric_devices_online ON public.biometric_devices(is_online);
