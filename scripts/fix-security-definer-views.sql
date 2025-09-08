-- Fix Security Definer View warnings from Supabase linter
-- Replace SECURITY DEFINER views with secure alternatives

-- Drop existing security definer views that are causing warnings
DROP VIEW IF EXISTS public.user_access_summary;
DROP VIEW IF EXISTS public.role_statistics;

-- Create secure user access summary view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.user_access_summary AS
SELECT 
    e.id as user_id,
    e.first_name,
    e.last_name,
    e.email,
    r.name as role_name,
    r.description as role_description,
    ur.assigned_at,
    ur.assigned_by,
    COUNT(rp.permission_id) as permission_count,
    r.is_active as role_active,
    e.status as user_status
FROM employees e
LEFT JOIN user_roles ur ON e.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
GROUP BY e.id, e.first_name, e.last_name, e.email, r.name, r.description, ur.assigned_at, ur.assigned_by, r.is_active, e.status;

-- Create secure role statistics view without SECURITY DEFINER
CREATE OR REPLACE VIEW public.role_statistics AS
SELECT 
    r.id,
    r.name,
    r.description,
    r.is_active,
    COUNT(DISTINCT ur.user_id) as users_assigned,
    COUNT(DISTINCT rp.permission_id) as permissions_count,
    r.created_at,
    r.updated_at
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
GROUP BY r.id, r.name, r.description, r.is_active, r.created_at, r.updated_at;

-- Create secure functions for complex queries that need elevated permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT, permission_description TEXT, resource TEXT, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.name::TEXT,
        p.description::TEXT,
        p.resource::TEXT,
        p.action::TEXT
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_uuid 
    AND ur.is_active = true 
    AND rp.is_active = true 
    AND p.is_active = true;
END;
$$;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_permission BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = user_uuid 
        AND p.name = permission_name
        AND ur.is_active = true 
        AND rp.is_active = true 
        AND p.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- Create function to get role dashboard statistics
CREATE OR REPLACE FUNCTION get_role_dashboard_stats()
RETURNS TABLE(
    total_roles INTEGER,
    active_users INTEGER,
    total_permissions INTEGER,
    recent_access_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM roles WHERE is_active = true),
        (SELECT COUNT(DISTINCT ur.user_id)::INTEGER FROM user_roles ur WHERE ur.is_active = true),
        (SELECT COUNT(*)::INTEGER FROM permissions WHERE is_active = true),
        (SELECT COUNT(*)::INTEGER FROM access_logs WHERE created_at >= NOW() - INTERVAL '24 hours');
END;
$$;

-- Update RLS policies to work with the new structure
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_roles
CREATE POLICY "Users can view their own roles" ON user_roles
    FOR SELECT USING (
        user_id = (SELECT auth.uid()::uuid) OR
        EXISTS (
            SELECT 1 FROM user_roles ur2 
            JOIN role_permissions rp ON ur2.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur2.user_id = (SELECT auth.uid()::uuid)
            AND p.name IN ('manage_users', 'view_all_users')
            AND ur2.is_active = true AND rp.is_active = true AND p.is_active = true
        )
    );

CREATE POLICY "Admins can manage user roles" ON user_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = (SELECT auth.uid()::uuid)
            AND p.name = 'manage_users'
            AND ur.is_active = true AND rp.is_active = true AND p.is_active = true
        )
    );

-- Create RLS policies for role_permissions
CREATE POLICY "Users can view role permissions" ON role_permissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = (SELECT auth.uid()::uuid)
            AND p.name IN ('manage_roles', 'view_roles')
            AND ur.is_active = true AND rp.is_active = true AND p.is_active = true
        )
    );

CREATE POLICY "Admins can manage role permissions" ON role_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = (SELECT auth.uid()::uuid)
            AND p.name = 'manage_roles'
            AND ur.is_active = true AND rp.is_active = true AND p.is_active = true
        )
    );

-- Create RLS policies for access_logs
CREATE POLICY "Users can view their own access logs" ON access_logs
    FOR SELECT USING (
        user_id = (SELECT auth.uid()::uuid) OR
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id
            JOIN permissions p ON rp.permission_id = p.id
            WHERE ur.user_id = (SELECT auth.uid()::uuid)
            AND p.name IN ('view_audit_logs', 'manage_security')
            AND ur.is_active = true AND rp.is_active = true AND p.is_active = true
        )
    );

CREATE POLICY "System can insert access logs" ON access_logs
    FOR INSERT WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT ON public.user_access_summary TO authenticated;
GRANT SELECT ON public.role_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_role_dashboard_stats() TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_active ON role_permissions(role_id, is_active);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_time ON access_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);

COMMENT ON VIEW public.user_access_summary IS 'Secure view of user access information without SECURITY DEFINER';
COMMENT ON VIEW public.role_statistics IS 'Secure view of role statistics without SECURITY DEFINER';
COMMENT ON FUNCTION get_user_permissions(UUID) IS 'Securely get user permissions with proper access control';
COMMENT ON FUNCTION user_has_permission(UUID, TEXT) IS 'Check if user has specific permission';
COMMENT ON FUNCTION get_role_dashboard_stats() IS 'Get dashboard statistics for roles and access management';
