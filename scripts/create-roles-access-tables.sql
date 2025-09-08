-- Create comprehensive roles & access management database tables
-- This script creates tables to support CRUD operations, AI analytics, and real-time updates

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Roles table - Store role definitions
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    code VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1, -- Role hierarchy level (1=lowest, 10=highest)
    is_system_role BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_role_code_per_company UNIQUE(company_id, code),
    CONSTRAINT unique_role_name_per_company UNIQUE(company_id, name)
);

-- 2. Permissions table - Store available permissions
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- e.g., 'hr', 'payroll', 'admin', 'reports'
    resource VARCHAR(100) NOT NULL, -- e.g., 'employees', 'salary', 'settings'
    action VARCHAR(50) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    is_system_permission BOOLEAN DEFAULT TRUE, -- System permissions are predefined
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_permission_resource_action UNIQUE(resource, action)
);

-- 3. Role Permissions table - Many-to-many relationship
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES public.employees(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_role_permission UNIQUE(role_id, permission_id)
);

-- 4. User Roles table - Assign roles to users
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.employees(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional role expiration
    is_active BOOLEAN DEFAULT TRUE,
    
    CONSTRAINT unique_user_role UNIQUE(employee_id, role_id)
);

-- 5. Access Logs table - Track access attempts and security events
CREATE TABLE IF NOT EXISTS public.access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES public.employees(id),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'login', 'access_page', 'permission_denied'
    resource VARCHAR(100), -- What was accessed
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason TEXT, -- If success=false, why it failed
    metadata JSONB, -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Security Analytics table - Store AI-generated insights
