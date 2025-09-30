-- Roles and Permissions Settings Tables
-- This script updates roles and permissions tables to support all settings page features

-- Update roles table to add subsidiary support
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE;

-- Update permissions table to add subsidiary support if needed
ALTER TABLE permissions
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Role Assignment History table for audit trail
CREATE TABLE IF NOT EXISTS role_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  
  action VARCHAR(20) NOT NULL, -- 'assigned', 'removed', 'modified'
  previous_role_id UUID REFERENCES roles(id),
  
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  reason TEXT,
  metadata JSONB
);

-- Permission Assignment History table
CREATE TABLE IF NOT EXISTS permission_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  action VARCHAR(20) NOT NULL, -- 'granted', 'revoked'
  
  assigned_by UUID,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  
  reason TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_subsidiary ON roles(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_permissions_company ON permissions(company_id);
CREATE INDEX IF NOT EXISTS idx_role_history_employee ON role_assignment_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_role_history_company ON role_assignment_history(company_id);
CREATE INDEX IF NOT EXISTS idx_permission_history_role ON permission_assignment_history(role_id);

-- Enable RLS
ALTER TABLE role_assignment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_assignment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow all access to role_assignment_history" ON role_assignment_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to permission_assignment_history" ON permission_assignment_history FOR ALL USING (true) WITH CHECK (true);
