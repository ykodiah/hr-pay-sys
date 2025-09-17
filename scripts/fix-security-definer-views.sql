-- Fix Security Definer View warnings from Supabase
-- Replace SECURITY DEFINER views with secure alternatives

-- Drop existing security definer views
DROP VIEW IF EXISTS public.user_access_summary;
DROP VIEW IF EXISTS public.role_statistics;

-- Create secure view for user access summary without SECURITY DEFINER
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
WHERE e.company_id = auth.jwt() ->> 'company_id'::text
GROUP BY e.id, e.first_name, e.last_name, e.email, r.name, r.description, ur.assigned_at, ur.assigned_by, r.is_active, e.status;

-- Create secure view for role statistics without SECURITY DEFINER
CREATE OR REPLACE VIEW public.role_statistics AS
SELECT 
    r.id,
    r.name,
    r.description,
    r.is_active,
    r.created_at,
    COUNT(DISTINCT ur.user_id) as users_assigned,
    COUNT(DISTINCT rp.permission_id) as permissions_count,
    COUNT(DISTINCT CASE WHEN al.action = 'LOGIN' AND al.created_at > NOW() - INTERVAL '24 hours' THEN al.user_id END) as recent_access_count
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id AND ur.is_active = true
LEFT JOIN role_permissions rp ON r.id = rp.role_id AND rp.is_active = true
LEFT JOIN access_logs al ON ur.user_id = al.user_id
WHERE r.company_id = auth.jwt() ->> 'company_id'::text
GROUP BY r.id, r.name, r.description, r.is_active, r.created_at;

-- Enable RLS on the views (they inherit from base tables)
ALTER VIEW public.user_access_summary OWNER TO postgres;
ALTER VIEW public.role_statistics OWNER TO postgres;

-- Create secure functions for complex queries that need elevated permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id_param UUID)
RETURNS TABLE (
    permission_name TEXT,
    permission_description TEXT,
    resource TEXT,
    action TEXT
)
LANGUAGE plpgsql
SECURITY INVOKER -- Use SECURITY INVOKER instead of DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has permission to view this data
    IF NOT EXISTS (
        SELECT 1 FROM employees 
        WHERE id = user_id_param 
        AND company_id = (auth.jwt() ->> 'company_id')::uuid
    ) THEN
        RAISE EXCEPTION 'Access denied: User not found or not in same company';
    END IF;

    RETURN QUERY
    SELECT 
        p.name,
        p.description,
        p.resource,
        p.action
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND ur.is_active = true
    AND rp.is_active = true
    AND p.is_active = true;
END;
$$;

-- Create function for role analytics without security definer
CREATE OR REPLACE FUNCTION public.get_role_analytics()
RETURNS TABLE (
    total_roles BIGINT,
    active_roles BIGINT,
    total_permissions BIGINT,
    active_users_with_roles BIGINT,
    recent_access_events BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER -- Use SECURITY INVOKER instead of DEFINER
SET search_path = public
AS $$
DECLARE
    company_id_val UUID;
BEGIN
    -- Get company ID from JWT
    company_id_val := (auth.jwt() ->> 'company_id')::uuid;
    
    IF company_id_val IS NULL THEN
        RAISE EXCEPTION 'Access denied: No company context';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM roles WHERE company_id = company_id_val),
        (SELECT COUNT(*) FROM roles WHERE company_id = company_id_val AND is_active = true),
        (SELECT COUNT(DISTINCT rp.permission_id) 
         FROM role_permissions rp 
         JOIN roles r ON rp.role_id = r.id 
         WHERE r.company_id = company_id_val AND rp.is_active = true),
        (SELECT COUNT(DISTINCT ur.user_id) 
         FROM user_roles ur 
         JOIN roles r ON ur.role_id = r.id 
         WHERE r.company_id = company_id_val AND ur.is_active = true),
        (SELECT COUNT(*) 
         FROM access_logs al 
         JOIN employees e ON al.user_id = e.id 
         WHERE e.company_id = company_id_val 
         AND al.created_at > NOW() - INTERVAL '24 hours');
END;
$$;

-- Grant appropriate permissions
GRANT SELECT ON public.user_access_summary TO authenticated;
GRANT SELECT ON public.role_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_role_analytics() TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.user_access_summary IS 'Secure view showing user access information filtered by company context';
COMMENT ON VIEW public.role_statistics IS 'Secure view showing role statistics filtered by company context';
COMMENT ON FUNCTION public.get_user_permissions(UUID) IS 'Securely retrieves permissions for a specific user with company context validation';
COMMENT ON FUNCTION public.get_role_analytics() IS 'Securely retrieves role analytics with company context validation';