CREATE TABLE IF NOT EXISTS public.security_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES public.companies(id),
    analysis_type VARCHAR(50) NOT NULL, -- e.g., 'risk_assessment', 'anomaly_detection', 'compliance_check'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    recommendations JSONB, -- AI-generated recommendations
    affected_users UUID[], -- Array of employee IDs
    affected_roles UUID[], -- Array of role IDs
    risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
    confidence_score NUMERIC(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID REFERENCES public.employees(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_company_id ON public.roles(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_active ON public.roles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_permissions_category ON public.permissions(category);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON public.role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_employee_id ON public.user_roles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_access_logs_employee_id ON public.access_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_company_id ON public.access_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON public.access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_analytics_company_id ON public.security_analytics(company_id);
CREATE INDEX IF NOT EXISTS idx_security_analytics_severity ON public.security_analytics(severity);
CREATE INDEX IF NOT EXISTS idx_security_analytics_resolved ON public.security_analytics(is_resolved);

-- Insert default system permissions
INSERT INTO public.permissions (name, description, category, resource, action) VALUES
-- Employee Management
('View Employees', 'View employee information', 'hr', 'employees', 'read'),
('Create Employees', 'Add new employees', 'hr', 'employees', 'create'),
('Update Employees', 'Edit employee information', 'hr', 'employees', 'update'),
('Delete Employees', 'Remove employees', 'hr', 'employees', 'delete'),

-- Payroll Management
('View Payroll', 'View payroll information', 'payroll', 'payroll', 'read'),
('Process Payroll', 'Process employee payroll', 'payroll', 'payroll', 'create'),
('Update Payroll', 'Modify payroll data', 'payroll', 'payroll', 'update'),
('Delete Payroll', 'Remove payroll records', 'payroll', 'payroll', 'delete'),

-- Leave Management
('View Leave', 'View leave requests and policies', 'hr', 'leave', 'read'),
('Approve Leave', 'Approve or reject leave requests', 'hr', 'leave', 'approve'),
('Manage Leave Policies', 'Create and modify leave policies', 'hr', 'leave_policies', 'manage'),

-- Reports and Analytics
('View Reports', 'Access system reports', 'reports', 'reports', 'read'),
('Generate Reports', 'Create custom reports', 'reports', 'reports', 'create'),
('Export Data', 'Export system data', 'reports', 'data', 'export'),

-- System Administration
('Manage Roles', 'Create and modify user roles', 'admin', 'roles', 'manage'),
('Manage Permissions', 'Assign permissions to roles', 'admin', 'permissions', 'manage'),
('View Access Logs', 'View system access logs', 'admin', 'access_logs', 'read'),
('System Settings', 'Modify system configuration', 'admin', 'settings', 'manage'),

-- Company Management
('Manage Company', 'Modify company information', 'admin', 'company', 'manage'),
('Manage Subsidiaries', 'Create and modify subsidiaries', 'admin', 'subsidiaries', 'manage'),

-- Financial Management
('View Financial Data', 'Access financial information', 'finance', 'financial', 'read'),
('Manage Budgets', 'Create and modify budgets', 'finance', 'budgets', 'manage'),
('Process Payments', 'Handle payment processing', 'finance', 'payments', 'process')

ON CONFLICT (resource, action) DO NOTHING;

-- Insert default system roles with proper company_id
DO $$
DECLARE
    default_company_id UUID := '00000000-0000-0000-0000-000000000001';
    super_admin_role_id UUID;
    hr_manager_role_id UUID;
    payroll_manager_role_id UUID;
    employee_role_id UUID;
BEGIN
    -- Insert default roles
    INSERT INTO public.roles (id, company_id, name, description, code, level, is_system_role) VALUES
    (uuid_generate_v4(), default_company_id, 'Super Admin', 'Full system access', 'SUPER_ADMIN', 10, TRUE),
    (uuid_generate_v4(), default_company_id, 'HR Manager', 'HR operations management', 'HR_MANAGER', 8, TRUE),
    (uuid_generate_v4(), default_company_id, 'Payroll Manager', 'Payroll processing', 'PAYROLL_MANAGER', 7, TRUE),
    (uuid_generate_v4(), default_company_id, 'Employee', 'Self-service access', 'EMPLOYEE', 1, TRUE)
    ON CONFLICT (company_id, code) DO NOTHING;

    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM public.roles WHERE code = 'SUPER_ADMIN' AND company_id = default_company_id;
    SELECT id INTO hr_manager_role_id FROM public.roles WHERE code = 'HR_MANAGER' AND company_id = default_company_id;
    SELECT id INTO payroll_manager_role_id FROM public.roles WHERE code = 'PAYROLL_MANAGER' AND company_id = default_company_id;
    SELECT id INTO employee_role_id FROM public.roles WHERE code = 'EMPLOYEE' AND company_id = default_company_id;

    -- Assign all permissions to Super Admin
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT super_admin_role_id, p.id FROM public.permissions p
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign HR permissions to HR Manager
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT hr_manager_role_id, p.id FROM public.permissions p 
    WHERE p.category IN ('hr', 'reports') OR p.resource IN ('employees', 'leave')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign Payroll permissions to Payroll Manager
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT payroll_manager_role_id, p.id FROM public.permissions p 
    WHERE p.category IN ('payroll', 'finance') OR p.resource IN ('payroll', 'financial')
    ON CONFLICT (role_id, permission_id) DO NOTHING;

    -- Assign basic permissions to Employee
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT employee_role_id, p.id FROM public.permissions p 
    WHERE p.action = 'read' AND p.resource IN ('employees', 'leave')
    ON CONFLICT (role_id, permission_id) DO NOTHING;
END $$;

-- Enable Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view roles in their company" ON public.roles
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.employees WHERE id = (select auth.uid())
    ));

CREATE POLICY "Admins can manage roles in their company" ON public.roles
    FOR ALL USING (company_id IN (
        SELECT e.company_id FROM public.employees e
        JOIN public.user_roles ur ON e.id = ur.employee_id
        JOIN public.roles r ON ur.role_id = r.id
        JOIN public.role_permissions rp ON r.id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE e.id = (select auth.uid()) AND p.resource = 'roles' AND p.action = 'manage'
    ));

CREATE POLICY "Everyone can view permissions" ON public.permissions FOR SELECT USING (true);

CREATE POLICY "Users can view role permissions" ON public.role_permissions FOR SELECT USING (true);

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (employee_id = (select auth.uid()));

CREATE POLICY "Users can view access logs in their company" ON public.access_logs
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.employees WHERE id = (select auth.uid())
    ));

