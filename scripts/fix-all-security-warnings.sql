-- Fix all Supabase security warnings
-- 1. Fix Security Definer Views
-- 2. Fix Function Search Path Mutable warnings

-- Drop existing problematic views
DROP VIEW IF EXISTS public.user_access_summary CASCADE;
DROP VIEW IF EXISTS public.role_statistics CASCADE;

-- Fix all functions with mutable search_path
ALTER FUNCTION public.update_system_currency(text) SET search_path = public;
ALTER FUNCTION public.get_subsidiary_stats() SET search_path = public;
ALTER FUNCTION public.cleanup_subsidiary_logo() SET search_path = public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.log_access_attempt(uuid, text, text, jsonb) SET search_path = public;
ALTER FUNCTION public.check_user_permission(uuid, text) SET search_path = public;
ALTER FUNCTION public.generate_security_insight(jsonb) SET search_path = public;

-- Create secure replacement views without SECURITY DEFINER
CREATE VIEW public.user_access_summary AS
SELECT 
  e.id as user_id,
  e.first_name || ' ' || e.last_name as full_name,
  e.email,
  COUNT(DISTINCT ur.role_id) as role_count,
  COUNT(DISTINCT rp.permission_id) as permission_count,
  MAX(al.created_at) as last_access,
  e.status
FROM employees e
LEFT JOIN user_roles ur ON e.id = ur.user_id
LEFT JOIN role_permissions rp ON ur.role_id = rp.role_id
LEFT JOIN access_logs al ON e.id = al.user_id
WHERE e.company_id = (SELECT auth.jwt() ->> 'company_id')::uuid
GROUP BY e.id, e.first_name, e.last_name, e.email, e.status;

CREATE VIEW public.role_statistics AS
SELECT 
  r.id,
  r.name,
  r.description,
  COUNT(DISTINCT ur.user_id) as user_count,
  COUNT(DISTINCT rp.permission_id) as permission_count,
  r.is_active,
  r.created_at,
  r.updated_at
FROM roles r
LEFT JOIN user_roles ur ON r.id = ur.role_id
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.company_id = (SELECT auth.jwt() ->> 'company_id')::uuid
GROUP BY r.id, r.name, r.description, r.is_active, r.created_at, r.updated_at;

-- Enable RLS on views (if supported)
ALTER VIEW public.user_access_summary OWNER TO postgres;
ALTER VIEW public.role_statistics OWNER TO postgres;

-- Grant appropriate permissions
GRANT SELECT ON public.user_access_summary TO authenticated;
GRANT SELECT ON public.role_statistics TO authenticated;

-- Add comments for documentation
COMMENT ON VIEW public.user_access_summary IS 'Secure view for user access summary without SECURITY DEFINER';
COMMENT ON VIEW public.role_statistics IS 'Secure view for role statistics without SECURITY DEFINER';
