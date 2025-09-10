-- Fix Supabase Security Warnings: Function Search Path Mutable
-- This script addresses security warnings by setting explicit search_path for all functions

-- 1. Fix update_system_currency function
DROP FUNCTION IF EXISTS public.update_system_currency(text);
CREATE OR REPLACE FUNCTION public.update_system_currency(new_currency text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE company_settings 
    SET currency = new_currency, 
        updated_at = NOW()
    WHERE company_id = auth.uid();
END;
$$;

-- 2. Fix get_subsidiary_stats function
DROP FUNCTION IF EXISTS public.get_subsidiary_stats(uuid);
CREATE OR REPLACE FUNCTION public.get_subsidiary_stats(subsidiary_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'divisions', COALESCE(array_length(divisions, 1), 0),
        'departments', COALESCE(array_length(departments, 1), 0),
        'locations', COALESCE(array_length(locations, 1), 0),
        'employees', (SELECT COUNT(*) FROM employees WHERE subsidiary_id = get_subsidiary_stats.subsidiary_id)
    ) INTO result
    FROM subsidiaries 
    WHERE id = subsidiary_id;
    
    RETURN COALESCE(result, '{"divisions":0,"departments":0,"locations":0,"employees":0}'::json);
END;
$$;

-- 3. Fix cleanup_subsidiary_logo function
DROP FUNCTION IF EXISTS public.cleanup_subsidiary_logo();
CREATE OR REPLACE FUNCTION public.cleanup_subsidiary_logo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Clean up logo file when subsidiary is deleted
    IF OLD.logo_file_id IS NOT NULL THEN
        DELETE FROM company_files WHERE id = OLD.logo_file_id;
    END IF;
    RETURN OLD;
END;
$$;

-- 4. Fix update_updated_at_column function
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- 5. Fix log_access_attempt function
DROP FUNCTION IF EXISTS public.log_access_attempt(text, text, boolean, text);
CREATE OR REPLACE FUNCTION public.log_access_attempt(
    resource_type text,
    resource_id text,
    success boolean,
    details text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO access_logs (
        user_id,
        resource_type,
        resource_id,
        action,
        success,
        details,
        ip_address,
        user_agent,
        created_at
    ) VALUES (
        auth.uid(),
        resource_type,
        resource_id,
        'access',
        success,
        details,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent',
        NOW()
    );
END;
$$;

-- 6. Fix check_user_permission function
DROP FUNCTION IF EXISTS public.check_user_permission(text);
CREATE OR REPLACE FUNCTION public.check_user_permission(permission_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    has_permission boolean := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND p.name = permission_name
        AND ur.is_active = true
        AND rp.is_active = true
    ) INTO has_permission;
    
    RETURN has_permission;
END;
$$;

-- 7. Fix generate_security_insight function
DROP FUNCTION IF EXISTS public.generate_security_insight(text, json);
CREATE OR REPLACE FUNCTION public.generate_security_insight(
    insight_type text,
    data json
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    insight_id uuid;
BEGIN
    INSERT INTO security_analytics (
        company_id,
        insight_type,
        severity,
        title,
        description,
        recommendations,
        data,
        created_at
    ) VALUES (
        (SELECT company_id FROM employees WHERE user_id = auth.uid() LIMIT 1),
        insight_type,
        CASE 
            WHEN data->>'risk_level' = 'high' THEN 'high'
            WHEN data->>'risk_level' = 'medium' THEN 'medium'
            ELSE 'low'
        END,
        data->>'title',
        data->>'description',
        COALESCE(data->'recommendations', '[]'::json),
        data,
        NOW()
    ) RETURNING id INTO insight_id;
    
    RETURN insight_id;
END;
$$;

-- Recreate triggers with updated functions
DROP TRIGGER IF EXISTS cleanup_subsidiary_logo_trigger ON subsidiaries;
CREATE TRIGGER cleanup_subsidiary_logo_trigger
    BEFORE DELETE ON subsidiaries
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_subsidiary_logo();

DROP TRIGGER IF EXISTS update_subsidiaries_updated_at ON subsidiaries;
CREATE TRIGGER update_subsidiaries_updated_at
    BEFORE UPDATE ON subsidiaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.update_system_currency(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subsidiary_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_access_attempt(text, text, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_permission(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_security_insight(text, json) TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.update_system_currency(text) IS 'Updates system currency with secure search path';
COMMENT ON FUNCTION public.get_subsidiary_stats(uuid) IS 'Gets subsidiary statistics with secure search path';
COMMENT ON FUNCTION public.cleanup_subsidiary_logo() IS 'Cleans up subsidiary logo files with secure search path';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Updates updated_at timestamp with secure search path';
COMMENT ON FUNCTION public.log_access_attempt(text, text, boolean, text) IS 'Logs access attempts with secure search path';
COMMENT ON FUNCTION public.check_user_permission(text) IS 'Checks user permissions with secure search path';
COMMENT ON FUNCTION public.generate_security_insight(text, json) IS 'Generates security insights with secure search path';