CREATE POLICY "Users can insert their own access logs" ON public.access_logs
    FOR INSERT WITH CHECK (employee_id = (select auth.uid()));

CREATE POLICY "Users can view security analytics in their company" ON public.security_analytics
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM public.employees WHERE id = (select auth.uid())
    ));

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_analytics_updated_at BEFORE UPDATE ON public.security_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log access attempts
CREATE OR REPLACE FUNCTION log_access_attempt(
    p_employee_id UUID,
    p_company_id UUID,
    p_action VARCHAR(100),
    p_resource VARCHAR(100) DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT TRUE,
    p_failure_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.access_logs (
        employee_id, company_id, action, resource, ip_address, 
        user_agent, success, failure_reason, metadata
    ) VALUES (
        p_employee_id, p_company_id, p_action, p_resource, p_ip_address,
        p_user_agent, p_success, p_failure_reason, p_metadata
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_employee_id UUID,
    p_resource VARCHAR(100),
    p_action VARCHAR(50)
)
RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.employee_id = p_employee_id 
        AND ur.is_active = TRUE
        AND p.resource = p_resource 
        AND p.action = p_action
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate security insights
CREATE OR REPLACE FUNCTION generate_security_insight(
    p_company_id UUID,
    p_analysis_type VARCHAR(50),
    p_severity VARCHAR(20),
    p_title VARCHAR(200),
    p_description TEXT,
    p_recommendations JSONB DEFAULT NULL,
    p_affected_users UUID[] DEFAULT NULL,
    p_affected_roles UUID[] DEFAULT NULL,
    p_risk_score INTEGER DEFAULT NULL,
    p_confidence_score NUMERIC(3,2) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    insight_id UUID;
BEGIN
    INSERT INTO public.security_analytics (
        company_id, analysis_type, severity, title, description,
        recommendations, affected_users, affected_roles, risk_score, confidence_score
    ) VALUES (
        p_company_id, p_analysis_type, p_severity, p_title, p_description,
        p_recommendations, p_affected_users, p_affected_roles, p_risk_score, p_confidence_score
    ) RETURNING id INTO insight_id;
    
    RETURN insight_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for role statistics
CREATE OR REPLACE VIEW role_statistics AS
SELECT 
    r.company_id,
    COUNT(DISTINCT r.id) as total_roles,
    COUNT(DISTINCT CASE WHEN r.is_active THEN r.id END) as active_roles,
    COUNT(DISTINCT ur.employee_id) as users_with_roles,
    COUNT(DISTINCT rp.permission_id) as total_permissions
FROM public.roles r
LEFT JOIN public.user_roles ur ON r.id = ur.role_id AND ur.is_active = TRUE
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
GROUP BY r.company_id;

-- Create view for user access summary
CREATE OR REPLACE VIEW user_access_summary AS
SELECT 
    e.id as employee_id,
    e.full_name,
    e.company_id,
    COUNT(DISTINCT ur.role_id) as role_count,
    COUNT(DISTINCT rp.permission_id) as permission_count,
    MAX(r.level) as highest_role_level,
    COUNT(DISTINCT al.id) FILTER (WHERE al.created_at >= NOW() - INTERVAL '30 days') as recent_access_count
FROM public.employees e
LEFT JOIN public.user_roles ur ON e.id = ur.employee_id AND ur.is_active = TRUE
LEFT JOIN public.roles r ON ur.role_id = r.id
LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
LEFT JOIN public.access_logs al ON e.id = al.employee_id
GROUP BY e.id, e.full_name, e.company_id;

COMMENT ON TABLE public.roles IS 'Stores role definitions for access control';
COMMENT ON TABLE public.permissions IS 'Stores available system permissions';
COMMENT ON TABLE public.role_permissions IS 'Maps permissions to roles (many-to-many)';
COMMENT ON TABLE public.user_roles IS 'Assigns roles to users/employees';
COMMENT ON TABLE public.access_logs IS 'Tracks user access attempts and security events';
COMMENT ON TABLE public.security_analytics IS 'Stores AI-generated security insights and recommendations';
